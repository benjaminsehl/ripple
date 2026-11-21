# Accordion

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `accordion` |
| Kind | `static` |
| Category | `disclosure` |
| Custom elements | none |
| Root element and class | `div` `.rp-accordion` |
| Liquid tier | `parts` |
| No-JS level | `full` |
| Requires `id` | no (yes when `type="single"`) |
| Depends on | none |
| Milestone | M2 |

### Purpose

A vertical list of headings that each show or hide a section of content. Every item is a native `<details>` element; Ripple ships no JavaScript for it (D-011).

- Use when: several sections of secondary content should be scannable by heading and each must be reachable without JavaScript and by in-page search (FAQ, product details, footer link groups on small screens, filter groups).
- Do not use when: exactly one of a few peer sections is always shown and the labels fit in a row (use Tabs); the content is a floating panel (use Popover); a single "read more" toggle is needed (use one `<details>` with Text, not an Accordion).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Accordion` | `blocks/accordion.liquid` | `div` | `rp-accordion` | none | yes | `<id>` (only when `id` is passed) |
| item | `AccordionItem` | `blocks/accordion-item.liquid` | `details` | `rp-accordion-item` | none | yes, at least one | none |
| trigger | `AccordionTrigger` | `blocks/accordion-trigger.liquid` | `summary` | `rp-accordion-trigger` | none | yes, one per item | none |
| content | `AccordionContent` | `blocks/accordion-content.liquid` | `div` | `rp-accordion-content` | none | yes, one per item | none |

Nesting rules:

1. The children of the root are items only.
2. An item contains exactly two children, in this order: one trigger, one content.
3. The trigger contains text (phrasing content). It MAY contain one heading element (`<h2>` to `<h6>`) wrapping the text, written by the author with Heading, when the accordion is part of the page outline. It MUST NOT contain a link, a button or a form control.
4. The content contains any flow content, including another Accordion.
5. With `type="single"`: the root MUST have an `id`; EVERY item MUST receive `accordion="<id>"`; at most one item may have `defaultOpen`.
6. With `type="multiple"`: items MUST NOT receive `accordion`; any number of items may have `defaultOpen`.
7. The chevron is drawn by CSS (`::after` on the trigger). The author MUST NOT add an icon for it.

### Props

Root (`Accordion`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | only when `type="single"` | no | `id` on the root |
| `type` | `type` (setting) | enum | `single` `multiple` | `multiple` | no | no | `data-type` on the root (default printed) |

Item (`AccordionItem`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `accordion` | `accordion` | id | the `id` of the Accordion | none | only when the root has `type="single"` | no | `name="<accordion>"` on the `<details>` |
| `defaultOpen` | `default_open` | boolean | `true` `false` | `false` | no | no | `open` on the `<details>` when true |

Trigger and content have no props other than `class` and rest props / `attributes`.

### Content model

`parts` - the children of `Accordion` are `AccordionItem`s. Each `AccordionItem` takes one `AccordionTrigger` and one `AccordionContent`. `AccordionTrigger` takes text. `AccordionContent` takes any flow content.

### HTML contract

Fixture `default` (no props; two items):

```html
<div class="rp-accordion" data-type="multiple">
  <details class="rp-accordion-item">
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content"><p>Ships in two days.</p></div>
  </details>
  <details class="rp-accordion-item">
    <summary class="rp-accordion-trigger">Returns</summary>
    <div class="rp-accordion-content"><p>Thirty days.</p></div>
  </details>
</div>
```

Fixture `default-open` (no root props; two items, both with `defaultOpen`):

```html
<div class="rp-accordion" data-type="multiple">
  <details class="rp-accordion-item" open>
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content"><p>Ships in two days.</p></div>
  </details>
  <details class="rp-accordion-item" open>
    <summary class="rp-accordion-trigger">Returns</summary>
    <div class="rp-accordion-content"><p>Thirty days.</p></div>
  </details>
