# Button

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `button` |
| Kind | `static` |
| Category | `actions` |
| Custom elements | none |
| Root element and class | `button`, or `a` when `href` is set, `.rp-button` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

The standard action control with a text label. It is a `<button>` for form submission and native invokers, and an `<a>` when it navigates.

- Use when: submitting a form, opening a Dialog, Drawer or Popover (`commandFor` / `popoverTarget`), or navigating with a button look (`href`).
- Do not use when: the control has only an icon (use IconButton), or the link sits in running text (use Link).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Button` | `blocks/button.liquid` (markup in `snippets/rp-button.liquid`) | `button` or `a` | `rp-button` | none | yes | none |

Nesting rules: MUST NOT contain interactive content. A `<button>` root MUST be useful without JavaScript: it MUST be a `type="submit"` or `type="reset"` button of a form, or have `commandFor` with `command`, or have `popoverTarget` (`02-html-contract.md` PE-2). A `type="button"` Button with none of these is allowed in two cases only: inside an `rp-*` root with `data-rp-js` passed through rest props, or as a tooltip trigger (prop `tooltip`) inside the `tooltip-trigger` part of a Tooltip (`10-components-interactive.md`; Tooltip is `noJs.level: none`, D-013). A Button composed by contract by another component keeps `rp-button` as its first class (FC-14).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `variant` | `variant` | enum | `primary secondary outline ghost link destructive` | `primary` | no | no | `data-variant` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `type` | `type` | enum | `button submit reset` | `button` | no | no | `type`; `<button>` only |
| `href` | `href` | url | any URL | none (omitted) | no | no | `href`; when set the root is `<a>` |
| `target` | `target` | string | a browsing context name | none (omitted) | no | no | `target`; `<a>` only |
| `rel` | `rel` | string | link types | none (omitted) | no | no | `rel`; `<a>` only |
| `name` | `name` | string | form field name | none (omitted) | no | no | `name`; `<button>` only |
| `value` | `value` | string | form field value | none (omitted) | no | no | `value`; `<button>` only |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `<button>`: `disabled`. `<a>`: `aria-disabled="true"` and `tabindex="-1"`, `href` stays |
| `pending` | `pending` | boolean | `true false` | `false` | no | no | `data-pending=""` and `aria-busy="true"` |
| `fullWidth` | `full_width` | boolean | `true false` | `false` | no | no | `data-full-width=""` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |
| `commandFor` | `command_for` | id | id of a `<dialog>` or `[popover]` element | none (omitted) | no | no | `commandfor`; `<button>` only |
| `command` | `command` | string | `show-modal`, `close`, `show-popover`, `hide-popover`, `toggle-popover`, or a custom command matching `^--[a-z][a-z0-9-]*$` | none (omitted) | no | no | `command`; `<button>` only |
| `popoverTarget` | `popover_target` | id | id of a `[popover]` element | none (omitted) | no | no | `popovertarget`; `<button>` only |
| `formId` | `form_id` | id | id of a `<form>` in the same document | none (omitted) | no | no | `form`; `<button>` only (ledger 6.4). Associates the button with a form elsewhere in the document |
| `dialog` | `dialog` | id | the id of a `<dialog>` in the same document | none (omitted) | no | no | `data-rp-open="<id>"`; `<a>` only: allowed only when `href` is set (D-009) |
| `tooltip` | `tooltip` | id | the `id` of the Tooltip whose trigger this button is | none (omitted) | no | no | `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"`; `<button>` only: allowed only without `href` (D-082) |

Rendering rules: the root is `<a>` if and only if `href` is set. On `<a>`, the props `type`, `name`, `value`, `commandFor`, `command`, `popoverTarget`, `formId`, `tooltip` print nothing. On `<button>`, `target`, `rel` and `dialog` print nothing. `commandFor` and `command` MUST be passed together. This prop order is the manifest prop order; the complete binding files in `06-bindings.md` sections 6.4, 7.4 and 8.4 are copies that MUST follow this table (D-069).

Prop `dialog` (the opener pattern of D-009, same meaning as Link `dialog`):

