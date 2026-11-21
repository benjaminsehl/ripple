# QuantityInput

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `quantity-input` |
| Kind | `native` |
| Category | `forms` |
| Custom elements | `rp-quantity` |
| Root element and class | `rp-quantity` `.rp-quantity` |
| Liquid tier | `block` |
| No-JS level | `degraded` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M2 |

### Purpose

A native number input with a Decrease and an Increase button, wrapped in `rp-quantity` (D-015). The input is a real form control: it submits with its form and works without JavaScript; the element adds the two buttons' behaviour, clamping, and a spoken announcement of the new value.

- Use when: the shopper chooses how many units to add to the cart or changes the quantity of a cart line.
- Do not use when: the number is not a count of items (use Input with `type="number"`); the choice is among a few fixed values (use Select or RadioGroup); the range is continuous (V1 has no Slider; use Input).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `QuantityInput` | `blocks/quantity-input.liquid` | `rp-quantity` | `rp-quantity` | `data-slot="rp-quantity"` | yes | `<id>` (only when `id` is passed) |
| decrement | none (printed by `QuantityInput`) | none (printed by the block) | `button` | `rp-quantity-button` | `data-rp-part="decrement"`, `data-rp-js="inflow"` | yes | none |
| input | none (printed by `QuantityInput`) | none (printed by the block) | `input` | `rp-quantity-input` | `data-rp-part="input"`, `data-rp-field="quantity"` | yes | none |
| increment | none (printed by `QuantityInput`) | none (printed by the block) | `button` | `rp-quantity-button` | `data-rp-part="increment"`, `data-rp-js="inflow"` | yes | none |

Nesting rules:

1. The root contains exactly three children, in this order: decrement button, input, increment button. The component prints all three; the author passes no children.
2. The root class and the part class prefix are `rp-quantity`, not `rp-quantity-input` (D-015 fixes the root class). The CSS file is still `components/quantity-input/quantity-input.css`.
3. The root MUST be inside the `<form>` it submits with, or the `formId` prop (Liquid: `form_id`) MUST name that form's id.
4. The root MUST NOT be inside an `<a>` or a `<button>`. It MAY be inside a `<label>`-less Field; the accessible name always comes from `ariaLabel`.

### Props