</div>
```

Fixture `single` (`id="faq"`, `type="single"`; both items with `accordion="faq"`, the first with `defaultOpen`). It is fixture 2 of `02-html-contract.md` 11.9:

```html
<div class="rp-accordion" id="faq" data-type="single">
  <details class="rp-accordion-item" name="faq" open>
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content"><p>Ships in two days.</p></div>
  </details>
  <details class="rp-accordion-item" name="faq">
    <summary class="rp-accordion-trigger">Returns</summary>
    <div class="rp-accordion-content"><p>Thirty days.</p></div>
  </details>
</div>
```

Fixture `invalid-enum-falls-back` (`type="bogus"`; one closed item):

```html
<div class="rp-accordion" data-type="multiple">
  <details class="rp-accordion-item">
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content"><p>Ships in two days.</p></div>
  </details>
</div>
```

Fixture `class` (`class="custom-a custom-b"` on the root; `class="custom-c"` on the item, `class="custom-d"` on the trigger, `class="custom-e"` on the content):

```html
<div class="rp-accordion custom-a custom-b" data-type="multiple">
  <details class="rp-accordion-item custom-c">
    <summary class="rp-accordion-trigger custom-d">Shipping</summary>
    <div class="rp-accordion-content custom-e"><p>Ships in two days.</p></div>
  </details>
</div>
```

The server MUST NOT print: `role`, `aria-expanded`, `aria-controls` or `tabindex` on `<summary>`; `hidden`, `role` or `aria-hidden` on the content; `name` on an item of a `multiple` accordion; an `id` on an item, trigger or content.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | item (`<details>`) | browser | while the item is open | present when `defaultOpen` is true, otherwise absent |

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[]
```

### Behaviour with JavaScript

Identical to "Behaviour without JavaScript": no Ripple script reads or writes an Accordion (D-011). React and Remix bindings add no behaviour (see "Host notes" for how they avoid resetting `open`).

### Behaviour without JavaScript

1. A press on a trigger toggles its item. The browser adds or removes `open` and exposes the expanded state.
2. `type="single"`: the items share `name="<id>"`, so opening one closes the open one (native exclusive accordion). The open item can also be closed, leaving none open.
3. `type="multiple"`: items are independent.
4. In-page search opens a closed item that contains a match, in browsers that auto-expand `<details>` (Chromium; other engines UNVERIFIED).
5. There is no height animation: the content appears and disappears at once. Only the chevron rotates (`--rp-duration-base`, under `prefers-reduced-motion: no-preference`).
6. In a browser without support for `name` on `<details>` several items of a `single` accordion can be open at once; nothing else changes, and there is no polyfill (D-081, the capability tier for this feature). According to public compatibility tables (not run, UNVERIFIED; SPIKE-06) the attribute arrived in Chrome 120, Safari 17.2 and Firefox 130, all newer than the floor of D-032 (Chrome 111, Safari 16.4, Firefox 128). The floor is not raised; raising it is open question Q15 of `00-decisions.md` section 10.
7. No control is marked `data-rp-js`.
8. Manifest: `noJs.level: "full"`, `noJs.behavior: "Native <details>: every item opens and closes with no script."`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `toggle` (native) | item (`<details>`) | `ToggleEvent` with `oldState`, `newState`; not bubbling | none (pass `onToggle` through rest props on `AccordionItem`) |

No command and no method.

### Accessibility

- Pattern: native `<details>` / `<summary>` disclosure; `checkPattern`: `null` (the UI SDK patterns `accordion` and `disclosure` expect `aria-expanded` buttons, which a `<summary>` does not have).
- Accessible name: each trigger is named by its text, REQUIRED (a trigger MUST NOT be empty). The root has no role and no name.
- Focus: each trigger is a tab stop. Toggling does not move focus.
- Announcements: None. The browser exposes "expanded" / "collapsed" on the trigger.

