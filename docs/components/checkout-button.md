# CheckoutButton

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `checkout-button` |
| Kind | `static` |
| Category | `cart` |
| Custom elements | none |
| Root element and class | hydrogen backend: `a` `.rp-button.rp-checkout-button`; liquid backend: `button` `.rp-button.rp-checkout-button` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `button` |
| Milestone | M3 |

### Purpose

The control that takes the buyer to Shopify checkout (D-050). It composes Button by contract (D-070; class pair `rp-button rp-checkout-button`, section 0.2) and adds the backend's checkout semantics and the agent confirmation sentence.

- Use when: leaving the cart for checkout. CartSummary prints it; use it directly only in a custom summary.
- Do not use when: adding to cart (AddToCartButton) or for accelerated wallets (`acceleratedCheckout` on ProductForm and CartSummary).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CheckoutButton` | `blocks/checkout-button.liquid` + `snippets/rp-checkout-button.liquid` | `a` (hydrogen) or `button` (liquid) | `rp-button rp-checkout-button` | `data-agent-confirm` | yes | none |
| own form (liquid backend, only when `cart_lines` is blank) | printed by root | same | `form` | `rp-checkout-button-form` | none | no | none |

Nesting rules: hydrogen backend: no restriction except that it MUST NOT be inside an `<a>` or `<button>`. liquid backend with `cart_lines`: anywhere in the document, but NOT inside another `<form>` (it joins the cart form by the `form` attribute). liquid backend without `cart_lines`: the binding wraps the button in its own form; that wrapper MUST NOT be inside another form.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | none | url | the cart's `checkoutUrl` | none | yes (hydrogen hosts) | no | `href`; TSX and HTML hosts only |
| none | `cart_lines` | string | the `id` of the CartLines on the page | none | no | no | `form="<value>-form"`; Liquid only |
| `variant` | `variant` | enum | `primary secondary outline ghost link destructive` | `primary` | no | no | `data-variant` |
| `size` | `size` | enum | `sm md lg` | `lg` | no | no | `data-size` |
| `fullWidth` | `full_width` | boolean | `true false` | `true` | no | no | `data-full-width=""` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | the control is inert (D-050 item d). `button`: `disabled`, printed directly before `data-variant`. `a`: NO `href`, and `aria-disabled="true"` printed directly after the class. The caller sets it when the cart is empty (CartSummary prints no CheckoutButton for an empty cart) |

Fixed attributes: `data-agent-confirm="Goes to checkout with this cart"` (REQUIRED in every host and both forms; D-050, D-095), printed last; liquid backend: `type="submit" name="checkout"`; Remix: `data-rmx-document` on the link (D-034; checkout is not an app route).

Attribute order (Button's order, [09-components-foundation.md](09-components-foundation.md), with the additions of this component): link: `class`, `href`, `aria-disabled`, `data-variant`, `data-size`, `data-full-width`, `data-rmx-document`, `data-agent-confirm`. Button: `class`, `type`, `name`, `form`, `disabled`, `data-variant`, `data-size`, `data-full-width`, `data-agent-confirm`.

The inert link differs on purpose from Button's own `disabled` link (which keeps `href` and adds `tabindex="-1"`): a link without `href` is not focusable and cannot navigate, so no `tabindex` is printed (D-050 item d).

### Content model

`text` - the label. Default `Check out`.

### HTML contract

Fixture `default` (`href`: `/checkout`; hosts `html`, `react`, `remix`):

```html
<a class="rp-button rp-checkout-button" href="/checkout" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</a>
```

Fixture `liquid-default` (`cart_lines`: `cart`; host `liquid`):

```html
<button class="rp-button rp-checkout-button" type="submit" name="checkout" form="cart-form" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
```

Fixture `liquid-standalone` (no params; host `liquid`):

```html
<form class="rp-checkout-button-form" method="post" action="/cart">
  <button class="rp-button rp-checkout-button" type="submit" name="checkout" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
</form>
```

Fixture `disabled` (`href`: `/checkout`, `disabled`: true; hosts `html`, `react`, `remix`):

```html
<a class="rp-button rp-checkout-button" aria-disabled="true" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</a>
```

Fixture `liquid-disabled` (`cart_lines`: `cart`, `disabled`: true; host `liquid`):

```html
<button class="rp-button rp-checkout-button" type="submit" name="checkout" form="cart-form" disabled data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
```

Further required fixtures (both variants): `children` (children `Pay now`); `inline` (`fullWidth`: false, `size`: `md`, `variant`: `secondary`; no `data-full-width`, `data-size="md"`, `data-variant="secondary"`); `class` (class `rp-button rp-checkout-button custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals the default of the variant).