Root (`QuantityInput`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | no | no | `id` on the root; absent when not passed |
| `name` | `name` | string | a form field name | `quantity` | no | no | `name` on the input |
| `defaultValue` | `default_value` | number | integer | `1` | no | no | `value` on the input (React: the `defaultValue` prop of `<input>`, `06-bindings.md` R-16) |
| `min` | `min` | number | integer, at least 0 | `1` | no | no | `min` on the input |
| `max` | `max` | number | integer, at least `min` | none | no | no | `max` on the input; absent when not passed |
| `step` | `step` | number | integer, at least 1 | `1` | no | no | `step` on the input |
| `size` | `size` (setting) | enum | `sm` `md` `lg` | `md` | no | no | `data-size` on the root (default printed) |
| `disabled` | `disabled` | boolean | `true` `false` | `false` | no | no | `disabled` on the input and on both buttons when true |
| `formId` | `form_id` | id | the `id` of a `<form>` | none | no | no | the native `form` attribute on the input; absent when not passed. The prop is not named `form` because that name is reserved in Liquid (D-015, D-020) |
| `ariaLabel` | `aria_label` | string | any non-empty text | locale key `ripple.quantity-input.label` (English: `Quantity`) | no | no | `aria-label` on the input |
| `decreaseLabel` | `decrease_label` | string | any non-empty text | locale key `ripple.quantity-input.decrease` (English: `Decrease quantity`) | no | no | `aria-label` on the decrement button |
| `increaseLabel` | `increase_label` | string | any non-empty text | locale key `ripple.quantity-input.increase` (English: `Increase quantity`) | no | no | `aria-label` on the increment button |
| `value` | none (React only) | number | integer | none | no | no | no attribute; property `value` of `rp-quantity` through `useElement` |
| `rmxKey` | none (Remix only) | string | any non-empty text, unique among siblings | none | no | no | `data-rmx-key` on the root; the attribute is omitted when the prop is unset (D-034, `06-bindings.md` X-3). Host extra: absent from fixtures, React and Liquid |
| `onValueChange` | none (React only) | callback | `(value: number, detail: { value: number; reason: "increment-press" \| "decrement-press" \| "input-commit" \| "imperative"; source: string }) => void` | none | no | no | no attribute; listener for `valuechange` through `useElement` |

`class` and rest props / `attributes` apply to the `rp-quantity` root.

Rules the server applies to the initial state (all hosts, same arithmetic):

1. The decrement button prints `disabled` when `disabled` is true OR `defaultValue <= min`.
2. The increment button prints `disabled` when `disabled` is true OR (`max` is passed AND `defaultValue >= max`).
3. The server prints the numbers as given. It does not clamp `defaultValue` into `[min, max]` and does not snap it to the step grid; the caller MUST pass a valid value (the checker reports a literal that is not, RP101).
4. When several QuantityInputs for the same cart line or product are on one page (for example in the page and in a drawer), each one is independent; keeping them in step is the job of the commerce component around them (`11-components-commerce.md`).

### Content model

`none` - the component takes no children.

### HTML contract

Fixture `default` (no props):

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `default-value` (`defaultValue={3}`, `max={5}`): neither button is disabled.

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" max="5" step="1" value="3" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `at-max` (`defaultValue={6}`, `min={2}`, `max={6}`, `step={2}`): only the increment button is disabled.

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="2" max="6" step="2" value="6" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `line` (`id="qty-1"`, `name="updates[]"`, `defaultValue={2}`, `min={0}`, `size="sm"`, `formId="cart-form"`, `ariaLabel="Quantity for Linen shirt"`, `decreaseLabel="Decrease quantity for Linen shirt"`, `increaseLabel="Increase quantity for Linen shirt"`):

```html
<rp-quantity class="rp-quantity" id="qty-1" data-size="sm" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" aria-label="Decrease quantity for Linen shirt" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="updates[]" min="0" step="1" value="2" form="cart-form" aria-label="Quantity for Linen shirt" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity for Linen shirt" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `disabled` (`disabled`, `defaultValue={3}`):

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="3" disabled aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `escaping` (`name` is the text `Say "hi" & <go>`):

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="Say &quot;hi&quot; &amp; &lt;go&gt;" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `invalid-enum-falls-back` (`size="bogus"`). The output is byte-identical to `default`:

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Fixture `class` (`class="custom-a custom-b"`):

```html
<rp-quantity class="rp-quantity custom-a custom-b" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

The two `<svg>` elements are the Icon contract for `minus` and `plus` (G-4). The server MUST NOT print: `default-value` on the root; `role`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` or `aria-live` anywhere; `readonly` on the input; `tabindex` on a button.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | decrement button | element (`rp-quantity`) | value `<=` `min`, or the input is disabled | per server rule 1 |
| `disabled` | increment button | element (`rp-quantity`) | `max` is set and value `>=` `max`, or the input is disabled | per server rule 2 |
| `value` (PROPERTY, not the attribute) | input | element (`rp-quantity`) and browser | every committed change | attribute `value` = `defaultValue` |

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[]
```

### Behaviour with JavaScript

The behaviour of `rp-quantity` is specified in `04-elements.md` 8.2 (items 1 to 7) with complete source in 8.4. Summary of what a user sees:

1. At upgrade the two buttons become visible (they were `visibility: hidden` and kept their space). With the server rules above the upgrade writes nothing.
2. A press on Increase or Decrease changes the value by `step`, clamped to `[min, max]` and snapped to the step grid that starts at `min`. The input shows the new value; the buttons' `disabled` state is updated; the new value is announced as "`<accessible name of the input>` `<value>`" through the announcer of `04-elements.md` 3.5 (D-015 item (e), D-079; no new locale key).
3. After its own write the element dispatches bubbling `input` and `change` events on the input, so a surrounding form or commerce element (`rp-product-form`, `rp-cart`) sees the change exactly as if the user had typed it.
4. Typing a number and committing it (blur or Enter) normalises it the same way; typing 99 with `max="5"` shows 5.
5. `valuechange` is dispatched on `rp-quantity` BEFORE the value changes. `preventDefault()` vetoes: the input shows the previous value again (D-023, D-036).
6. Setting the property `rp-quantity.value` is silent (no `valuechange`); the React binding uses it for the controlled `value` prop.
7. A disabled input disables both buttons and ignores steps.
8. A region refresh that replaces the input (`rp:refresh`) needs no action: the element reads the input at event time (`04-elements.md` rule R-5).

### Behaviour without JavaScript

- The number input works: the user types a quantity, the browser validates it against `min`, `max` and `step` on submit, and the value is submitted with the form under `name`.
- The Decrease and Increase buttons are invisible but keep their space: generated rule `rp-quantity:not(:defined) [data-rp-js="inflow"] { visibility: hidden }` (`04-elements.md` 10.16 C-4). Nothing shifts at upgrade.
- The browser's own spin buttons are hidden by CSS in both states (`appearance: textfield`), so that the control looks the same before and after upgrade. ArrowUp and ArrowDown on the focused input still step the value natively.
- Manifest: `noJs.level: "degraded"`, `noJs.behavior: "The number input works and submits. The Decrease and Increase buttons are hidden until rp-quantity is defined."`, `noJs.hideUntilDefined: ["[data-rp-part=\"decrement\"]", "[data-rp-part=\"increment\"]"]`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `valuechange` | `rp-quantity` | `{ value: number, reason: "increment-press" \| "decrement-press" \| "input-commit" \| "imperative", source: string }`; not bubbling; cancelable | `onValueChange(value, detail)` |
| event | `input`, `change` (native, bubbling) | the input | dispatched by the element after a button press, and by the browser after typing | none (listen on the form) |
| method | `api.getValue()` | `rp-quantity` | returns `number` | none |
| method | `api.setValue(value)` | `rp-quantity` | commits with reason `imperative`; returns `false` when vetoed | none |
| method | `api.increment()`, `api.decrement()` | `rp-quantity` | same as a button press; return `false` when vetoed or disabled | none |
| method | property `value` (settable) | `rp-quantity` | silent write | none (used by the controlled `value` prop) |

No command.

### Accessibility

- Pattern: native `<input type="number">` (exposed as a spin button by the browser) with two helper buttons; `checkPattern`: `null`.
- Accessible name: REQUIRED on the input, from `ariaLabel` (default "Quantity"). When several QuantityInputs are on one page (cart lines) the caller MUST pass a distinguishing `ariaLabel`, `decreaseLabel` and `increaseLabel` that include the product title (fixture `line`). The component does not use a `<label>` element.
- Focus: tab order is Decrease, input, Increase. A button press keeps focus on the button. When a button becomes `disabled` while focused, focus stays where it is; the user continues with Tab.
- Announcements: after a button press the element announces "`<accessible name of the input>` `<value>`" politely (for example "Quantity 3"; D-015 item (e)). Typing is not announced (the screen reader already echoes it).

| Key | Action |
|---|---|
| Tab / Shift+Tab | Decrease button, input, Increase button |
| ArrowUp / ArrowDown on the input | Native step up / down by `step` |
| Enter on the input | Commits the typed value; inside a form it also submits the form (native) |
| Enter or Space on a button | One step |

### Styling

- File: `components/quantity-input/quantity-input.css` (layer `rp.components`).
- Tokens used: `--spacing-control-sm`, `--spacing-control-md`, `--spacing-control-lg`, `--radius-field`, `--color-background`, `--color-foreground`, `--color-input`, `--color-accent`, `--color-ring`, `--text-sm`, `--rp-ring-width`, `--rp-ring-offset`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-quantity-height` | `var(--spacing-control-md)` | block size of the control; also the inline size of each button |
| `--rp-quantity-input-width` | `3em` | inline size of the input |
| `--rp-quantity-radius` | `var(--radius-field)` | corner radius of the outer border |

| Modifier selector | Sets |
|---|---|
| `.rp-quantity[data-size="sm"]` | `--rp-quantity-height` |
| `.rp-quantity[data-size="lg"]` | `--rp-quantity-height` |

Rules specific to this file:

1. Selectors use the root class `rp-quantity` from manifest `root.class`, not `rp-quantity-input` (D-015 item (a), D-105; section 0.3 item 3).
2. One border and one radius are drawn on the root; the three children have no border. The focus ring is drawn on the ROOT with `:focus-within` when the input has focus (the input's own ring is removed), and inside the button when a button has focus.
3. The browser's spin buttons are removed with `appearance: textfield` on the input and `::-webkit-inner-spin-button { appearance: none }`.
4. The file MUST NOT hide the buttons before upgrade; that is the generated `[data-rp-js="inflow"]` rule.
5. With the default tokens the control is 132 by 44 CSS px at `md` (two 44 px buttons, a 42 px input, 2 px of border), which satisfies the 24 px target size (`02-html-contract.md` A-13) at every size.

Complete file:

```css
/* quantity-input.css
   Component: QuantityInput (id `quantity-input`). Contract: 10-components-interactive.md, "QuantityInput".
   Root:      <rp-quantity>, class rp-quantity
   Parts:     rp-quantity-button (<button>, decrement and increment)
              rp-quantity-input (<input type="number">)
   Props:     data-size = sm | md | lg   (default md)
   States:    :focus-within, :focus-visible, :disabled, :hover
   Public:    --rp-quantity-height, --rp-quantity-input-width, --rp-quantity-radius */
@layer rp.components {
  /* 1. ROOT */
  .rp-quantity {
    /* 1a. public custom properties */
    --rp-quantity-height: var(--spacing-control-md);
    --rp-quantity-input-width: 3em;
    --rp-quantity-radius: var(--radius-field);
    /* 1b. colour slots */
    --_bg: var(--color-background);
    --_fg: var(--color-foreground);
    --_border: var(--color-input);
    /* 1c. other private custom properties */
    /* 1d. declarations */
    display: inline-flex;
    align-items: stretch;
    block-size: var(--rp-quantity-height);
    border: 1px solid var(--_border);
    border-radius: var(--rp-quantity-radius);
    background-color: var(--_bg);
    color: var(--_fg);
    overflow: hidden;
  }

  /* 2. PARTS */
  .rp-quantity-button {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    inline-size: var(--rp-quantity-height);
    margin: 0;
    padding: 0;
    border: 0;
    background-color: transparent;
    color: inherit;
    cursor: pointer;
  }
  .rp-quantity-input {
    box-sizing: border-box;
    inline-size: var(--rp-quantity-input-width);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
    background-color: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--text-sm);
    text-align: center;
    appearance: textfield;
  }

  /* 3. MODIFIERS */
  .rp-quantity[data-size="sm"] {
    --rp-quantity-height: var(--spacing-control-sm);
  }
  .rp-quantity[data-size="lg"] {
    --rp-quantity-height: var(--spacing-control-lg);
  }

  /* 4. STATES */
  @media (hover: hover) {
    .rp-quantity-button:hover {
      background-color: var(--color-accent);
    }
  }
  .rp-quantity:focus-within {
    outline: var(--rp-ring-width) solid var(--color-ring);
    outline-offset: var(--rp-ring-offset);
  }
  .rp-quantity-input:focus-visible {
    outline: none;
  }
  .rp-quantity-button:focus-visible {
    outline-offset: calc(var(--rp-ring-width) * -1);
  }
  .rp-quantity-button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .rp-quantity-input:disabled {
    opacity: 0.5;
  }
  .rp-quantity-input::-webkit-inner-spin-button {
    appearance: none;
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-quantity-button {
      transition-property: background-color, opacity;
      transition-duration: var(--rp-duration-fast);
      transition-timing-function: var(--ease-out);
    }
  }

  /* 6. ENVIRONMENT */
}
```

### Host notes

- HTML: copy the contract. Load `ripple.js` or `ripple.elements.js`.
- React: `export function QuantityInput(props: QuantityInputProps): JSX.Element` in `quantity-input.tsx`, hand-written below the generated header region (D-072), pattern of Dialog in `06-bindings.md` 6.6. The file starts with `"use client"` (it calls hooks, R-14). `formId` prints `form={formId}` on the input. Initial values are captured once (R-3): `const [initial] = useState(() => value ?? defaultValue ?? 1)`; the input prints `defaultValue={initial}` (R-16) and the two buttons print their initial `disabled` from `initial`, `min`, `max`, `disabled` and never re-render it (R-11). `useElement(ref, { props: { value }, events: { valuechange } })`; when `value` is passed the handler calls `event.preventDefault()` and then `onValueChange` (R-5). `suppressHydrationWarning` on `rp-quantity`, the input and both buttons. Default strings in TSX: `ariaLabel = "Quantity"`, `decreaseLabel = "Decrease quantity"`, `increaseLabel = "Increase quantity"`. Icons: `<Icon name="minus" />`, `<Icon name="plus" />`.
- Remix: generated. The root has no required `id`, so the Remix-only prop `rmxKey` is optional: when passed, the root prints `data-rmx-key="<rmxKey>"`; when unset, the attribute is omitted, also when `id` is passed (D-034, `06-bindings.md` X-3). A caller that needs the live value kept across a morph (a cart line, AT-14) MUST pass `rmxKey`. Prints `data-rmx-preserve-attrs="disabled"` on both buttons. No `value`, no callback.
- Liquid: one block file, generated: `blocks/quantity-input.liquid`; the markup lives in `snippets/rp-quantity-input.liquid` because ProductForm and CartLine embed it (`06-bindings.md` L-3; manifest `liquid.embeddedBy: ["product-form", "cart-line"]`). Schema settings: `size` (label keys per G-8: block name `t:ripple.quantity-input.name`, setting `t:ripple.props.size`, options `t:ripple.props.sm`, `t:ripple.props.md`, `t:ripple.props.lg`). The Liquid param for the form id is `form_id` (`form` is a reserved name, D-020). `{{ attributes }}` is printed last (G-13). Locale keys for strings the component prints: `ripple.quantity-input.label` (English: `Quantity`), `ripple.quantity-input.decrease` (English: `Decrease quantity`), `ripple.quantity-input.increase` (English: `Increase quantity`).

```tsx
import { QuantityInput } from "./quantity-input";

