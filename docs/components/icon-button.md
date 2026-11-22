# IconButton

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `icon-button` |
| Kind | `static` |
| Category | `actions` |
| Custom elements | none |
| Root element and class | `button`, or `a` when `href` is set, `.rp-icon-button` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M1 |

### Purpose

A square action control whose only content is one icon. It always has an accessible name.

- Use when: a close button, a remove button, carousel arrows, a header icon action.
- Do not use when: the control has visible text (use Button, with an Icon in its children).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `IconButton` | `blocks/icon-button.liquid` | `button` or `a` | `rp-icon-button` | none | yes | none |
| icon | none (printed by the root from `icon`) | `snippets/rp-icon.liquid` | `svg` | `rp-icon` | none | yes | none |

Nesting rules: the root contains exactly one Icon and nothing else. The nesting rule of Button for `<button>` roots applies (useful without JavaScript, PE-2).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `icon` | `icon` | enum | the 24 icon names of section 0.6 | none | yes | no | the embedded Icon (`name` = `icon`); no attribute |
| `ariaLabel` | `aria_label` | string | text | none | yes | no | `aria-label` |
| `variant` | `variant` | enum | `primary secondary outline ghost link destructive` | `ghost` | no | no | `data-variant` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `type` | `type` | enum | `button submit reset` | `button` | no | no | `type`; `<button>` only |
| `href` | `href` | url | any URL | none (omitted) | no | no | `href`; when set the root is `<a>` |
| `target` | `target` | string | a browsing context name | none (omitted) | no | no | `target`; `<a>` only |
| `rel` | `rel` | string | link types | none (omitted) | no | no | `rel`; `<a>` only |
| `name` | `name` | string | form field name | none (omitted) | no | no | `name`; `<button>` only |
| `value` | `value` | string | form field value | none (omitted) | no | no | `value`; `<button>` only |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | as Button |
| `pending` | `pending` | boolean | `true false` | `false` | no | no | `data-pending=""` and `aria-busy="true"` |
| `commandFor` | `command_for` | id | id of a `<dialog>` or `[popover]` element | none (omitted) | no | no | `commandfor`; `<button>` only |
| `command` | `command` | string | as Button | none (omitted) | no | no | `command`; `<button>` only |
| `popoverTarget` | `popover_target` | id | id of a `[popover]` element | none (omitted) | no | no | `popovertarget`; `<button>` only |
| `formId` | `form_id` | id | id of a `<form>` in the same document | none (omitted) | no | no | `form`; `<button>` only (ledger 6.4). Associates the button with a form elsewhere in the document |
| `dialog` | `dialog` | id | the id of a `<dialog>` in the same document | none (omitted) | no | no | `data-rp-open="<id>"`; `<a>` only: allowed only when `href` is set (D-009) |
| `tooltip` | `tooltip` | id | the `id` of the Tooltip whose trigger this button is | none (omitted) | no | no | `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"`; `<button>` only: allowed only without `href` (D-082) |

Rendering rules: identical to Button, including the rules of the props `formId`, `dialog` (allowed only when `href` is set; prints `data-rp-open`; the six numbered rules under Button apply) and `tooltip` (allowed only without `href`; prints `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"`; the five numbered rules under Button apply). There is no `fullWidth`. `icon` and `ariaLabel` are REQUIRED (D-068 as amended).

### Content model

`none` - the content is the embedded Icon.

### HTML contract

Fixture `default` (`icon="close"`, `ariaLabel="Close"`):

```html
<button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
```

Fixture `dialog-closer` (`icon="close"`, `ariaLabel="Close"`, `size="sm"`, `commandFor="size-guide"`, `command="close"`):

```html
<button class="rp-icon-button" type="button" commandfor="size-guide" command="close" data-variant="ghost" data-size="sm" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
```

Fixture `link` (`icon="account"`, `ariaLabel="Account"`, `href="/account"`, `variant="outline"`):

```html
<a class="rp-icon-button" href="/account" data-variant="outline" data-size="md" aria-label="Account"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg></a>
```

Fixture `link-opener` (`icon="cart"`, `ariaLabel="Cart"`, `href="/cart"`, `dialog="cart-drawer"`):

```html
<a class="rp-icon-button" href="/cart" data-variant="ghost" data-size="md" aria-label="Cart" data-rp-open="cart-drawer"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg></a>
```