1. It is used when an overlay has a page equivalent (cart drawer and `/cart`, search dialog and `/search`, mobile nav and the footer menu anchor). `href` is the page equivalent; `dialog` is the id of the `<dialog>`.
2. It prints `data-rp-open="<id>"` on the `<a>`, HTML-escaped. Callers MUST NOT pass `data-rp-open` through rest props or `attributes`.
3. The server MUST NOT print `aria-haspopup` or `aria-controls`. After upgrade the runtime's opener listener (`04-elements.md`) sets `aria-haspopup="dialog"` and `aria-controls="<id>"` on the link when the target is a `<dialog>` inside a defined `rp-dialog`. These two attributes are the global upgrade allow-list entry for `a[data-rp-open]` (`GLOBAL_UPGRADE_ALLOW`, D-071 item 2).
4. Without JavaScript the link navigates to `href`.
5. When the target dialog is not on the page (for example the CartDrawer on the cart page, D-091), the caller MUST omit `dialog`; the link then navigates.
6. `dialog` without `href` is an error: the binding prints nothing for it and the checker reports it (Checker rules).

Prop `tooltip` (D-082):

1. It is passed to the one Button or IconButton inside the `tooltip-trigger` part of a Tooltip; its value is the Tooltip's `id`.
2. It prints `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"` on the `<button>`. Callers MUST NOT pass these two attributes through rest props or `attributes`.
3. A link MUST NOT be a tooltip trigger: with `href` set, `tooltip` prints nothing (UI SDK writes `type="button"` on a link trigger; measured in `10-components-interactive.md`).
4. The button MUST have its own accessible name (text content or `ariaLabel`); the tooltip text is never the only name (D-013).
5. `tooltip` and `describedBy` do not both exist on Button: Button has no `describedBy` prop.

### Content model

`text` - the label: text, optionally with Icon elements before or after it. No interactive content.

### HTML contract

Fixture `default` (no props; children `Add to cart`):

```html
<button class="rp-button" type="button" data-variant="primary" data-size="md">Add to cart</button>
```

Fixture `link` (`href="/cart"`; children `View cart`):

```html
<a class="rp-button" href="/cart" data-variant="primary" data-size="md">View cart</a>
```

Fixture `link-disabled` (`href="/cart"`, `variant="outline"`, `disabled`):

```html
<a class="rp-button" href="/cart" data-variant="outline" data-size="md" aria-disabled="true" tabindex="-1">View cart</a>
```

Fixture `submit-pending` (`type="submit"`, `name="intent"`, `value="add"`, `size="lg"`, `fullWidth`, `pending`):

```html
<button class="rp-button" type="submit" name="intent" value="add" data-variant="primary" data-size="lg" data-full-width="" data-pending="" aria-busy="true">Add to cart</button>
```

Fixture `disabled` (`variant="outline"`, `size="sm"`, `disabled`; children `Sold out`):

```html
<button class="rp-button" type="button" disabled data-variant="outline" data-size="sm">Sold out</button>
```

Fixture `dialog-opener` (`variant="link"`, `commandFor="size-guide"`, `command="show-modal"`; children `Size guide`):

```html
<button class="rp-button" type="button" commandfor="size-guide" command="show-modal" data-variant="link" data-size="md">Size guide</button>
```

Fixture `link-opener` (`href="/cart"`, `dialog="cart-drawer"`; children `Cart`):

```html
<a class="rp-button" href="/cart" data-variant="primary" data-size="md" data-rp-open="cart-drawer">Cart</a>
```

Fixture `tooltip-trigger` (`tooltip="size-tip"`; children `Sizing`). The root MUST equal, attribute for attribute, the Button trigger printed inside the Tooltip fixtures of `10-components-interactive.md` for the same props:

```html
<button class="rp-button" type="button" data-variant="primary" data-size="md" aria-describedby="size-tip-content" data-slot="tooltip-trigger">Sizing</button>
```

Fixture `form-associated` (`type="submit"`, `formId="cart-lines-form"`, `name="checkout"`; children `Check out`):

```html
<button class="rp-button" type="submit" name="checkout" form="cart-lines-form" data-variant="primary" data-size="md">Check out</button>
```

Fixture `with-icon` (`variant="secondary"`, `popoverTarget="sort-menu"`, `ariaLabel="Sort products"`; children an Icon then text):

