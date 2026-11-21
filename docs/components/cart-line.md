# CartLine

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `cart-line` |
| Kind | `static` |
| Category | `cart` |
| Custom elements | none of its own (it embeds QuantityInput, whose root is `rp-quantity`; the kind stays `static` per ledger section 8.3) |
| Root element and class | `li` `.rp-cart-line` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder`, `price`, `quantity-input`, `button`, `icon-button`, `icon`, `form-message` |
| Milestone | M3 |

### Purpose

One line of the cart: image, title link, variant, line attributes, quantity control, remove control, line price and the line's error message.

- Use when: inside the items list of CartLines (CartLines renders it; pages do not call it directly).
- Do not use when: outside an `rp-cart` root; the controls would do nothing with JavaScript.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartLine` | `blocks/cart-line.liquid` + `snippets/rp-cart-line.liquid` | `li` | `rp-cart-line` | `data-rp-line="<line id>"` | yes | none |
| media | printed by root | same | `div` | `rp-cart-line-media` | none | yes | none |
| details | printed by root | same | `div` | `rp-cart-line-details` | none | yes | none |
| title | printed by root | same | `a` | `rp-cart-line-title` | none | yes | none |
| variant | printed by root | same | `p` | `rp-cart-line-variant` | none | when `variantTitle` is not empty | none |
| attributes | printed by root | same | `dl` | `rp-cart-line-attributes` | none | when a visible attribute exists | none |
| actions | printed by root | same | `div` | `rp-cart-line-actions` | none | yes | none |
| form (hydrogen backend only) | printed by root | same | `form` | `rp-cart-line-form` | none | yes on hydrogen | none |
| remove | printed by root | same | `button` (hydrogen) or `a` (liquid) | `rp-icon-button rp-cart-line-remove` | liquid: `data-rp-part="remove"` | yes | none |
| price | printed by root | same | `div` | `rp-cart-line-price` | none | yes | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |

Nesting rules: root children in order: media, details, actions, price, error. Media contains one Image, or one Placeholder when the line has no image. Details contains title, then variant, then attributes. Attributes whose key starts with `_` are not printed; when none remains the `dl` is not printed. The root MUST be a child of the items `ul` of a CartLines.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `line` | `line` | object | `RippleLine` / Liquid `line_item` drop | none | yes | no | every part |
| `disabled` | none | boolean | `true false` | `false` | no | no | `disabled` on the quantity input, the steppers, Update and remove; React host only (optimistic lines) |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to Price (CV-1) |

### Content model

`none`. Liquid `{{ content }}`, when not blank, replaces the children of the details part (CV-6).

### HTML contract

Fixture `default` (`line`: `line.basic`; hosts `html`, `react`, `remix`):

```html
<li class="rp-cart-line" data-rp-line="gid://shopify/CartLine/1?cart=c1">
  <div class="rp-cart-line-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="6rem" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
  </div>
  <div class="rp-cart-line-details">
    <a class="rp-cart-line-title" href="/products/linen-shirt?variant=11">Linen Shirt</a>
    <p class="rp-cart-line-variant">Blue / S</p>
  </div>
  <div class="rp-cart-line-actions">
    <form class="rp-cart-line-form" method="post" action="/api/cart">
      <input type="hidden" name="lineId" value="gid://shopify/CartLine/1?cart=c1" data-rp-field="line-id">
      <button type="submit" name="intent" value="set" hidden></button>
      <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
        <button class="rp-quantity-button" type="button" aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
        <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="0" step="1" value="2" aria-label="Quantity for Linen Shirt" data-rp-part="input" data-rp-field="quantity">
        <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      </rp-quantity>
      <button class="rp-button rp-cart-line-update" type="submit" name="intent" value="set" data-variant="outline" data-size="sm" data-rp-part="submit" data-rp-js="fallback">Update</button>
      <button class="rp-icon-button rp-cart-line-remove" type="submit" name="intent" value="remove" data-variant="ghost" data-size="sm" aria-label="Remove Linen Shirt"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>
    </form>
  </div>
  <div class="rp-cart-line-price">
    <span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$96.00</bdi></span></span>
  </div>
  <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
</li>
```

Fixture `liquid-default` (same props; host `liquid`): identical to `default` except `data-rp-line="11:abc"` and the actions part:

```html
  <div class="rp-cart-line-actions">
    <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
      <button class="rp-quantity-button" type="button" aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
      <input class="rp-quantity-input" type="number" inputmode="numeric" name="updates[]" min="0" step="1" value="2" aria-label="Quantity for Linen Shirt" data-rp-part="input" data-rp-field="quantity">
      <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
    </rp-quantity>
    <a class="rp-icon-button rp-cart-line-remove" href="/cart/change?id=11:abc&amp;quantity=0" data-variant="ghost" data-size="sm" data-rp-part="remove" aria-label="Remove Linen Shirt"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></a>
  </div>
```

Fixture `sale` / `liquid-sale` (the second line of `cart.two-lines`): as `default` / `liquid-default` with line id `gid://shopify/CartLine/2?cart=c1` (Liquid `21:def`), the image of `product.sale`, title `Wool Socks` linking to `/products/wool-socks?variant=21`, NO variant part, quantity value `1`, labels `Quantity for Wool Socks` and `Remove Wool Socks`, and the price part:

```html
  <div class="rp-cart-line-price">
    <span class="rp-price" data-size="base" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
  </div>
```

Fixture `attributes` / `liquid-attributes` (`line.basic` with attributes `Engraving` = `BEN` and `_bundle` = `7`): as `default` / `liquid-default`, with this element as the last child of details:

```html
    <dl class="rp-cart-line-attributes"><div><dt>Engraving</dt><dd>BEN</dd></div></dl>
```

Further required fixtures: `no-image` (image null; media contains `<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>`); `class` (root class `rp-cart-line custom-a custom-b`); `escaping` (title `Say "hi" & <go>`; text `Say "hi" &amp; &lt;go&gt;` and `aria-label="Remove Say &quot;hi&quot; &amp; &lt;go&gt;"`).

