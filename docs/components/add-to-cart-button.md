# AddToCartButton

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `add-to-cart-button` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `button` `.rp-button.rp-add-to-cart-button` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `button` |
| Milestone | M3 |

### Purpose

The submit button of a ProductForm. It composes Button by contract (D-070; class pair `rp-button rp-add-to-cart-button`, section 0.2) and adds the dialect's submit attributes and the `submit` part hook that `rp-product-form` looks for.

- Use when: inside a ProductForm body, exactly once.
- Do not use when: outside a ProductForm (it would submit nothing), or for checkout (use CheckoutButton).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `AddToCartButton` | `blocks/add-to-cart-button.liquid` + `snippets/rp-add-to-cart-button.liquid` | `button` | `rp-button rp-add-to-cart-button` | `data-rp-part="submit"` | yes | none |

Nesting rules: MUST be a descendant of the `<form>` of a ProductForm. At most one per ProductForm. The class order is `rp-button` first, then `rp-add-to-cart-button` (rule N-3 of doc 02).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `variant` | `variant` | enum | `primary secondary outline ghost link destructive` | `primary` | no | no | `data-variant` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `fullWidth` | `full_width` | boolean | `true false` | `false` | no | no | `data-full-width=""` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |

Fixed attributes (not props): `type="submit"`; `data-rp-part="submit"`; the dialect submit attributes: hydrogen backend `name="intent" value="add"`, liquid backend `name="add"`.

### Content model

`text` - the button label. When there are no children the label is `Add to cart`, or `Sold out` when `disabled` is true.

### HTML contract

Fixture `default` (no props, no children):

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Add to cart</button>
```

Fixture `sold-out` (`disabled`: true, `fullWidth`: true, `size`: `lg`, `variant`: `secondary`):

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="secondary" data-size="lg" data-full-width="" data-rp-part="submit" disabled>Sold out</button>
```

Fixture `children` (children: `Pre-order`):

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Pre-order</button>
```

Further required fixtures: `class` (class `rp-button rp-add-to-cart-button custom-a custom-b`); `invalid-enum-falls-back` (`variant`: `fancy`; equals `default`).

Host-owned regions and masks: the submit attributes are dialect-owned (D-043). Masks: `{ "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name" }`, `{ "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | root | server | `disabled` is true | present or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. A click submits the form; `rp-product-form` intercepts the submit because the submitter matches `[data-rp-part="submit"]`.
2. The button is NOT disabled while the add is pending (D-045 item 3); a second submit is ignored by the element.

### Behaviour without JavaScript

The button submits the ProductForm natively.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native button; `checkPattern`: none.
- Accessible name: its text; required (the default label guarantees it).
- Focus: keeps focus after the add.
- Announcements: None (ProductForm announces).

| Key | Action |
|---|---|
| Enter, Space | submits the form |

### Styling

- File: `components/add-to-cart-button/add-to-cart-button.css` (layer `rp.components`).
- Tokens used: none of its own; all visuals come from `button.css`.
- Required rule: `.rp-add-to-cart-button { opacity: var(--rp-add-to-cart-button-opacity) }`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-add-to-cart-button-opacity` | `1` | opacity of the button; lowered while the form is pending |

| Modifier selector | Sets |
|---|---|
| `rp-product-form[data-pending] .rp-add-to-cart-button` | `--rp-add-to-cart-button-opacity: 0.7` |

### Host notes

- HTML: use the hydrogen attributes of the fixture.
- React: `AddToCartButton(props: { variant?: ButtonVariant; size?: "sm" | "md" | "lg"; fullWidth?: boolean; disabled?: boolean; strings?: { label?: string; soldOut?: string }; className?: string; children?: ReactNode })`. Compose by contract (D-070): the binding prints the `<button>` itself, `<button className={cx("rp-button", "rp-add-to-cart-button", className)} type="submit" name="intent" value="add" disabled={disabled} data-variant={variant} data-size={size} data-full-width={fullWidth ? "" : undefined} data-rp-part="submit" {...rest}>`; it does NOT render `<Button>`. Manifest `root.class`: `rp-button rp-add-to-cart-button`; `dependencies.components`: `["button"]`.
- Remix: None.
- Liquid: markup in `snippets/rp-add-to-cart-button.liquid`, which prints the `<button>` itself (compose by contract; it does NOT call `{% render 'rp-button' %}`): `class="rp-button rp-add-to-cart-button{% if class != blank %} {{ class }}{% endif %}" type="submit" name="add"`, `disabled` when set, Button's `data-variant`, `data-size`, `data-full-width`, then `data-rp-part="submit"`, then `{{ attributes }}` last (D-035). Schema settings: `variant`, `size`. Locale keys: `ripple.add-to-cart-button.label` = `Add to cart`; `ripple.add-to-cart-button.sold_out` = `Sold out`.

```tsx
<AddToCartButton fullWidth disabled={!variant.availableForSale} />
```

```liquid
{% block 'add-to-cart-button', full_width: true %}{% endblock %}
```

### Commerce

None. (The form dialect is owned by ProductForm.)

### Agent surface

`accessibility-tree`; actions: none (the bridge action `add` is on `rp-product-form`); confirm: none; secret: none.

### Checker rules

RP101 (`variant`, `size`), RP110. Manifest `rules[]`: `add-to-cart-in-product-form` (`requires-ancestor`, selector `:scope`, target `rp-product-form form`; "An AddToCartButton is outside a ProductForm, so it submits nothing.").

### Acceptance tests

1. Tier 2: fixtures `default`, `sold-out`, `children`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the masks above.
2. Tier 5: hydrogen hosts print `name="intent"` and `value="add"`; the Liquid shim prints `name="add"` and no `value`.
3. Tier 6: covered by ProductForm AT-6.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/05-commerce.md` section 6.2 (submit attributes, `data-rp-part="submit"`); ledger D-050, section 8.7.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