Fixture `tooltip-trigger` (`icon="info"`, `ariaLabel="Sizing information"`, `tooltip="size-tip"`). The root MUST equal the trigger button of fixture `default` of Tooltip in `10-components-interactive.md`:

```html
<button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="Sizing information" aria-describedby="size-tip-content" data-slot="tooltip-trigger"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button>
```

Fixture `form-associated` (`icon="trash"`, `ariaLabel="Remove"`, `type="submit"`, `formId="cart-lines-form"`, `name="intent"`, `value="remove"`):

```html
<button class="rp-icon-button" type="submit" name="intent" value="remove" form="cart-lines-form" data-variant="ghost" data-size="md" aria-label="Remove"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "icon": "close", "ariaLabel": "Close" }` | absent |
| `link-opener` | `{ "icon": "cart", "ariaLabel": "Cart", "href": "/cart", "dialog": "cart-drawer" }` | absent |
| `tooltip-trigger` | `{ "icon": "info", "ariaLabel": "Sizing information", "tooltip": "size-tip" }` | absent |
| `form-associated` | `{ "icon": "trash", "ariaLabel": "Remove", "type": "submit", "formId": "cart-lines-form", "name": "intent", "value": "remove" }` | absent |
| `dialog-closer` | `{ "icon": "close", "ariaLabel": "Close", "size": "sm", "commandFor": "size-guide", "command": "close" }` | absent |
| `link` | `{ "icon": "account", "ariaLabel": "Account", "href": "/account", "variant": "outline" }` | absent |
| `link-disabled` | `{ "icon": "arrow-right", "ariaLabel": "Next", "href": "/page/2", "target": "_self", "rel": "next", "disabled": true }` | absent |
| `submit-pending` | `{ "icon": "trash", "ariaLabel": "Remove", "type": "submit", "name": "intent", "value": "remove", "variant": "destructive", "size": "lg", "pending": true }` | absent |
| `disabled` | `{ "icon": "plus", "ariaLabel": "Increase", "disabled": true, "popoverTarget": "more" }` | absent |
| `class` | `{ "icon": "close", "ariaLabel": "Close", "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "icon": "close", "ariaLabel": "Close", "variant": "bogus" }` (output `data-variant="ghost"`) | absent |
| `escaping` | `{ "icon": "close", "ariaLabel": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | `<button>` root | server | `disabled` is true | present, or absent |
| `aria-disabled`, `tabindex` | `<a>` root | server | `disabled` is true | `true` and `-1`, or absent |
| `data-pending`, `aria-busy` | root | server | `pending` is true | `""` and `true`, or absent |
| `data-rp-open` | `<a>` root | server | `dialog` is set and `href` is set | the dialog id, or absent |
| `aria-describedby`, `data-slot` | `<button>` root | server | `tooltip` is set and `href` is unset | `<tooltip>-content` and `tooltip-trigger`, or absent |
| `style` (`anchor-name: --ui-anchor-<n>`) | `<button>` root | element (UI SDK `ui-tooltip`) | `tooltip` is set and `href` is unset; written while the tooltip is open, removed when it closes | absent |
| `aria-haspopup`, `aria-controls` | `<a>` root | runtime opener listener (`04-elements.md`) | after upgrade, on a link with `data-rp-open` whose target is a `<dialog>` inside a defined `rp-dialog` | absent |

Upgrade allow-list (mutations permitted when the element upgrades): as Button: only the global entry for `a[data-rp-open]` (`aria-haspopup`, `aria-controls`); the IconButton manifest entry has an empty `upgradeAllow[]`.

### Behaviour with JavaScript

1. As Button: native invokers (`commandfor`, `popovertarget`), polyfilled where missing. IconButton itself has no script.
2. As Button: with `href` and `dialog`, an unmodified primary click opens the target dialog through the document-level opener listener of `04-elements.md`.
3. As Button: with `tooltip`, the surrounding `ui-tooltip` shows its content on hover and focus (`10-components-interactive.md`).

### Behaviour without JavaScript

As Button.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| command | `show-modal`, `close`, `show-popover`, `hide-popover`, `toggle-popover`, `--<custom>` | the element whose id is `commandFor` | none (native Invoker Commands) | none |

### Accessibility

- Pattern: native `<button>` or `<a href>`; `checkPattern`: none.
- Accessible name: `ariaLabel`, REQUIRED (D-068). A Tooltip MAY repeat it visually but is never the name.
- Focus: as Button.
- Announcements: None.

| Key | Action |
|---|---|
| Enter, Space | activates a `<button>` (native) |
| Enter | follows an `<a>` (native) |

### Styling

- File: `components/icon-button/icon-button.css` (layer `rp.components`). It does not share rules with `button.css` (CSS-02); it repeats the colour-slot pattern.
- Tokens used: `--spacing-control-sm`, `--spacing-control-md`, `--spacing-control-lg`, `--radius-control`, `--text-base`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-secondary-foreground`, `--color-foreground`, `--color-input`, `--color-link`, `--color-destructive`, `--color-destructive-foreground`, `--rp-duration-fast`, `--rp-duration-slow`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-icon-button-size` | `var(--spacing-control-md)` | inline and block size |
| `--rp-icon-button-radius` | `var(--radius-control)` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-icon-button[data-variant="primary"]` | `--_bg: var(--color-primary); --_fg: var(--color-primary-foreground)` |
| `.rp-icon-button[data-variant="secondary"]` | `--_bg: var(--color-secondary); --_fg: var(--color-secondary-foreground)` |
| `.rp-icon-button[data-variant="outline"]` | `--_border: var(--color-input)` |
| `.rp-icon-button[data-variant="link"]` | `--_fg: var(--color-link); --_hover: 100%; --_active: 100%` |
| `.rp-icon-button[data-variant="destructive"]` | `--_bg: var(--color-destructive); --_fg: var(--color-destructive-foreground)` |
| `.rp-icon-button[data-size="sm"]` | `--rp-icon-button-size: var(--spacing-control-sm)` |
| `.rp-icon-button[data-size="lg"]` | `--rp-icon-button-size: var(--spacing-control-lg)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-icon-button` | custom properties: the two public ones above; `--_bg: transparent; --_fg: var(--color-foreground); --_border: transparent; --_hover: 88%; --_active: 80%`. Declarations: `position: relative; display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; inline-size: var(--rp-icon-button-size); block-size: var(--rp-icon-button-size); margin: 0; padding: 0; border: 1px solid var(--_border); border-radius: var(--rp-icon-button-radius); background-color: var(--_bg); color: var(--_fg); font-family: inherit; font-size: var(--text-base); line-height: 1; text-decoration-line: none; cursor: pointer; user-select: none` |
| STATES | `.rp-icon-button:hover` | `background-color: color-mix(in oklab, var(--_bg) var(--_hover), var(--_fg))` |
| STATES | `.rp-icon-button:active` | `background-color: color-mix(in oklab, var(--_bg) var(--_active), var(--_fg))` |
| STATES | `.rp-icon-button:is(:disabled, [aria-disabled="true"])` | `opacity: 0.5; pointer-events: none` |
| STATES | `.rp-icon-button:is([data-pending], [aria-busy="true"])` | `color: transparent; pointer-events: none` |
| STATES | `.rp-icon-button:is([data-pending], [aria-busy="true"])::after` | `content: ""; position: absolute; inset: 0; margin: auto; inline-size: 1em; block-size: 1em; border: 2px solid var(--_fg); border-inline-end-color: transparent; border-radius: 50%` |
| MOTION | `.rp-icon-button` | `transition: background-color var(--rp-duration-fast) var(--ease-out), border-color var(--rp-duration-fast) var(--ease-out), color var(--rp-duration-fast) var(--ease-out), opacity var(--rp-duration-fast) var(--ease-out), scale var(--rp-duration-fast) var(--ease-out)` |
| MOTION | `.rp-icon-button:active` | `scale: 0.97` |
| MOTION | `.rp-icon-button:is([data-pending], [aria-busy="true"])::after` | `animation: rp-spin calc(var(--rp-duration-slow) * 2) linear infinite` |