export function Quantity() {
  return <QuantityInput id="qty" defaultValue={1} min={1} max={10} />;
}
```

```liquid
{% block 'quantity-input', id: 'qty', default_value: 1, min: 1, max: 10 %}{% endblock %}
```

`snippets/rp-quantity-input.liquid` after `{% doc %}`, complete:

```liquid
{%- liquid
  assign allowed_size = 'sm,md,lg' | split: ','
  unless allowed_size contains size
    assign size = 'md'
  endunless
  assign name = name | default: 'quantity'
  assign default_value = default_value | default: 1
  assign min = min | default: 1
  assign step = step | default: 1
  if aria_label == blank
    assign aria_label = 'ripple.quantity-input.label' | t
  endif
  if decrease_label == blank
    assign decrease_label = 'ripple.quantity-input.decrease' | t
  endif
  if increase_label == blank
    assign increase_label = 'ripple.quantity-input.increase' | t
  endif
  assign dec_disabled = false
  assign inc_disabled = false
  if disabled == true
    assign dec_disabled = true
    assign inc_disabled = true
  endif
  if default_value <= min
    assign dec_disabled = true
  endif
  if max != blank
    if default_value >= max
      assign inc_disabled = true
    endif
  endif
-%}
<rp-quantity class="rp-quantity {{ class | escape }}" {% if id != blank %}id="{{ id | escape }}"{% endif %} data-size="{{ size }}" data-slot="rp-quantity" {{ attributes }}>
  <button class="rp-quantity-button" type="button" {% if dec_disabled %}disabled{% endif %} aria-label="{{ decrease_label | escape }}" data-rp-part="decrement" data-rp-js="inflow">{% render 'rp-icon', name: 'minus' %}</button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="{{ name | escape }}" min="{{ min }}" {% if max != blank %}max="{{ max }}"{% endif %} step="{{ step }}" value="{{ default_value }}" {% if form_id != blank %}form="{{ form_id | escape }}"{% endif %} {% if disabled == true %}disabled{% endif %} aria-label="{{ aria_label | escape }}" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" {% if inc_disabled %}disabled{% endif %} aria-label="{{ increase_label | escape }}" data-rp-part="increment" data-rp-js="inflow">{% render 'rp-icon', name: 'plus' %}</button>