Host-owned regions and masks: `{ "select": "a.rp-checkout-button", "op": "attr", "name": "href" }`; `{ "select": "form.rp-checkout-button-form", "op": "attr", "name": "action" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-agent-confirm` | root | server | always | `Goes to checkout with this cart` |
| `disabled` (button), `aria-disabled` and absent `href` (link) | root | server | prop `disabled` is true | absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. `rp-cart` never intercepts a submitter named `checkout` and never intercepts links; the navigation is native in every host.
2. A host agent MUST ask the user for confirmation before activating an element with `data-agent-confirm` (D-050, D-095; [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.3). Whether the UI SDK bridge enforces this is UNVERIFIED (SPIKE-08).
3. With `disabled` the control does nothing: a disabled button does not submit; a link without `href` does not navigate.

### Behaviour without JavaScript

hydrogen backend: the link navigates to `checkoutUrl`. liquid backend: the button submits the cart form with `checkout`; Shopify saves the form's quantities and note and redirects to checkout.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link or native submit button; `checkPattern`: none.
- Accessible name: its text; required.
- Focus: one tab stop.
- Announcements: None.

| Key | Action |
|---|---|
| Enter (link); Enter, Space (button) | goes to checkout |

### Styling

- File: `components/checkout-button/checkout-button.css` (layer `rp.components`).
- Tokens used: none of its own; visuals come from `button.css`.

| Custom property | Default | Purpose |
|---|---|---|
| None | | |

| Modifier selector | Sets |
|---|---|
| None | |

Required rule: `.rp-checkout-button-form { display: contents }`. This is allowed by D-080 because a `<form>` is not a custom element root; D-080 forbids `display: contents` only on `rp-*` roots. Inert link: `.rp-checkout-button[aria-disabled="true"]` gets the disabled visuals of `button.css` (`pointer-events: none`).

### Host notes

- HTML: use the `default` contract with the cart's checkout URL.
- React: `CheckoutButton(props: { href: string; variant?: ButtonVariant; size?: "sm" | "md" | "lg"; fullWidth?: boolean; disabled?: boolean; strings?: { label?: string; agentConfirm?: string }; className?: string; children?: ReactNode })`. Compose by contract (D-070): the binding prints the `<a>` itself, `<a className={cx("rp-button", "rp-checkout-button", className)} href={disabled ? undefined : href} aria-disabled={disabled ? "true" : undefined} data-variant={variant} data-size={size} data-full-width={fullWidth ? "" : undefined} data-agent-confirm={agentConfirm} {...rest}>`; it does NOT render `<Button>`. No hook. The app MUST NOT wrap it in a router `<Link>`.
- Remix: the same element, with `data-rmx-document` (D-034).
- Liquid: `snippets/rp-checkout-button.liquid` prints the `<button>` itself (compose by contract, D-070; it does NOT call `{% render 'rp-button' %}`): `type="submit" name="checkout"`, then `form="{{ cart_lines }}-form"` when `cart_lines` is given (D-050 item c, D-092), then `disabled` when `disabled` is true, then Button's `data-*` attributes, then `data-agent-confirm`, then `{{ attributes }}` last (D-035). When `cart_lines` is blank it wraps the button in `<form class="rp-checkout-button-form" method="post" action="{{ routes.cart_url }}">`. Schema settings: `variant`, `size`. Locale keys: `ripple.checkout-button.label` = `Check out`; `ripple.checkout-button.agent_confirm` = `Goes to checkout with this cart`.
- Manifest: `root.class` is `rp-button rp-checkout-button`; `dependencies.components` is `["button"]`; `agent.confirm[]` as under Agent surface.

```tsx
<CheckoutButton href={cart.checkoutUrl} />
```

```liquid
{% block 'checkout-button', cart_lines: 'cart' %}{% endblock %}
```

### Commerce

None. (No element. The backend difference is D-050: link to `checkoutUrl` versus `name="checkout"` submit of the cart form.)

### Agent surface

`accessibility-tree`; actions: none. No bridge action named `checkout` exists (D-050; SPIKE-08). Confirm: REQUIRED. The root carries `data-agent-confirm="Goes to checkout with this cart"` in every host and both forms (locale key `ripple.checkout-button.agent_confirm`; doc 08 section 7.3). Manifest `agent.confirm[]`: `{ "select": "a.rp-checkout-button" }` and `{ "select": "button[name=\"checkout\"]" }`, each with that sentence (checker RP320). Secret: none.

### Checker rules

RP101 (`variant`, `size`), RP104 (`href` on hydrogen hosts), RP110 (class on `a` or `button` only), RP306 (Liquid: `name="checkout"`), RP320 (`data-agent-confirm` non-empty). Manifest `rules[]`: `checkout-button-not-nested` (`forbids-ancestor`, selector `a.rp-checkout-button`, target `a, button`); `checkout-button-form-target` (`requires-attribute`, selector `button.rp-checkout-button:not(form button)`, target `form`; "A Liquid CheckoutButton outside a form needs cart_lines so that it submits the cart form.").

### Acceptance tests

1. Tier 2: `default`, `disabled`, `children`, `inline`, `class`, `invalid-enum-falls-back` (hydrogen hosts) and `liquid-default`, `liquid-standalone`, `liquid-disabled` and the other `liquid-*` variants (shim) are canonical-equal with the masks above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-07: a click on the Liquid button inside an `rp-cart` page produces a native submit whose submitter name is `checkout` and no `updateCart` call.
3. Tier 5: `ripple check` on HTML with the `data-agent-confirm` attribute removed reports RP320.
4. Tier 6: scripting disabled: hydrogen dev server navigates to the checkout URL; Liquid shim receives a POST to `/cart` containing `checkout`.
5. Tier 2 and tier 5: fixture `disabled` has no `href` and is skipped by Tab; fixture `liquid-disabled` matches `:disabled` and a click sends no request.

### Evidence and UNVERIFIED

- Evidence: D-050; [05-commerce.md](05-commerce.md) section 6.2 (checkout); `ripple/docs/research/base-theme.md` (cart form with `name="checkout"`); `hydrogen/packages/hydrogen/src/core/cart/queries.ts` (`checkoutUrl`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
