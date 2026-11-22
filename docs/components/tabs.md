# Tabs

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `tabs` |
| Kind | `ui` |
| Category | `navigation` |
| Custom elements | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` |
| Root element and class | `ui-tabs` `.rp-tabs` |
| Liquid tier | `parts` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | none |
| Milestone | M2 |

### Purpose

A row of tab buttons that shows one panel of content at a time. It is the UI SDK tabs (`ui-tabs`), loaded lazily, with the complete selected state pre-rendered by the server so that the upgrade changes nothing (D-012). V1 Tabs is horizontal only: there is no `orientation` prop.

- Use when: two to six peer sections of comparable content share one place and reading all of them at once is not needed (product details / shipping / reviews).
- Do not use when: every section must be reachable without JavaScript in every browser, or be found by in-page search (use Accordion); the sections are pages (use Links, or NavigationMenu); there are more than six sections or the labels are long (use Accordion).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Tabs` | `blocks/tabs.liquid` | `ui-tabs` | `rp-tabs` | `data-slot="tabs"` | yes | `<id>` |
| list | `TabsList` | `blocks/tabs-list.liquid` | `ui-tabs-list` | `rp-tabs-list` | `data-slot="tabs-list"` | yes | none |
| tab | `TabsTab` | `blocks/tabs-tab.liquid` | `ui-tabs-tab` wrapping one `button` | `rp-tabs-tab` (on the `button`; `ui-tabs-tab` has no class) | `data-slot="tabs-tab"` (on the `button`) | yes, at least two | `<id>-tab-<value>` (on the `button`) |
| panel | `TabsPanel` | `blocks/tabs-panel.liquid` | `ui-tabs-panel` | `rp-tabs-panel` | `data-slot="tabs-panel"` | yes, one per tab | `<id>-panel-<value>` (printed on the selected panel only) |

Nesting rules:

1. The children of the root are, in this order: exactly one list, then the panels. Nothing else.
2. The list contains only tab parts. There MUST be at least two tabs.
3. Every tab has exactly one panel with the same `value`, and every panel has exactly one tab. Panels are in the same order as their tabs.
4. Exactly one tab and its panel are selected in server HTML: the pair whose `value` equals the root's `defaultValue`. The author passes `selected` to BOTH parts of that pair, because a part cannot read the root's state (D-012, D-020; `06-bindings.md` B-6).
5. A tab contains text, optionally with an Icon. It MUST NOT contain interactive content.
6. A panel contains any flow content. A panel MAY contain an Accordion; it MUST NOT contain another Tabs root with the same `id`.
7. Orientation is horizontal only in V1 (D-012; `00-decisions.md` section 11 item 18). There is no `orientation` prop in any host; every element that carries `data-orientation` prints `horizontal`.

### Props