Host-owned regions and masks: the actions part is dialect-owned (D-043, D-044), covered by the two fixture variants. Masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }`, `{ "select": ".rp-price-current", "op": "text" }`, `{ "select": ".rp-price-compare", "op": "text" }`, `{ "select": ".rp-cart-line-title", "op": "attr", "name": "href" }`, `{ "select": "[data-rp-field=\"line-id\"]", "op": "attr", "name": "value" }`, `{ "select": ".rp-cart-line-form", "op": "attr", "name": "action" }`, `{ "select": "a.rp-cart-line-remove", "op": "attr", "name": "href" }`. `data-rp-line` is a Ripple-owned attribute and is NOT masked (D-074): each backend-scoped fixture states its own value (`gid://shopify/CartLine/1?cart=c1` on hydrogen hosts, `11:abc` on Liquid), and the resource data of doc 13 provides exactly those ids.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-line` | root | server | always | the line id (hydrogen: cart line gid; liquid: `item.key`) |
| `data-pending` | root | `rp-cart` | `state.pending.lines` has this line | absent |
| `aria-busy` | root | `rp-cart` | same (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no error for this line | present |
| `disabled` | decrement button | `rp-quantity` | value equals `min` | absent (value is at least 1) |

Upgrade allow-list (mutations permitted when the element upgrades): None of its own. The line root flags and the error part are covered by the allow-list of CartLines. The embedded QuantityInput has an empty allow-list ([10-components-interactive.md](10-components-interactive.md), QuantityInput): the server prints `disabled` on a stepper button that is at its limit, so the upgrade writes nothing.

### Behaviour with JavaScript

1. None of its own. `rp-quantity` steps the value and dispatches `valuechange`; the enclosing `rp-cart` reacts as described under CartLines.
2. The Update button (hydrogen) is hidden by `data-rp-js="fallback"` once the document is marked ready (D-021), because quantity changes submit themselves.

### Behaviour without JavaScript

hydrogen backend: the quantity field and the Update button post `intent=set`; the remove button posts `intent=remove`. The steppers are hidden (`data-rp-js="inflow"`); the number input is typed into directly. liquid backend: the quantity input belongs to the cart form of CartLines and is sent by `Update cart`; the remove link navigates to `item.url_to_remove`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: list item with a form; `checkPattern`: none.
- Accessible name: quantity input `aria-label="Quantity for <title>"`; remove control `aria-label="Remove <title>"`; both required and both contain the product title so that controls of different lines are distinguishable.
- Focus: tab order title, quantity (decrement, input, increment), remove. Nothing moves focus.
- Announcements: line errors through the error part (`role="alert"`).

| Key | Action |
|---|---|
| Enter in the quantity input | submits the set (see CartLines) |
| ArrowUp, ArrowDown in the quantity input | native number stepping; the change is sent after 250 ms |

### Styling

- File: `components/cart-line/cart-line.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-foreground`, `--color-muted-foreground`, `--radius-surface`, `--text-sm`, `--text-base`, `--font-weight-medium`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-line-media-size` | `6rem` | inline size of the media column |
| `--rp-cart-line-gap` | `calc(var(--spacing) * 4)` | column and row gap |
| `--rp-cart-line-pending-opacity` | `0.6` | opacity while the line is pending |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-line[data-pending]` | `--rp-cart-line-opacity: var(--rp-cart-line-pending-opacity)` |

Required rules: root `display: grid; grid-template-columns: var(--rp-cart-line-media-size) minmax(0, 1fr) auto; grid-template-areas: "media details price" "media actions actions" "error error error"; gap: var(--rp-cart-line-gap); opacity: var(--rp-cart-line-opacity, 1)`; each part is assigned its grid area; `.rp-cart-line-form { display: flex; align-items: center; gap: calc(var(--spacing) * 2) }`; `.rp-cart-line-actions { display: flex; align-items: center; gap: calc(var(--spacing) * 2) }`; `.rp-cart-line-attributes > div { display: flex; gap: calc(var(--spacing) * 1) }`.

### Host notes

- HTML: copy the `default` contract per line.
- React: `CartLine(props: { line: RippleLine; disabled?: boolean; locale?: string; className?: string })`. No hook, no directive. Image: the embedded Image, `<Image image={line.image} sizes="6rem" ratio="1/1" />` (Image prints `src` and `srcset`, doc 09). Sale test: `line.compareAtTotalPrice !== null`. The remove control and the update button compose IconButton and Button by contract (D-070; class pairs `rp-icon-button rp-cart-line-remove` and `rp-button rp-cart-line-update`, section 0.2): the binding prints both elements itself. The quantity control is the embedded QuantityInput.
- Remix: no `data-rmx-*` attribute on the `li`; the actions form prints `data-rmx-document` (a cart form, D-034 item 3).
- Liquid: `line` is a `line_item` drop. Title `line.product.title`; variant `line.variant.title` unless `line.product.has_only_default_variant`; attributes `line.properties` (skip a key whose first character is `_` and a blank value); price `line.final_line_price`, compare-at `line.original_line_price` when greater. No schema settings. Locale keys: `ripple.cart-line.remove` = `Remove {{ title }}`; `ripple.cart-line.quantity` = `Quantity for {{ title }}`; `ripple.cart-line.update` = `Update`.

```tsx
<CartLine line={line} />
```

```liquid
{% render 'rp-cart-line', line: item %}
```

### Commerce

None of its own; it has no element. The dialect markup it prints is specified under "HTML contract" and in the CartLines "Commerce" table.

### Agent surface

`accessibility-tree`; actions: none (bridge actions are on the CartLines root); confirm: none; secret: none.

### Checker rules

RP104 (`line`), RP110, RP203 (image), RP301 (every button has a form ancestor or `data-rp-js`), RP305. Manifest `rules[]`: `cart-line-in-cart` (`requires-ancestor`, selector `:scope`, target `rp-cart`; "A CartLine is outside an rp-cart root; its controls do nothing with JavaScript."); `cart-line-error` (`requires-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-line-quantity` (`requires-descendant`, selector `:scope`, target `input[data-rp-field="quantity"]`).

### Acceptance tests

1. Tier 2: `default`, `sale`, `attributes`, `no-image`, `class`, `escaping` (hydrogen hosts) and the `liquid-*` variants (shim) are canonical-equal with the masks above.
2. Tier 5: in the hydrogen fixture the first `button[type="submit"]` of the form is `name="intent" value="set"` with `hidden`.
3. Tier 5: an attribute with key `_bundle` is not in the DOM.
4. Tier 6: hydrogen dev server, scripting disabled: pressing the remove button yields a page without the line.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) section 6.2 (line forms, hidden first `set` button, `updates[]`, remove link); [10-components-interactive.md](10-components-interactive.md), QuantityInput (the embedded `rp-quantity` contract; D-069); Liquid `line_item` drop members listed in section 0.6.
- UNVERIFIED: the exact URL shape of `item.url_to_remove` (shown as `/cart/change?id=<key>&quantity=0`; masked in the fixture).

### Fallback (SPIKE-nn)

None.

---