| Key | Action |
|---|---|
| Tab / Shift+Tab | Next / previous trigger, and focusable content of open items |
| Enter or Space | Toggles the focused item |

There are no arrow-key shortcuts between triggers (the APG marks them optional; native `<details>` has none).

### Styling

- File: `components/accordion/accordion.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-md`, `--color-border`, `--text-base`, `--font-weight-medium`, `--rp-ring-width`, `--rp-duration-base`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-accordion-padding` | `calc(var(--spacing) * 4)` | block padding of the trigger and bottom padding of the content |
| `--rp-accordion-font-size` | `var(--text-base)` | font size of the trigger |

| Modifier selector | Sets |
|---|---|
| none (`data-type` is not styled) | not applicable |

Rules specific to this file:

1. The native disclosure marker is removed with BOTH `list-style: none` on the trigger and `.rp-accordion-trigger::marker { content: "" }` (the second is for WebKit versions that ignore the first on `<summary>`; UNVERIFIED which).
2. The chevron is the `::after` box of the trigger: two borders in `currentColor`, rotated 45 degrees closed and 225 degrees open. It needs no icon file and inherits the text colour, including in forced-colours mode.
3. The file MUST NOT set `display` on `.rp-accordion-content` and MUST NOT animate `block-size`, `height`, or `::details-content`: the content's visibility is owned by the browser.
4. The trigger is `display: flex`; the first rule therefore also prevents the marker box from being generated in engines where `display: list-item` is required for it.
5. The focus ring of a trigger is drawn inside the trigger.

Complete file:

```css
/* accordion.css
   Component: Accordion (id `accordion`). Contract: 10-components-interactive.md, "Accordion".
   Root:      <div>, class rp-accordion
   Parts:     rp-accordion-item (<details>)
              rp-accordion-trigger (<summary>)
              rp-accordion-content (<div>)
   Props:     data-type = single | multiple   (default multiple); not styled
   States:    [open], :hover, :focus-visible
   Public:    --rp-accordion-padding, --rp-accordion-font-size */
@layer rp.components {
  /* 1. ROOT */
  .rp-accordion {
    /* 1a. public custom properties */
    --rp-accordion-padding: calc(var(--spacing) * 4);
    --rp-accordion-font-size: var(--text-base);
    /* 1b. colour slots */
    /* 1c. other private custom properties */
    --_chevron-rotate: 45deg;
    /* 1d. declarations */
    border-block-start: 1px solid var(--color-border);
  }

  /* 2. PARTS */
  .rp-accordion-item {
    border-block-end: 1px solid var(--color-border);
  }
  .rp-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--spacing) * 4);
    min-block-size: var(--spacing-control-md);
    padding-block: var(--rp-accordion-padding);
    font-size: var(--rp-accordion-font-size);
    font-weight: var(--font-weight-medium);
    list-style: none;
    cursor: pointer;
  }
  .rp-accordion-content {
    padding-block-end: var(--rp-accordion-padding);
  }

  /* 3. MODIFIERS */

  /* 4. STATES */
  @media (hover: hover) {
    .rp-accordion-trigger:hover {
      text-decoration-line: underline;
    }
  }
  .rp-accordion-trigger:focus-visible {
    outline-offset: calc(var(--rp-ring-width) * -1);
  }
  .rp-accordion-trigger::marker {
    content: "";
  }
  .rp-accordion-trigger::after {
    content: "";
    flex: none;
    inline-size: 0.5em;
    block-size: 0.5em;
    margin-inline-end: 0.25em;
    border-inline-end: 2px solid currentColor;
    border-block-end: 2px solid currentColor;
    rotate: var(--_chevron-rotate);
  }
  .rp-accordion-item[open] .rp-accordion-trigger::after {
    rotate: calc(var(--_chevron-rotate) + 180deg);
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-accordion-trigger::after {
      transition-property: rotate;
      transition-duration: var(--rp-duration-base);
      transition-timing-function: var(--ease-out);
    }
  }

  /* 6. ENVIRONMENT */
}
```

### Host notes

- HTML: copy the contract. No script.
- React: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` in `accordion.tsx`, generated. The file starts with `"use client"` (it calls a hook, `06-bindings.md` R-14) because `AccordionItem` captures its initial state with `const [initialOpen] = useState(() => defaultOpen === true);` (`06-bindings.md` R-3, R-14) and prints `<details open={initialOpen ? true : undefined} suppressHydrationWarning>` (R-6). This is the only hook in the file: no effect, no ref, no event handler, no controlled prop (D-036), no callback. A re-render therefore never closes or reopens an item the user toggled. The other three exports follow the static pattern of `06-bindings.md` 6.4.
- Remix: generated, static pattern of `06-bindings.md` 7.4. It prints no `data-rmx-key` (the root is a `div`, not a custom element, G-11). Each `<details>` prints `data-rmx-preserve-attrs="open"` (the state row above has writer `browser`, G-14) so that a morph keeps the user's open items.
- Liquid: four block files, generated: `accordion`, `accordion-item`, `accordion-trigger`, `accordion-content`. Schema settings: `type` (root only; label keys per G-8: block name `t:ripple.accordion.name`, part blocks `t:ripple.accordion.item_name`, `t:ripple.accordion.trigger_name`, `t:ripple.accordion.content_name`, setting `t:ripple.props.type`, options `t:ripple.props.single` and `t:ripple.props.multiple`). Guard (L-15): `assign allowed_type = 'single,multiple' | split: ','` with fallback `'multiple'`. `{{ attributes }}` is printed last in every part's start tag (G-13). Locale keys for strings the component prints: none.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