Root (`Tabs`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on the root |
| `defaultValue` | `default_value` | string | the `value` of one tab | none | yes | no | `default-value` on the root. Never the attribute `value`. |
| `value` | none (React only) | string | the `value` of one tab | none | no | no | no attribute; property `value` of `ui-tabs` through `useElement` |
| `onValueChange` | none (React only) | callback | `(value: string, detail: ValueChangeDetail) => void` | none | no | no | no attribute; listener for `valuechange` through `useElement` |

List (`TabsList`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `ariaLabel` | `aria_label` | string | any non-empty text | none | yes | no | `aria-label` on `ui-tabs-list` |

Tab (`TabsTab`) and panel (`TabsPanel`), same table for both:

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `tabs` | `tabs` | id | the `id` of the Tabs root | none | yes | no | tab: `id="<tabs>-tab-<value>"` on the button and, when selected, `aria-controls="<tabs>-panel-<value>"`; panel, when selected: `id="<tabs>-panel-<value>"` and `aria-labelledby="<tabs>-tab-<value>"` |
| `value` | `value` | string | matches `^[a-z0-9][a-z0-9_-]*$`; unique among the tabs of one root | none | yes | no | `value` on `ui-tabs-tab` / on `ui-tabs-panel` |
| `selected` | `selected` | boolean | `true` `false` | `false` | no | no | the selected or unselected attribute set of "HTML contract" |

`class` and rest props / `attributes`: on `Tabs` they apply to `ui-tabs`; on `TabsList` to `ui-tabs-list`; on `TabsTab` to the `<button>`; on `TabsPanel` to `ui-tabs-panel`.

### Content model

`parts` - the children of `Tabs` are one `TabsList` and the `TabsPanel`s. `TabsList` takes `TabsTab`s only. `TabsTab` takes text and an optional Icon. `TabsPanel` takes any flow content.

### HTML contract

The attribute sets, per element (this is the exact snapshot UI SDK produces; any difference causes attribute writes at upgrade):

| Element | Attributes, in addition to class |
|---|---|
| `ui-tabs` | `id`, `default-value="<defaultValue>"`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs"` |
| `ui-tabs-list` | `aria-label`, `role="tablist"`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-list"` |
| `ui-tabs-tab` (every one) | `value`, `role="none"`; no class |
| selected tab `button` | `type="button"`, `role="tab"`, `id="<id>-tab-<value>"`, `aria-controls="<id>-panel-<value>"`, `aria-selected="true"`, `tabindex="0"`, `data-selected`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-tab"` |
| every other tab `button` | `type="button"`, `role="tab"`, `id="<id>-tab-<value>"`, `aria-selected="false"`, `tabindex="-1"`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-tab"`. NO `aria-controls`. |
| selected `ui-tabs-panel` | `value`, `role="tabpanel"`, `id="<id>-panel-<value>"`, `aria-labelledby="<id>-tab-<value>"`, `tabindex="0"`, `data-selected`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-panel"` |
| every other `ui-tabs-panel` | `value`, `hidden`, `data-slot="tabs-panel"` and nothing else (no `role`, no `id`, no `aria-labelledby`) |

Fixture `default` (`id="t"`, `defaultValue="account"`; list `ariaLabel="Settings"`; tabs `account` (selected) and `password`):

```html
<ui-tabs class="rp-tabs" id="t" default-value="account" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list class="rp-tabs-list" aria-label="Settings" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="account" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-account" aria-controls="t-panel-account" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-password" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel class="rp-tabs-panel" value="account" role="tabpanel" id="t-panel-account" aria-labelledby="t-tab-account" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel"><p>Manage your profile.</p></ui-tabs-panel>
  <ui-tabs-panel class="rp-tabs-panel" value="password" hidden data-slot="tabs-panel"><p>Choose a new password.</p></ui-tabs-panel>
</ui-tabs>
```

Fixture `second-selected` (`id="t"`, `defaultValue="password"`; `selected` on the second tab and panel):

```html
<ui-tabs class="rp-tabs" id="t" default-value="password" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list class="rp-tabs-list" aria-label="Settings" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="account" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-account" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-password" aria-controls="t-panel-password" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel class="rp-tabs-panel" value="account" hidden data-slot="tabs-panel"><p>Manage your profile.</p></ui-tabs-panel>
  <ui-tabs-panel class="rp-tabs-panel" value="password" role="tabpanel" id="t-panel-password" aria-labelledby="t-tab-password" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel"><p>Choose a new password.</p></ui-tabs-panel>
</ui-tabs>
```

Fixture `class` (as `default`, with `class="custom-a custom-b"` on the root, `class="custom-c"` on the first tab and `class="custom-d"` on the first panel):

```html
<ui-tabs class="rp-tabs custom-a custom-b" id="t" default-value="account" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list class="rp-tabs-list" aria-label="Settings" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="account" role="none"><button class="rp-tabs-tab custom-c" type="button" role="tab" id="t-tab-account" aria-controls="t-panel-account" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-password" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel class="rp-tabs-panel custom-d" value="account" role="tabpanel" id="t-panel-account" aria-labelledby="t-tab-account" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel"><p>Manage your profile.</p></ui-tabs-panel>
  <ui-tabs-panel class="rp-tabs-panel" value="password" hidden data-slot="tabs-panel"><p>Choose a new password.</p></ui-tabs-panel>
</ui-tabs>
```

Fixture `escaping` (as `default`, with list `ariaLabel` set to the text `Say "hi" & <go>`):

```html
<ui-tabs class="rp-tabs" id="t" default-value="account" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list class="rp-tabs-list" aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="account" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-account" aria-controls="t-panel-account" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-password" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel class="rp-tabs-panel" value="account" role="tabpanel" id="t-panel-account" aria-labelledby="t-tab-account" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel"><p>Manage your profile.</p></ui-tabs-panel>
  <ui-tabs-panel class="rp-tabs-panel" value="password" hidden data-slot="tabs-panel"><p>Choose a new password.</p></ui-tabs-panel>
</ui-tabs>
```

The `escaping` fixture targets `ariaLabel` of the list and not `defaultValue` of the root (D-012, D-074 item 3), because a tab value is restricted to `^[a-z0-9][a-z0-9_-]*$` (`02-html-contract.md` N-10) and can never need escaping. Tabs has no enumerated prop, so it has no `invalid-enum-falls-back` fixture, and no responsive prop, so it has no `responsive` fixture (D-074 item 3; `02-html-contract.md` F-13, F-14).

The server MUST NOT print: the attribute `value` on `ui-tabs`; `aria-controls` on an unselected tab; `role`, `id`, `aria-labelledby` or `tabindex` on an unselected panel; `aria-hidden` anywhere; `disabled` on a tab (V1 has no disabled tabs).

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-selected` | tab button | element (UI SDK) | `true` on the selected tab, `false` on the others | as in the contract |
| `tabindex` | tab button | element (UI SDK) | `0` on the selected tab, `-1` on the others | as in the contract |
| `data-selected` | tab button, panel | element (UI SDK) | present on the selected pair | present on the selected pair |
| `aria-controls` | tab button | element (UI SDK) | present while the tab's panel is shown | on the selected tab only |
| `hidden` | panel | element (UI SDK) | present on every unselected panel | on every unselected panel |
| `role`, `id`, `aria-labelledby`, `tabindex`, `data-orientation` | panel | element (UI SDK) | written when a panel is first shown | on the selected panel only |
| `data-activation-direction` | root, list, tab button, panel | element (UI SDK) | `none`, or the direction of the last selection change (`left`, `right`) | `none` |
| `role="none"` | `ui-tabs-tab` | element (UI SDK) | same-value write at upgrade. Information only: a same-value write is not a mutation (D-002) and has no allow-list entry | `none` |

Manifest `state[]` lists exactly these names, except the last row: `role` on `ui-tabs-tab` never changes value, so it is not a state row and is not in any Remix preserve list. The Remix constants generated from it (`06-bindings.md` 7.3) are `TAB_STATE = "aria-controls aria-selected data-selected tabindex"`, `PANEL_STATE = "aria-labelledby data-activation-direction data-orientation data-selected hidden id role tabindex"`, `DIRECTION_STATE = "data-activation-direction"`.

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[]
```

The list is empty (D-071 item 4). `ui-tabs-tab` calls `setAttribute("role", "none")` on connect (`uisdk/packages/web/src/tabs.ts`); with `role="none"` printed by the server the value does not change. A `MutationObserver` still delivers a record for it, which the tier 3 judge reports as information and does not count (D-002).

### Behaviour with JavaScript

1. Loading: the `tabs` chunk is loaded by the lazy loader when the document contains a `ui-tabs` at `DOMContentLoaded` or one is inserted later (D-054 item 2). Before it has loaded, the selected panel is visible and the tab buttons are focusable but do nothing.
2. Upgrade: zero mutations. No attribute changes value; no node is added or removed; the selected panel does not change. The only observer records are the same-value `role="none"` writes on each `ui-tabs-tab`, which are not mutations (D-002).
3. A click on a tab selects it: the attributes of "State and attributes" move to the new pair, the previous panel gets `hidden`, the new panel loses it.
4. Keyboard, focus on a tab: ArrowRight and ArrowLeft move focus to the next and previous tab and select it at once (UI SDK default `activation: "automatic"`), wrapping at the ends (default `loop: true`); Home and End go to the first and last tab. In a right-to-left document the arrow keys are mirrored (UI SDK behaviour; UNVERIFIED).
5. Tab from the selected tab moves focus to the selected panel (`tabindex="0"`), then into its content.
6. `valuechange` is dispatched on `ui-tabs` BEFORE the selection changes; it is cancelable (D-023 item (b)): a listener that calls `preventDefault()` keeps the current tab selected (the veto is UNVERIFIED in a browser, D-036; AT-5 settles it).
7. Setting the property `ui-tabs.value` selects silently: no event (D-023 item 1). The React binding uses this for the controlled `value` prop.
8. The selected value is not written to the URL and is not restored on reload: after a reload the `defaultValue` tab is selected.
9. There is no motion on panels. The tab indicator colour fades over `--rp-duration-fast` under `prefers-reduced-motion: no-preference`.

### Behaviour without JavaScript

- In browsers that support `@media (scripting: none)` and have scripting disabled: the tab list is not displayed and EVERY panel is displayed, one below the other, in document order. Because the rendering with and without scripts differs on purpose, Tabs is exempt from the generic tier 6 "renders the same without scripts" comparison (D-012, D-063). This comes from the block of section 0.3 item 1 in `css/base.css` (D-021 item (d)):

  ```css
  @media (scripting: none) {
    ui-tabs-panel[hidden] {
      display: block !important;
    }
    ui-tabs-list {
      display: none !important;
    }
  }
  ```

  It is in `@layer ui-sdk`, in `base.css`, and MUST NOT be moved to `tabs.css`: the rule that hides `[hidden]` elements is `!important` in layer `ui-sdk` (D-021 item 2), and among `!important` declarations an EARLIER layer wins, so no `!important` rule in `rp.components` can override it (measured: `ripple/docs/research/spikes/components-interactive/t.mjs`). Inside the same layer, `ui-tabs-panel[hidden]` (specificity 0,1,1) beats the `:where()` rule (0,0,0).
- Because the tab list is hidden, panels lose their visible labels. A panel whose content is not self-explanatory MUST therefore start with its own heading or lead sentence.
- `tabs.css` adds `padding-block-end: var(--rp-tabs-gap)` to each panel under the same media query, to separate the stacked panels.
- In a browser with scripting disabled that does not support the media feature, and in a browser where the script failed to load (scripting is enabled, so the media query does not match): only the `defaultValue` panel is readable. Content that must always be reachable belongs in an Accordion.
- No control is marked `data-rp-js`.
- Manifest: `noJs.level: "degraded"`, `noJs.behavior: "With scripting disabled every panel is shown in order and the tab list is hidden. Where @media (scripting: none) is unsupported only the default panel is readable."`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `valuechange` | `ui-tabs` | `{ value: string, reason: "item-press" \| "list-navigation" \| "imperative" \| "item-removed" \| "find-in-page", source: string }`; not bubbling; cancelable | `onValueChange(value, detail)` |
| method | property `value` (settable) | `ui-tabs` | the `value` of a tab; silent | none (used by the controlled `value` prop) |

No command.

### Accessibility

- Pattern: APG "Tabs" with automatic activation; `checkPattern`: `tabs`.
- Accessible name: REQUIRED on the list, from `ariaLabel`. Each tab is named by its text; each shown panel by its tab through `aria-labelledby`.
- Focus: one tab stop for the whole list (roving `tabindex`); the shown panel is a tab stop (`tabindex="0"`). Selecting a tab does not move focus into the panel.
- Announcements: None. Screen readers announce the tab's selected state and position.

| Key | Action |
|---|---|
| Tab | Into the list (the selected tab), then to the shown panel, then into its content |
| ArrowRight / ArrowLeft | Next / previous tab, selected at once; wraps |
| Home / End | First / last tab, selected at once |
| Enter or Space | Selects the focused tab (it already is, with automatic activation) |

### Styling

- File: `components/tabs/tabs.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-md`, `--color-border`, `--color-muted-foreground`, `--color-foreground`, `--color-primary`, `--text-sm`, `--text-sm--line-height`, `--font-weight-medium`, `--rp-ring-width`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-tabs-gap` | `calc(var(--spacing) * 4)` | gap between the list and the panel |
| `--rp-tabs-tab-px` | `calc(var(--spacing) * 4)` | inline padding of a tab |
| `--rp-tabs-indicator-size` | `2px` | thickness of the selected-tab underline |

| Modifier selector | Sets |
|---|---|
| none | not applicable |

Rules specific to this file:

1. The selected tab is selected with `.rp-tabs-tab:is([data-selected], [aria-selected="true"])`: both attributes are in the contract, and the pair keeps the style correct if one is ever missing.
2. The file MUST NOT set `display` on `.rp-tabs-panel` and MUST NOT select `[hidden]`: visibility of panels is owned by the `[hidden]` rule and the `scripting: none` block of `base.css`.
3. The list scrolls horizontally (`overflow-x: auto`) when the tabs do not fit; tabs never wrap (`white-space: nowrap`, `flex: none`).
4. The static `display` of the four tags comes from `base.css` (`04-elements.md` 10.16 C-2): `block` for `ui-tabs`, `ui-tabs-list`, `ui-tabs-panel`; `contents` for `ui-tabs-tab`. `tabs.css` overrides the root and the list to `flex`.
5. The focus ring of a tab is drawn inside the tab (`outline-offset` negative) so that the scrolling list does not clip it.

Complete file:

```css
/* tabs.css
   Component: Tabs (id `tabs`). Contract: 10-components-interactive.md, "Tabs".
   Root:      <ui-tabs>, class rp-tabs
   Parts:     rp-tabs-list (<ui-tabs-list>)
              rp-tabs-tab (<button> inside <ui-tabs-tab>)
              rp-tabs-panel (<ui-tabs-panel>)
   Props:     none
   States:    [data-selected], [aria-selected="true"], :hover, :focus-visible
   Public:    --rp-tabs-gap, --rp-tabs-tab-px, --rp-tabs-indicator-size */
@layer rp.components {
  /* 1. ROOT */
  .rp-tabs {
    /* 1a. public custom properties */
    --rp-tabs-gap: calc(var(--spacing) * 4);
    --rp-tabs-tab-px: calc(var(--spacing) * 4);
    --rp-tabs-indicator-size: 2px;
    /* 1b. colour slots */
    /* 1c. other private custom properties */
    /* 1d. declarations */
    display: flex;
    flex-direction: column;
    gap: var(--rp-tabs-gap);
  }

  /* 2. PARTS */
  .rp-tabs-list {
    display: flex;
    flex: none;
    overflow-x: auto;
    border-block-end: 1px solid var(--color-border);
  }
  .rp-tabs-tab {
    flex: none;
    min-block-size: var(--spacing-control-md);
    margin: 0;
    padding-block: 0;
    padding-inline: var(--rp-tabs-tab-px);
    border: 0;
    border-block-end: var(--rp-tabs-indicator-size) solid transparent;
    border-radius: 0;
    background-color: transparent;
    color: var(--color-muted-foreground);
    font-family: inherit;
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    cursor: pointer;
  }
  .rp-tabs-panel {
    min-inline-size: 0;
  }

  /* 3. MODIFIERS */

  /* 4. STATES */
  @media (hover: hover) {
    .rp-tabs-tab:hover {
      color: var(--color-foreground);
    }
  }
  .rp-tabs-tab:focus-visible {
    outline-offset: calc(var(--rp-ring-width) * -1);
  }
  .rp-tabs-tab:is([data-selected], [aria-selected="true"]) {
    border-block-end-color: var(--color-primary);
    color: var(--color-foreground);
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-tabs-tab {
      transition-property: color, border-color;
      transition-duration: var(--rp-duration-fast);
      transition-timing-function: var(--ease-out);
    }
  }

  /* 6. ENVIRONMENT */
  @media (scripting: none) {
    .rp-tabs-panel {
      padding-block-end: var(--rp-tabs-gap);
    }
  }
}
```

### Host notes

- Binding paths (D-139): `ui` whose ids need two props (`<tabs>-tab-<value>`), which the template language cannot express: no `template`; fixtures are `generated: "upgrade-snapshot"` from hand-written seeds `components/tabs/fixtures/<name>.html` (doc 02 11.4); `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written from the complete code of `06-bindings.md` 6.6, 7.6 and 8.6, with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: copy the contract. Load `ripple.js` (the lazy loader fetches the `tabs` chunk) or `ripple.elements.js`.
- React: `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` in `tabs.tsx`, hand-written. Hand-written below the generated header region (D-072). The complete code is in `06-bindings.md` 6.6, which is a copy of this contract (D-069); when the two differ, the fixtures of this section win. Controlled prop: `value`. Callback: `onValueChange(value, detail)`. When `value` is passed the binding calls `event.preventDefault()` on every `valuechange` and re-applies `value` from React state. `selected` is read once (R-3). The file starts with `"use client"`; every custom element and the tab button carry `suppressHydrationWarning`.
- Remix: generated; code in `06-bindings.md` 7.6. Prints `data-rmx-key="<id>"` on `ui-tabs`; `data-rmx-preserve-attrs` with `DIRECTION_STATE` on `ui-tabs` and `ui-tabs-list`, `TAB_STATE` plus `DIRECTION_STATE` on each tab button, `PANEL_STATE` on each panel. No `value`, no callbacks.
- Liquid: four block files, generated: `tabs`, `tabs-list`, `tabs-tab`, `tabs-panel`. The code is in `06-bindings.md` 8.6. Schema settings: none (Tabs has no enumerated prop). `{{ attributes }}` is printed last (G-13). `selected: true` is passed to the tab and the panel of the default pair (L-9). Locale keys for strings the component prints: none (the author passes `aria_label`, normally through `| t`).

```tsx
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs";

export function ProductInfo() {
  return (
    <Tabs id="info" defaultValue="details">
      <TabsList ariaLabel="Product information">
        <TabsTab tabs="info" value="details" selected>Details</TabsTab>
        <TabsTab tabs="info" value="shipping">Shipping</TabsTab>
      </TabsList>
      <TabsPanel tabs="info" value="details" selected>
        <p>100% linen.</p>
      </TabsPanel>
      <TabsPanel tabs="info" value="shipping">
        <p>Ships in two days.</p>
      </TabsPanel>
    </Tabs>
  );
}
```

```liquid
{% block 'tabs', id: 'info', default_value: 'details' %}
  {% block 'tabs-list', aria_label: 'Product information' %}
    {% block 'tabs-tab', tabs: 'info', value: 'details', selected: true %}Details{% endblock %}
    {% block 'tabs-tab', tabs: 'info', value: 'shipping' %}Shipping{% endblock %}
  {% endblock %}
  {% block 'tabs-panel', tabs: 'info', value: 'details', selected: true %}
    <p>100% linen.</p>
  {% endblock %}
  {% block 'tabs-panel', tabs: 'info', value: 'shipping' %}
    <p>Ships in two days.</p>
  {% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`bridge`. Bridge component: `ui-tabs`. Actions: `setValue` (UI SDK's own action; argument: the `value` of a tab). Confirm: none. Secret: none. An agent that does not use the bridge activates a tab button by its name; the content of unselected panels is not in the accessibility tree until its tab is selected.

### Checker rules

- RP104: `id` or `defaultValue` missing on `Tabs`; `ariaLabel` missing on `TabsList`; `tabs` or `value` missing on a tab or a panel.
- RP113 with these manifest `rules[]` entries:
  - `tabs-needs-list`: kind `requires-descendant`, selector `ui-tabs.rp-tabs`, target `ui-tabs-list[role="tablist"][aria-label]`. Message: "Tabs has no labelled tab list." Fix: "Add one tabs-list with aria_label (TSX: ariaLabel)."
  - `tabs-one-list`: kind `max-count`, selector `ui-tabs.rp-tabs > ui-tabs-list`, count `1`. Message: "Tabs has more than one tab list." Fix: "Keep one tabs-list."
  - `tabs-one-selected-tab`: kind `max-count`, selector `ui-tabs.rp-tabs > ui-tabs-list [role="tab"][aria-selected="true"]`, count `1`. Message: "More than one tab is selected in server HTML." Fix: "Pass selected: true only to the tab and panel whose value equals default_value."
  - `tabs-needs-selected-tab`: kind `requires-descendant`, selector `ui-tabs.rp-tabs`, target `[role="tab"][aria-selected="true"]`. Message: "No tab is selected in server HTML." Fix: "Pass selected: true to the tab and the panel whose value equals default_value."
  - `tabs-needs-selected-panel`: kind `requires-descendant`, selector `ui-tabs.rp-tabs`, target `ui-tabs-panel[role="tabpanel"]:not([hidden])`. Message: "No panel is shown in server HTML." Fix: "Pass selected: true to the panel whose value equals default_value."
  - `tabs-tab-in-list`: kind `requires-ancestor`, selector `ui-tabs-tab`, target `ui-tabs-list`. Message: "A tab is outside the tab list." Fix: "Move tabs-tab inside tabs-list."
  - `tabs-panel-in-tabs`: kind `requires-ancestor`, selector `ui-tabs-panel`, target `ui-tabs`. Message: "A tab panel is outside Tabs." Fix: "Move tabs-panel inside tabs."
- RP114: tab ids MUST equal `<tabs id>-tab-<value>`; the shown panel id MUST equal `<tabs id>-panel-<value>`; the selected tab's `value` MUST equal the root's `default-value`; ids unique in the document.
- RP303 (a): a `[role="tabpanel"]` without `hidden` that is not the selected panel; an unselected panel without `hidden`.
- RP304 (warning): a component with `noJs.level: "full"` inside a tab panel.
- RP115: `role="tablist"` outside a Tabs root.

### Acceptance tests

1. T2: fixtures `default`, `second-selected`, `escaping`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: after `customElements.get("ui-tabs")` is defined, each fixture has zero mutations inside the root with an EMPTY allow-list. The observer records are exactly two (one per `ui-tabs-tab`), both of type `attributes`, attribute `role`, with `oldValue === "none"` and current value `"none"`; the judge reports them as same-value writes (information) and the test passes (D-002).
3. T5: a click on the second tab sets `aria-selected="true"`, `tabindex="0"`, `data-selected` and `aria-controls="t-panel-password"` on it; the first tab has `aria-selected="false"` and `tabindex="-1"`; the first panel has `hidden`; the second panel has no `hidden`, `role="tabpanel"`, `id="t-panel-password"` and `aria-labelledby="t-tab-password"`. Exactly one `valuechange` with `detail.value === "password"` and `detail.reason === "item-press"`.
4. T5: with focus on the first tab, ArrowRight focuses and selects the second (`reason === "list-navigation"`); ArrowRight again wraps to the first; End selects the last; Home the first.
5. T5: a `valuechange` listener that calls `preventDefault()` keeps the first tab selected after a click on the second.
6. T5: `checkPattern(document.getElementById("t"), "tabs")` from `@ui-sdk/core/testing` resolves.
7. T5 (CSS), viewport 1000 by 700, default tokens: the list has computed `display: flex` and a 1 px bottom border; each tab is 44 px high; the selected tab's `border-block-end-color` equals the computed `--color-primary`; the unselected panel has computed `display: none`.
8. T6 (Chromium, JavaScript disabled, so `matchMedia("(scripting: none)")` matches): both panels have a non-zero height and are stacked in document order; `ui-tabs-list` has computed `display: none`.
9. T6: with JavaScript ENABLED and the element chunk blocked (route abort), the first panel is visible, the second has computed `display: none`, and the tab list is visible.
10. T4 (React): hydration of `default` logs no warning in both script orders; with `value="account"` and an `onValueChange` that does not update state, a click on the second tab leaves the first selected and calls the callback once with `("password", detail)`.
11. T4 (Remix): after selecting the second tab, a morph navigation to a URL that renders the same Tabs with unchanged server HTML and the same `id` leaves the second tab selected and the `ui-tabs` element the same object (`06-bindings.md` Q-15).
12. T9: tests 2 to 5 pass in WebKit and Gecko.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-002, D-012, D-021, D-025, D-071; `ripple/docs/02-html-contract.md` 11.9 fixture 3 (the snapshot); `ripple/docs/04-elements.md` 10.7, 11.1, 11.3; `ripple/docs/06-bindings.md` 6.6, 7.3, 7.6, 8.6; `uisdk/packages/web/src/tabs.ts` (`render: (el) => el.setAttribute("role", "none")` on `ui-tabs-tab`); `uisdk/packages/core/src/components/tabs/tabs.ts` (defaults `activation: "automatic"`, `loop: true`; reasons `item-press`, `list-navigation`, `imperative`, `item-removed`, `find-in-page`); `uisdk/packages/core/src/testing/check-pattern.ts` (pattern `tabs`); Chromium 157 runs in `ripple/docs/research/spikes/components-interactive/`: `tabs.mjs` with `results-tabs.txt` (the classed `default` fixture upgrades with exactly two records, both same-value `role` writes on `ui-tabs-tab`; click, ArrowRight, End and Home select with reasons `item-press` and `list-navigation`; the event is cancelable; a panel that is hidden again keeps `role`, `id`, `aria-labelledby` and `tabindex`), `t.mjs` (layer order of `!important` declarations; the `scripting: none` block shows hidden panels when placed in layer `ui-sdk` and has no effect when placed in `rp.components`), `css-test.mjs` (test 7).
- UNVERIFIED: the veto through `preventDefault()` (the event was observed to be cancelable; the veto itself was not exercised; D-036; AT-5 and AT-10 settle it); arrow-key mirroring in right-to-left documents; support for `@media (scripting: none)` at the floor in WebKit and Gecko (SPIKE-06; AT-8 settles it).

### Fallback (SPIKE-06)

When SPIKE-06 finds that `@media (scripting: none)` is unsupported at the floor in WebKit or Gecko (expected for Safari 16.4 according to public compatibility tables; not run):

1. Nothing in the contract or the CSS changes. In those browsers, with scripting disabled, only the `defaultValue` panel is readable.
2. `noJs.behavior` already states this. Acceptance test 8 runs in Chromium only; in other engines it asserts instead that the default panel is visible.
3. The `ripple` and `ripple-compose-page` skills (`08-agent-kit-and-evals.md`, D-060) carry the rule: "Content that must be reachable without JavaScript MUST NOT be placed in Tabs; use Accordion."
4. Ripple MUST NOT add a `<noscript>` style block or an inline script to change this: both would differ per host and break fixture conformance.

---
