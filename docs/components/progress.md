# Progress

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `progress` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `progress` `.rp-progress` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A horizontal bar that shows how much of a measurable quantity is complete, on the native `<progress>` element.

- Use when: showing progress toward a threshold the server can compute (amount left until free shipping, step 2 of 4, stock remaining).
- Do not use when: the quantity is not measurable (use Spinner), or the value is a rating (use Rating).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Progress` | `blocks/progress.liquid` | `progress` | `rp-progress` | none | yes | none |

Nesting rules: none. The bar has no visible text; the caller prints the sentence that explains it ("$12.00 away from free shipping") next to it as Text.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `value` | `value` | number | `0` to `max` | none (omitted) | no | no | `value`. Unset means indeterminate: no `value` attribute |
| `max` | `max` | number | greater than `0` | `100` | no | no | `max` (always printed) |
| `ariaLabel` | `aria_label` | string | text | none | yes | no | `aria-label` |
| `tone` | `tone` | enum | `primary success warning destructive` | `primary` | no | no | `data-tone` |
| `size` | `size` | enum | `sm md` | `md` | no | no | `data-size` |

`value={0}` is set (it prints `value="0"`); only `undefined`, `null`, Liquid `nil` and the empty string are unset (`02-html-contract.md` M-5). Hosts MUST NOT clamp `value`; the browser clamps it to `max`.

### Content model

`none` - the element is printed with no fallback content.

### HTML contract

Fixture `default` (`value={40}`, `ariaLabel="Progress to free shipping"`):

```html
<progress class="rp-progress" value="40" max="100" data-tone="primary" data-size="md" aria-label="Progress to free shipping"></progress>
```

Fixture `indeterminate` (`ariaLabel="Loading"`):

```html
<progress class="rp-progress" max="100" data-tone="primary" data-size="md" aria-label="Loading"></progress>
```

Fixture `steps` (`value={2}`, `max={4}`, `tone="success"`, `size="sm"`, `ariaLabel="Step 2 of 4"`):

```html
<progress class="rp-progress" value="2" max="4" data-tone="success" data-size="sm" aria-label="Step 2 of 4"></progress>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "value": 40, "ariaLabel": "Progress to free shipping" }` | absent |
| `indeterminate` | `{ "ariaLabel": "Loading" }` | absent |
| `steps` | `{ "value": 2, "max": 4, "tone": "success", "size": "sm", "ariaLabel": "Step 2 of 4" }` | absent |
| `zero` | `{ "value": 0, "ariaLabel": "Progress to free shipping" }` (output has `value="0"`) | absent |
| `class` | `{ "value": 40, "ariaLabel": "Progress to free shipping", "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "value": 40, "ariaLabel": "Progress to free shipping", "tone": "bogus" }` (output equals `default`) | absent |
| `escaping` | `{ "value": 40, "ariaLabel": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None. (A commerce element that updates a Progress, for example a free-shipping bar inside the cart drawer, replaces the server-rendered fragment that contains it; it does not write `value`. See `05-commerce.md`.)

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: the server prints `value` and `max`.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<progress>` (implicit role `progressbar`); `checkPattern`: none.
- Accessible name: `aria-label` (required). When a visible Text explains the bar, the label SHOULD repeat that sentence.
- Focus: not focusable.
- Announcements: none. A caller that needs the new amount announced after a cart change uses the commerce announcement of `05-commerce.md`.
- In forced-colours mode the track has a 1 px `CanvasText` border and the value bar is `Highlight`.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/progress/progress.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-muted`, `--color-primary`, `--color-success`, `--color-warning`, `--color-destructive`, `--rp-duration-base`, `--rp-duration-slow`, `--ease-out`, `--ease-in-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-progress-height` | `calc(var(--spacing) * 2)` | block size of the bar |

| Modifier selector | Sets |
|---|---|
| `.rp-progress[data-tone="success"]` | `--_fg: var(--color-success)` |
| `.rp-progress[data-tone="warning"]` | `--_fg: var(--color-warning)` |
| `.rp-progress[data-tone="destructive"]` | `--_fg: var(--color-destructive)` |
| `.rp-progress[data-size="sm"]` | `--rp-progress-height: calc(var(--spacing) * 1)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-progress` | custom properties: `--rp-progress-height`; `--_bg: var(--color-muted)`; `--_fg: var(--color-primary)`; `--_border: transparent`. Declarations: `appearance: none; display: block; box-sizing: border-box; inline-size: 100%; block-size: var(--rp-progress-height); margin: 0; padding: 0; overflow: hidden; border: 0; border-radius: 9999px; background-color: var(--_bg); color: var(--_fg)` |
| STATES | `.rp-progress::-webkit-progress-bar` | `background-color: transparent` |
| STATES | `.rp-progress::-webkit-progress-value` | `border-radius: 9999px; background-color: var(--_fg)` |
| STATES | `.rp-progress::-moz-progress-bar` | `border-radius: 9999px; background-color: var(--_fg)` |
| STATES | `.rp-progress:indeterminate` | `background-color: color-mix(in oklab, var(--_fg) 40%, var(--_bg))` |
| STATES | `.rp-progress:indeterminate::-moz-progress-bar` | `background-color: transparent` |
| MOTION | `.rp-progress::-webkit-progress-value` (inside the motion media query) | `transition: inline-size var(--rp-duration-base) var(--ease-out)` |
| MOTION | `.rp-progress:indeterminate` (inside the motion media query) | `animation: rp-pulse calc(var(--rp-duration-slow) * 5) var(--ease-in-out) infinite` |
| ENVIRONMENT | `.rp-progress` (inside `@media (forced-colors: active)`) | `border: 1px solid CanvasText` |
| ENVIRONMENT | `.rp-progress::-webkit-progress-value` and, as a SEPARATE rule, `.rp-progress::-moz-progress-bar` (inside `@media (forced-colors: active)`) | `background-color: Highlight` |

Rules for this file:

1. The three vendor pseudo-element selectors MUST each be a rule of their own. They MUST NOT share a selector list: a browser drops the whole rule when one selector in the list is unknown to it.
2. `--_border` is declared because CSS-08 requires the three colour slots by name; the root consumes it only in forced colours (the track is borderless otherwise, which is the exception to CSS-26 for a non-control).
3. The `transition` on `inline-size` is the single exception in this document to `03-styling-and-tokens.md` section 8 rule 3 (property list). It applies only where a script replaces the element in place with a preserved node, and is harmless otherwise. The CSS linter accepts this one `transition` on `inline-size` (D-105 item 2).

### Host notes

- HTML: None.
- React: `export function Progress(props: ProgressProps)`; generated; `value?: number`, `max?: number`.
- Remix: None.
- Liquid: `{% block 'progress', value: cart.total_price, max: threshold, aria_label: label %}{% endblock %}`. Numbers are passed as numbers, not strings. Schema settings: `tone`, `size`. Locale keys: `ripple.progress.name`.

```tsx
<Progress value={cart.cost.subtotalAmount.amount} max={50} ariaLabel="Progress to free shipping" />
```

```liquid
{% assign threshold = 5000 %}
{% block 'progress', value: cart.total_price, max: threshold, aria_label: 'Progress to free shipping' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP104 reports a missing `ariaLabel`). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixture `indeterminate` has no `value` attribute; fixture `zero` has `value="0"`; every fixture has a `max` attribute.
3. Tier 5: fixture `default` in a 200 px wide container computes inline size 200 px and block size 8 px; fixture `steps` computes block size 4 px; `document.querySelector("progress").position` is `0.4` for `default`, `0.5` for `steps` and `-1` for `indeterminate`.
4. Tier 5 (Chromium, Firefox, WebKit): a screenshot of fixture `default` in a 200 px container shows the value colour (computed `--color-primary`) at x = 40 px and the track colour (computed `--color-muted`) at x = 160 px, sampled on the vertical centre line.
5. Tier 3: the accessibility snapshot of fixture `default` has role `progressbar` and name `Progress to free shipping`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 8.1 (Progress), section 6.3 (`tone`, `size`); `ripple/docs/03-styling-and-tokens.md` section 7.2 (STATES selector forms), CSS-12, section 8.
- Accepted by the CSS linter (D-105 item 2): `::-webkit-progress-bar`, `::-webkit-progress-value`, `::-moz-progress-bar`, `:indeterminate`, and one `transition` on `inline-size`.
- UNVERIFIED: that Firefox draws no `::-moz-progress-bar` fill for an indeterminate bar with `appearance: none`; the `:indeterminate::-moz-progress-bar` rule makes the result the same either way.

### Fallback (SPIKE-nn)

None.

---