export function Faq() {
  return (
    <Accordion id="faq" type="single">
      <AccordionItem accordion="faq" defaultOpen>
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>
          <p>Ships in two days.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem accordion="faq">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>
          <p>Thirty days.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

```liquid
{% block 'accordion', id: 'faq', type: 'single' %}
  {% block 'accordion-item', accordion: 'faq', default_open: true %}
    {% block 'accordion-trigger' %}Shipping{% endblock %}
    {% block 'accordion-content' %}
      <p>Ships in two days.</p>
    {% endblock %}
  {% endblock %}
  {% block 'accordion-item', accordion: 'faq' %}
    {% block 'accordion-trigger' %}Returns{% endblock %}
    {% block 'accordion-content' %}
      <p>Thirty days.</p>
    {% endblock %}
  {% endblock %}
{% endblock %}
```

`blocks/accordion-item.liquid` markup, complete:

```liquid
<details class="rp-accordion-item {{ class | escape }}" {% if accordion != blank %}name="{{ accordion | escape }}"{% endif %} {% if default_open == true %}open{% endif %} {{ attributes }}>{{ content }}</details>
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Bridge component: none. Actions: none. Confirm: none. Secret: none. An agent toggles an item by activating its trigger; the content of closed items is in the DOM and readable by agents that read page text.

### Checker rules

- RP101: `type` outside its enumeration.
- RP104: `id` missing on an Accordion with `type="single"` (source: literal `type: 'single'` with no `id`; HTML: `.rp-accordion[data-type="single"]` without `id`).
- RP113 with these manifest `rules[]` entries:
  - `accordion-item-in-accordion`: kind `requires-ancestor`, selector `.rp-accordion-item`, target `.rp-accordion`. Message: "An accordion-item is outside an Accordion." Fix: "Move it inside an accordion block."
  - `accordion-item-needs-trigger`: kind `requires-descendant`, selector `.rp-accordion-item`, target `summary.rp-accordion-trigger`. Message: "An accordion item has no trigger." Fix: "Add accordion-trigger as the first child of the item."
  - `accordion-item-needs-content`: kind `requires-descendant`, selector `.rp-accordion-item`, target `.rp-accordion-content`. Message: "An accordion item has no content part." Fix: "Wrap the item's body in accordion-content."
  - `accordion-single-items-need-name`: kind `requires-attribute`, selector `.rp-accordion[data-type="single"] > .rp-accordion-item`, target `name` (an attribute name). Message: "An item of a single accordion has no name, so it does not close the others." Fix: "Pass accordion: '<accordion id>' to every accordion-item."
  - `accordion-single-one-open`: kind `max-count`, selector `.rp-accordion[data-type="single"] > .rp-accordion-item[open]`, count `1`. Message: "More than one item of a single accordion is open in server HTML." Fix: "Pass default_open to at most one item."
  - `accordion-trigger-not-interactive`: kind `forbids-descendant`, selector `.rp-accordion-trigger`, target `a, button, input, select, textarea`. Message: "An accordion trigger contains an interactive element." Fix: "Move it into accordion-content."
- RP114: in a `single` accordion every item's `name` MUST equal the root `id`.
- Fixture lint `a-4`: `aria-expanded` on `<summary>`.

### Acceptance tests

1. T2: fixtures `default`, `default-open`, `single`, `invalid-enum-falls-back`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: zero mutation records inside the root for every fixture after `ripple.js` has loaded.
3. T6 (JavaScript disabled): in fixture `default`, a click on the first trigger and then on the second leaves `open` on both items.
4. T6 (JavaScript disabled, Chromium): in fixture `single`, a click on the second trigger sets `open` on the second item and removes it from the first; a second click on the second trigger leaves no item open.
5. T6: with focus on a trigger, Enter toggles the item; Space toggles it back.
6. T5 (CSS), viewport 1000 by 700, default tokens: a trigger is 1000 px wide and 52 px high; its computed `list-style-type` is `none`; the content of a closed item has no rendered box (`getClientRects().length === 0`); the `::after` box of an open item's trigger has computed `rotate: 225deg` and of a closed item's `45deg`.
7. T5 (a11y): the accessibility snapshot exposes each trigger with its text as name and an expanded state that matches `open`.
8. T4 (React): hydration of `default` logs no warning; with fixture `default-open`, after the user closes the first item, a parent re-render with unchanged props leaves the first item closed and the second open.
9. T4 (Remix): after the user opens the second item of `default`, a morph navigation to a URL that renders the same Accordion with unchanged server HTML leaves the second item open and the first closed (`06-bindings.md` Q-15).
10. T9: tests 3 and 5 pass in WebKit and Gecko; test 4 runs where `"name" in HTMLDetailsElement.prototype` is true.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-011, D-032, D-034, D-036, D-081; `ripple/docs/02-html-contract.md` 11.9 fixture 2, I-2; `ripple/docs/04-elements.md` 10.8; `uisdk/packages/core/src/testing/check-pattern.ts`; Chromium 157 runs in `ripple/docs/research/spikes/components-interactive/`: `t.mjs` (exclusive `<details name>` with scripting disabled), `css-test.mjs` (trigger box 1000 by 52, marker removed, in both writing directions).
- UNVERIFIED: the first versions with `<details name>` (compatibility tables, not run; AT-10 feature-detects), and which WebKit versions need the `::marker` rule (SPIKE-06); auto-expansion by in-page search outside Chromium; React 19 leaving a user-toggled `open` attribute alone when the JSX value is constant (test 8 is the gate; if it fails, `AccordionItem` prints `open` only in the server render and omits the prop on the client, keeping `suppressHydrationWarning`).

### Fallback (SPIKE-06)

When SPIKE-06 finds that `<details name>` is unsupported at the floor in an engine: nothing changes. In that engine a `single` accordion behaves as `multiple` (behaviour item 6, D-081; the floor question is Q15). Ripple MUST NOT add a script to enforce exclusivity: `noJs.level` stays `full`, and acceptance test 4 stays conditional on feature detection (test 10).

---