The icon is `1.25em` of the root font size: 20 px. Sizes at default dials: `sm` 36 px, `md` 44 px, `lg` 52 px, square.

### Host notes

- HTML: None.
- React: `export function IconButton(props: IconButtonProps)`; generated on the Button pattern; renders `<Icon name={icon} />` as its only child; imports `Icon` from `./icon`.
- Remix: as Button, including `data-rmx-preserve-attrs="style"` on the `<button>` when `tooltip` is set and `href` is unset (D-132); imports `Icon` from `./icon.tsx`.
- Liquid: `{% block 'icon-button', icon: 'close', aria_label: close_label, command_for: 'size-guide', command: 'close' %}{% endblock %}`; the block renders `{% render 'rp-icon', name: icon %}`. Params `form_id`, `dialog`, `tooltip` as Button. `{{ attributes }}` is printed LAST in the opening tag (D-035). Schema settings: `variant`, `size` (label keys of section 0.5). Locale keys: `ripple.icon-button.name`.

```tsx
<IconButton icon="close" ariaLabel="Close" commandFor="size-guide" command="close" />
```

```liquid
{% block 'icon-button', icon: 'close', aria_label: 'Close', command_for: 'size-guide', command: 'close' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP104 reports a missing `icon` or `ariaLabel`; RP101 an unknown `icon`), plus RP201 (accessible name, `a11y.name.required: always`), RP301, RP302, RP114 (the targets of `commandfor`, `popovertarget`, `form`, `data-rp-open` and `aria-describedby` exist). Manifest `rules[]` (reported by RP113; the subject is the root, as for Button):

- `icon-button-needs-icon`: kind `requires-descendant`, selector `:scope`, target `svg.rp-icon`. Message: "An IconButton has no icon." Fix: "Pass the icon prop with one of the 24 icon names."
- `icon-button-single-icon`: kind `max-count`, selector `:scope > *`, count `1`. Message: "An IconButton has more than one child." Fix: "Keep only the icon; use Button for a control with text."
- `icon-button-needs-name`: kind `requires-attribute`, selector `:scope`, target `aria-label`. Message: "An IconButton has no accessible name." Fix: "Pass ariaLabel."
- `icon-button-command-pair`: kind `requires-attribute`, selector `button.rp-icon-button[commandfor]`, target `command`. Message: "An IconButton has commandfor without command." Fix: "Pass command together with commandFor."
- `icon-button-command-needs-target`: kind `requires-attribute`, selector `button.rp-icon-button[command]`, target `commandfor`. Message: "An IconButton has command without commandfor." Fix: "Pass commandFor together with command."
- `icon-button-dialog-needs-href`: kind `requires-attribute`, selector `button.rp-icon-button[data-rp-open]:not([commandfor])`, target `href`. Message: "An IconButton has the dialog prop but no href, so it does nothing without JavaScript." Fix: "Pass href with the page equivalent of the dialog, or open the dialog with commandFor and command."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: `size` `sm`, `md`, `lg` give bounding boxes of 36, 44 and 52 px square; the icon inside is 20 by 20 px and centred (1 px tolerance).
3. Tier 5: fixture `default` computes a transparent `background-color` and `color` equal to the computed `--color-foreground`; fixture `link` computes `border-color` equal to the computed `--color-input`.
4. Tier 2: an IconButton called without `ariaLabel` fails the TypeScript build of the React and Remix conformance projects, and `ripple check` reports RP104 for the Liquid call.
5. Tier 5 and tier 9: fixture `dialog-closer` inside an open Dialog with id `size-guide` closes it on click and on Enter.
6. Tier 5: fixture `link-opener` in a page that contains an `rp-dialog` with `<dialog id="cart-drawer">`: after upgrade the link has `aria-haspopup="dialog"` and `aria-controls="cart-drawer"`; a click opens the dialog and the URL does not change. Tier 6: with JavaScript disabled a click navigates to `/cart`.
7. Tier 2: the canonical form of fixture `tooltip-trigger` equals the canonical form of the `<button>` inside `ui-tooltip-trigger` in fixture `default` of Tooltip (`10-components-interactive.md`).
8. Tier 2: an IconButton with `href="/cart"` and `tooltip="size-tip"` prints no `aria-describedby` and no `data-slot`; an IconButton with `dialog="cart-drawer"` and no `href` prints no `data-rp-open`.
9. Tier 1: each manifest rule of "Checker rules" has a failing sample in `components/icon-button/icon-button.test.ts` that produces exactly one RP113 finding with that rule id.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-031 (IconButton default `ghost`), D-068 as amended (IconButton REQUIRES `icon` and `ariaLabel`), D-008 item 2, D-009 as amended (`dialog`), D-082 (`tooltip`), section 6.4 (`formId`); `04-elements.md` section 10 examples (`rp-icon-button` closers); `ripple/docs/research/base-theme.md` (an icon button costs three statements).
- UNVERIFIED: as Button (SPIKE-05).

### Fallback (SPIKE-05)

Identical to the Button fallback: a `<button>` root with `commandFor` additionally prints `data-rp-open="<commandFor>"` (for `command="show-modal"`) or `data-rp-close="<commandFor>"` (for `command="close"`).

---