</rp-quantity>
```

Notes on the snippet: `min: 0` is a valid caller value, and Liquid's `default` filter replaces only `nil`, `false` and empty values, so `0` is kept. The numeric params MUST be passed as numbers, not strings (`default_value: 2`, not `'2'`), because the comparisons `<=` and `>=` are numeric only for numbers.

### Commerce

QuantityInput is not a commerce component and reads no commerce data. Its one commerce-facing fact is the hook `data-rp-field="quantity"` on the input, printed always: commerce elements find the quantity control of their form or line through it (`05-commerce.md`, field roles), and map it to the backend's field name through the form dialect. The `name` the caller passes MUST be the dialect's name for the surrounding form: `quantity` in a product form; `updates[]` in a Liquid cart form. ProductForm and CartLine (`11-components-commerce.md`) pass it; a hand-written form MUST pass it too.

### Agent surface

`bridge` (and the accessibility tree). Bridge component: `rp-quantity`. Actions: `setValue` (argument: integer), `increment`, `decrement` (no arguments). Confirm: none. Secret: none. An agent that does not use the bridge fills the spin button named by `ariaLabel` or presses the two named buttons.

### Checker rules

- RP101: `size` outside its enumeration; a literal `defaultValue` outside `[min, max]` or off the step grid; `min` greater than `max`; `step` less than 1.
- RP113 with these manifest `rules[]` entries:
  - `quantity-needs-input`: kind `requires-descendant`, selector `rp-quantity`, target `input[type="number"][data-rp-part="input"][aria-label]`. Message: "rp-quantity has no labelled number input." Fix: "Use the QuantityInput component; do not hand-write its inner markup."
  - `quantity-one-input`: kind `max-count`, selector `rp-quantity input`, count `1`. Message: "rp-quantity contains more than one input." Fix: "Keep one."
  - `quantity-needs-decrement`: kind `requires-descendant`, selector `rp-quantity`, target `button[type="button"][data-rp-part="decrement"][data-rp-js="inflow"]`. Message: "rp-quantity has no Decrease button." Fix: "Use the QuantityInput component."
  - `quantity-needs-increment`: kind `requires-descendant`, selector `rp-quantity`, target `button[type="button"][data-rp-part="increment"][data-rp-js="inflow"]`. Message: "rp-quantity has no Increase button." Fix: "Use the QuantityInput component."
  - `quantity-not-in-control`: kind `forbids-ancestor`, selector `rp-quantity`, target `a, button`. Message: "A QuantityInput is inside a link or button." Fix: "Move it next to the control."
- RP111: the class `rp-quantity-input` on anything other than the `<input>` part, and the classes `rp-quantity-input-button`, `rp-quantity-input-input` (the names rule 4.1 of `00-decisions.md` would predict), are not in the manifest and are reported.
- RP201: the input has no accessible name.
- RP301: not applicable (RP301 covers components of kind `commerce`). Both buttons carry `data-rp-js="inflow"`, so a QuantityInput inside a commerce component also passes it.
- RP305: inside a commerce form, the input's `name` MUST be the dialect's quantity field name.

### Acceptance tests

1. T2: fixtures `default`, `default-value`, `at-max`, `line`, `disabled`, `escaping`, `invalid-enum-falls-back`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: zero mutation records inside the root for every fixture after `rp-quantity` is defined; the boxes of the root, the input and both buttons are identical before and after upgrade; both buttons have computed `visibility: hidden` before and `visible` after.
3. T5 (fixture `default-value`): a click on Increase sets `input.value` to `"4"`; exactly one `valuechange` with `detail.value === 4` and `detail.reason === "increment-press"`; then one bubbling `input` and one bubbling `change` event reach `document`. A second click gives 5 and sets `disabled` on Increase. A click on Decrease gives 4 and removes it.
4. T5 (fixture `at-max`): a click on Decrease gives 4 (step 2); two more clicks give 2 and set `disabled` on Decrease; `input.value` never goes below 2.
5. T5: typing `99` into the input of `default-value` and pressing Tab sets `input.value` to `"5"` and dispatches `valuechange` with reason `input-commit` and value 5.
6. T5 (veto, D-036; fixture `default-value`; the same test is in `04-elements.md` 8.6): with a `valuechange` listener that calls `event.preventDefault()`, a click on Increase dispatches exactly one `valuechange` with `detail.value === 4`; afterwards `input.value === "3"`, `element.api.getValue() === 3`, neither button has `disabled`, no `input` and no `change` event was dispatched, and `element.api.setValue(4)` returns `false`.
7. T5: `element.value = 2` updates the input and the buttons and dispatches no `valuechange`; `element.api.setValue(4)` dispatches one with reason `imperative`.
8. T5 (fixture `disabled`): clicks on both buttons change nothing; `api.increment()` returns `false`.
9. T5 (a11y): the accessibility snapshot has a spin button named "Quantity" with value 3 between buttons named "Decrease quantity" and "Increase quantity"; after a click on Increase a polite live region in the document contains the text "Quantity 4".
10. T5 (CSS), default tokens: at `md` the root is 132 by 44 px, each button 44 px wide, the input 42 px wide; at `sm` and `lg` the root height equals the computed `--spacing-control-sm` and `--spacing-control-lg`; with focus in the input the ROOT has a computed outline width equal to `--rp-ring-width` and the input has outline style `none`.
11. T5 (CSS), `<html dir="rtl">`: the decrement button is at the right edge of the root.
12. T6 (JavaScript disabled): a form containing fixture `default-value` submits `quantity=3`; after typing 4 it submits `quantity=4`; both buttons have computed `visibility: hidden`; pressing ArrowUp in the input changes its value to 4.
13. T4 (React): hydration of `default` logs no warning in both script orders; with `value={3}` and an `onValueChange` that does not update state, a click on Increase leaves `input.value` at `"3"` and calls the callback once with `(4, detail)`; with an `onValueChange` that sets state, the input shows 4 and Increase's `disabled` follows.
14. T4 (Remix; fixture `default-value` rendered with `rmxKey="qty"`): after two clicks on Increase, a morph navigation to a URL that renders the same QuantityInput with unchanged server HTML and the same `rmxKey` leaves `input.value` at `"5"`, Increase `disabled`, and the `rp-quantity` element the same object (`06-bindings.md` Q-15).
15. T9: tests 3, 5 and 12 pass in WebKit and Gecko.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-015, D-019, D-020, D-023, D-034, D-036, D-079, D-105; `ripple/docs/04-elements.md` 8.1 to 8.6 (markup, behaviour, complete source and test file of `rp-quantity`), 10.14, 10.16 C-4, 11.1 to 11.4; `ripple/docs/06-bindings.md` R-3, R-5, R-11, R-16, X-3, L-3; CSS rendered in Chromium 157 in both writing directions (`ripple/docs/research/spikes/components-interactive/css-test.mjs`, `results-css-test.txt`: root 132 by 44, button 44 by 42 inside the border, input 42 wide; mirrored order in right-to-left).
- UNVERIFIED: `appearance: textfield` hiding the spin buttons in Gecko at the floor (if not, the native spin buttons show next to the Ripple buttons there; fix by adding `-moz-appearance: textfield`, which `lintComponentCss` would then have to accept); Liquid comparing a number param with `<=` when the caller passes a string (the snippet note above); Remix morph keeping the live `value` property of the input (test 14 is the gate); root-only `definePrimitive` (SPIKE-04, owned by `04-elements.md`).

### Fallback (SPIKE-04)

When SPIKE-04 finds that a root-only `definePrimitive` does not work, `rp-quantity` is re-implemented on the `RippleElement` base class as specified in `04-elements.md`, "Fallback (SPIKE-04)". The contract, the event, the methods, the CSS and every acceptance test of this section are unchanged.

---
