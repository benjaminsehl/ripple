# Button

A button or a link that looks like a button. Zero JavaScript.

- Kind: static. Without JavaScript: full. Native <button> or <a>. Nothing to enhance.
- Accessibility: native. Name required: when-no-text.
- Agents: accessibility-tree.

## Use when
- Submitting a form
- Navigating to a route with button styling (pass href)
- Triggering a command on another element (commandfor/command via attributes)

## Use something else when
- The control shows only an icon: use `icon-button`.
- Inline text link inside a paragraph: use `link`.
- Going to checkout: use `checkout-button`.

## Props

| Prop | Values | Default | Responsive | Hosts | Description |
|---|---|---|---|---|---|
| `variant` | `primary` `secondary` `outline` `ghost` `link` `destructive` | primary |  | all | Visual treatment. |
| `size` | `sm` `md` `lg` | md |  | all | Control height and padding. |
| `type` | `button` `submit` `reset` | button |  | all | Native button type. Ignored when href is set. |
| `href` | url |  |  | all | When set, the root element is <a>. |
| `disabled` | boolean | false |  | all | Native disabled on <button>; aria-disabled="true" and tabindex="-1" on <a>. |
| `fullWidth` | boolean | false |  | all | Stretch to the container width. |
| `name` | string |  |  | all | Form field name (button only). |
| `value` | string |  |  | all | Form field value (button only). |
| `ariaLabel` | string |  |  | all | Accessible name. Required when the content has no text. |
| `id` | id |  |  | all | Root element id. |

## HTML contract

`default`

```html
<button class="rp-button" type="button" data-variant="primary" data-size="md">Add to cart</button>
```

`submit-outline-lg`

```html
<button class="rp-button" type="submit" name="add" data-variant="outline" data-size="lg">Add to cart</button>
```

`link`

```html
<a class="rp-button" href="/cart" data-variant="primary" data-size="md">View cart</a>
```

`link-disabled`

```html
<a class="rp-button" href="/cart" aria-disabled="true" tabindex="-1" data-variant="primary" data-size="md">View cart</a>
```

`invalid-enum-falls-back`

```html
<button class="rp-button" type="button" data-variant="primary" data-size="md">Buy</button>
```