```html
<button class="rp-button" type="button" popovertarget="sort-menu" data-variant="secondary" data-size="md" aria-label="Sort products"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort</button>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `Add to cart` |
| `link` | `{ "href": "/cart" }` | `View cart` |
| `link-disabled` | `{ "href": "/cart", "variant": "outline", "disabled": true }` | `View cart` |
| `link-external` | `{ "href": "https://example.com/", "target": "_blank", "rel": "noopener", "variant": "ghost" }` | `Example` |
| `submit-pending` | `{ "type": "submit", "name": "intent", "value": "add", "size": "lg", "fullWidth": true, "pending": true }` | `Add to cart` |
| `disabled` | `{ "variant": "outline", "size": "sm", "disabled": true }` | `Sold out` |
| `dialog-opener` | `{ "variant": "link", "commandFor": "size-guide", "command": "show-modal" }` | `Size guide` |
| `with-icon` | `{ "variant": "secondary", "popoverTarget": "sort-menu", "ariaLabel": "Sort products" }` | `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort` |
| `destructive` | `{ "variant": "destructive", "type": "reset" }` | `Clear` |
| `link-opener` | `{ "href": "/cart", "dialog": "cart-drawer" }` | `Cart` |
| `tooltip-trigger` | `{ "tooltip": "size-tip" }` | `Sizing` |
| `form-associated` | `{ "type": "submit", "formId": "cart-lines-form", "name": "checkout" }` | `Check out` |
| `link-ignores-button-props` | `{ "href": "/cart", "tooltip": "size-tip", "formId": "cart-lines-form" }` (output equals fixture `link`) | `View cart` |
| `button-ignores-dialog` | `{ "dialog": "cart-drawer" }` (output equals fixture `default`) | `Add to cart` |
| `class` | `{ "class": "custom-a custom-b" }` | `Add to cart` |
| `invalid-enum-falls-back` | `{ "variant": "bogus" }` (output `data-variant="primary"`) | `Add to cart` |
| `escaping` | `{ "href": "/cart", "target": "Say \"hi\" & <go>" }` | `View cart` |

Fixture lint note: check `pe-2` (`02-html-contract.md` section 11.8) rejects a `type="button"` button with no invoker. The Button and IconButton fixtures `default`, `disabled`, `class`, `invalid-enum-falls-back` are such buttons by necessity (required props only, F-10). The lint MUST skip check `pe-2` for the root element of a fixture whose component id is `button` or `icon-button` (D-074 item 8). Pages are still checked by RP301.

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

Upgrade allow-list (mutations permitted when the element upgrades): `aria-haspopup="dialog"` and `aria-controls="<dialog id>"` on an `<a>` root that has `data-rp-open`. This is the global entry for `a[data-rp-open]` (D-009, D-071 item 2; `02-html-contract.md` section 7.3 entry 1); the Button manifest entry has an empty `upgradeAllow[]`. Nothing else. (Commerce elements set `data-pending` and `aria-busy` on their own roots and forms, never on a Button; `05-commerce.md`. A tooltip trigger button inside `ui-tooltip` is covered by the Tooltip contract of `10-components-interactive.md`.)

### Behaviour with JavaScript

1. A `<button>` with `commandfor` and `command` opens or closes its target natively, or through the Invoker Commands polyfill of `04-elements.md` on browsers without the feature. Button itself has no script.
2. A `<button>` with `popovertarget` toggles its popover natively.
3. An `<a>` root with `data-rp-open` (props `href` and `dialog`): an unmodified primary click calls `showModal()` on the target dialog instead of navigating. This is done by the document-level opener listener of `04-elements.md`, not by Button; Button only prints `data-rp-open`.
4. A `<button>` root with `tooltip`: the surrounding `ui-tooltip` shows its content on hover and focus (`10-components-interactive.md`). Button only prints the two attributes.
5. A `<button>` with `form="<id>"` submits or resets the form with that id (native form association).

### Behaviour without JavaScript

Fully functional. Submit and reset buttons act on their form; links navigate; `popovertarget` works natively; `commandfor` works natively on browsers with Invoker Commands (on other browsers the button does nothing, which is why an overlay with a page equivalent MUST be opened by a Link, or by a Button or IconButton with `href`, that has the `dialog` prop, D-009). With `href` and `dialog` the link navigates to `href`. A `form` attribute works natively. A tooltip trigger shows no tooltip (Tooltip is `noJs.level: none`); the button keeps its own accessible name.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| command | `show-modal`, `close`, `show-popover`, `hide-popover`, `toggle-popover`, `--<custom>` | the element whose id is `commandFor` | none (native Invoker Commands; the Button is the invoker, not the receiver) | none |

### Accessibility

- Pattern: native `<button>` or `<a href>`; `checkPattern`: none.
- Accessible name: the text content, or `ariaLabel`. REQUIRED (RP201).
- Focus: focusable natively. A disabled `<a>` root leaves the tab order. A pending button stays focusable and is not disabled (D-045 item 3); `aria-busy="true"` tells assistive technology it is busy. The server MUST NOT print `aria-expanded`, `aria-controls` or `aria-haspopup` on a button with `commandfor` or `popovertarget` (`02-html-contract.md` I-2).
- Announcements: None.

| Key | Action |
|---|---|
| Enter, Space | activates a `<button>` (native) |
| Enter | follows an `<a>` (native) |

### Styling

- File: `components/button/button.css` (layer `rp.components`). The complete, normative file is in `03-styling-and-tokens.md` section 7.4 and MUST be copied from there.
- Tokens used: `--spacing-control-sm`, `--spacing-control-md`, `--spacing-control-lg`, `--spacing-target-min`, `--spacing`, `--radius-control`, `--radius-xs`, `--text-sm`, `--text-base`, `--font-weight-medium`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-secondary-foreground`, `--color-foreground`, `--color-input`, `--color-link`, `--color-destructive`, `--color-destructive-foreground`, `--rp-duration-fast`, `--rp-duration-slow`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-button-height` | `var(--spacing-control-md)` | minimum block size |
| `--rp-button-px` | `calc(var(--spacing) * 5)` | inline padding |
| `--rp-button-gap` | `calc(var(--spacing) * 2)` | gap between icon and label |
| `--rp-button-radius` | `var(--radius-control)` | corner radius |
| `--rp-button-font-size` | `var(--text-sm)` | font size |
| `--rp-button-font-weight` | `var(--font-weight-medium)` | font weight |

| Modifier selector | Sets |
|---|---|
| `.rp-button[data-variant="secondary"]`, `"outline"`, `"ghost"`, `"link"`, `"destructive"` | `--_bg`, `--_fg`, `--_border` (and for `link` the variables that remove the box); exact values in `03-styling-and-tokens.md` section 7.4 |
| `.rp-button[data-size="sm"]`, `"lg"` | `--rp-button-height`, `--rp-button-px`, `--rp-button-font-size` |
| `.rp-button[data-full-width]` | `--_display: flex; --_inline-size: 100%` |

| File section | Selector | Declarations |
|---|---|---|
| all | all | as written in `03-styling-and-tokens.md` section 7.4 |

### Host notes

- HTML: None.
- React: `export function Button(props: ButtonProps)`; generated; complete file in `06-bindings.md` section 6.4 (a copy of this contract, D-069; it MUST include `formId`, `dialog` and `tooltip`). An `onClick` handler MAY be passed through rest props; the Button MUST still satisfy the nesting rule above. `formId` is printed with the JSX prop `form`; `aria-describedby`, `data-slot` and `data-rp-open` are printed as literal attribute names after the rest-props spread.
- Remix: complete file in `06-bindings.md` section 7.4. Button prints one `data-rmx-*` attribute of its own: `data-rmx-preserve-attrs="style"` on the `<button>` when `tooltip` is set and `href` is unset (X-4: UI SDK writes inline `anchor-name` on the tooltip trigger while the tooltip is open; D-132). Otherwise none; a cart or checkout link gets `data-rmx-document` through rest props (D-034 item 3).
- Liquid: complete files in `06-bindings.md` section 8.4. Params `form_id`, `dialog`, `tooltip`. `{{ attributes }}` is printed LAST in the opening tag (D-035). Schema settings: `variant`, `size` (label keys of section 0.5). Locale keys: `ripple.button.name`.

```tsx
<Button variant="outline" commandFor="size-guide" command="show-modal">Size guide</Button>
```

```liquid
{% block 'button', variant: 'outline', command_for: 'size-guide', command: 'show-modal' %}Size guide{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none. A Button that performs an irreversible action carries `data-agent-confirm="<sentence>"` through rest props (`attributes` in Liquid); CheckoutButton (`11-components-commerce.md`) does this itself.

### Checker rules

Common rules of section 0.4, plus RP201 (accessible name), RP301 (a button inside a commerce root that does nothing without JavaScript), RP114 (the targets of `commandfor`, `popovertarget`, `form`, `data-rp-open` and `aria-describedby` exist in the document), RP302 (an overlay with `noJs.fallbackHref` is opened by an `<a href>`). Manifest `rules[]` (reported by RP113):

- `button-no-interactive-content`: kind `forbids-descendant`, selector `:scope`, target `a, button, input, select, textarea, details, label`. Message: "A Button contains interactive content." Fix: "Move the inner control out of the Button."
- `button-command-pair`: kind `requires-attribute`, selector `button.rp-button[commandfor]`, target `command`. Message: "A Button has commandfor without command." Fix: "Pass command together with commandFor."
- `button-command-needs-target`: kind `requires-attribute`, selector `button.rp-button[command]`, target `commandfor`. Message: "A Button has command without commandfor." Fix: "Pass commandFor together with command."
- `button-dialog-needs-href`: kind `requires-attribute`, selector `button.rp-button[data-rp-open]:not([commandfor])`, target `href`. Message: "A Button has the dialog prop but no href, so it does nothing without JavaScript." Fix: "Pass href with the page equivalent of the dialog, or open the dialog with commandFor and command." (A `<button>` never has `href`, so every subject is a finding. `:not([commandfor])` excludes the buttons of the SPIKE-05 fallback path.)

In these rules the subject is the component root itself; `07-manifest-registry-cli.md` section 9.5.3 MUST evaluate a compound selector against the root as well as its descendants.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: the "Values a test can assert" table of `03-styling-and-tokens.md` section 7.4 holds (11 rows).
3. Tier 5: for each of the 6 variants in schemes `light` and `dark`, the contrast of the label on the fill is at least 4.5:1.
4. Tier 5: fixture `submit-pending` has the same bounding box width as the same fixture without `pending` (0.5 px), computes `color` with alpha 0, and is focusable.
5. Tier 5: fixture `link-disabled` is skipped by Tab and computes `pointer-events: none`; fixture `disabled` matches `:disabled`.
6. Tier 5 and tier 9: fixture `dialog-opener` in a page with a Dialog whose id is `size-guide`: Enter on the button opens the dialog (`dialog.open` is true) in Chromium natively and in WebKit and Gecko through the polyfill.
7. Tier 6: a `type="submit"` Button inside `<form method="get" action="/search">` submits the form with JavaScript disabled.
8. Tier 5: fixture `link-opener` in a page that contains an `rp-dialog` with `<dialog id="cart-drawer">`: after upgrade the link has `aria-haspopup="dialog"` and `aria-controls="cart-drawer"`; a click opens the dialog and the URL does not change. Tier 6: the same page with JavaScript disabled: a click navigates to `/cart`.
9. Tier 2: the canonical form of fixture `tooltip-trigger` equals the canonical form of a Button trigger of the Tooltip fixtures of `10-components-interactive.md` after replacing that fixture's tooltip id with `size-tip` and its text with `Sizing`.
10. Tier 2: fixture `link-ignores-button-props` prints no `form`, `aria-describedby` or `data-slot` attribute; fixture `button-ignores-dialog` prints no `data-rp-open` attribute.
11. Tier 6: fixture `form-associated` placed OUTSIDE `<form id="cart-lines-form" method="get" action="/x"><input name="a" value="1"></form>` submits that form with JavaScript disabled (the URL becomes `/x?a=1&checkout=`).
12. Tier 1: each manifest rule of "Checker rules" has a failing sample in `components/button/button.test.ts` that produces exactly one RP113 finding with that rule id.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-008 item 2, D-009 as amended (`dialog` on Button with `href`), D-082 (`tooltip`), D-086, D-031, sections 6.3 and 6.4 (`formId`, `dialog`, `tooltip`); `03-styling-and-tokens.md` section 7.4; `06-bindings.md` sections 6.4, 7.4, 8.4; `02-html-contract.md` section 4.6; `ripple/theme/blocks/button.liquid`; `ripple/theme/snippets/command-polyfill.liquid`.
- UNVERIFIED: React 19 and Remix 3 printing `commandfor` and `command` unchanged, and the polyfill in WebKit and Gecko (SPIKE-05).

### Fallback (SPIKE-05)

If SPIKE-05 fails, a `<button>` root that has `commandFor` additionally prints one hook attribute, chosen by `command`: `data-rp-open="<commandFor>"` when `command` is `show-modal`; `data-rp-close="<commandFor>"` when `command` is `close`. Nothing else changes. The runtime's opener listener handles both (`02-html-contract.md` section 15, `06-bindings.md` section 14). Fixture `dialog-opener` then becomes:

```html
<button class="rp-button" type="button" commandfor="size-guide" command="show-modal" data-variant="link" data-size="md" data-rp-open="size-guide">Size guide</button>
```

---
