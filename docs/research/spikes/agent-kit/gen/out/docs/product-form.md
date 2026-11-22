# ProductForm

The add-to-cart form for one product. Works as a plain form post; enhanced through the Hydrogen cart store.

- Kind: commerce. Without JavaScript: full. The inner form posts to the host cart endpoint (Liquid: /cart/add with id; Hydrogen host: /api/cart with merchandiseId) and the browser navigates. If ripple.js fails to load or the cart store cannot be created, the element MUST NOT call preventDefault().
- Accessibility: native. Name required: never.
- Agents: bridge (setQuantity, add).

## Use when
- Selling one product: wraps quantity, selling plan and the submit button

## Use something else when
- Choosing options/variants: use `variant-picker (outside the form; option values are links)`.
- Changing a line already in the cart: use `cart-line`.

## Props

| Prop | Values | Default | Responsive | Hosts | Description |
|---|---|---|---|---|---|
| `product` | object |  |  | all | The product being sold. |
| `variant` | object |  |  | all | Selected variant. Default: the selected or first available variant. |
| `acceleratedCheckout` | boolean | false |  | all | Print accelerated checkout buttons after the body. |
| `id` | id |  |  | all | Id of the inner <form>. |

## HTML contract

`available`

```html
<rp-product-form class="rp-product-form" data-product-id="MASKED"><form id="pf" class="rp-product-form-fields" action="MASKED" method="MASKED"><input type="hidden" data-rp-field="merchandise-id" name="MASKED" value="MASKED"><button class="rp-button" type="submit" name="add" data-variant="primary" data-size="md">Add to cart</button><p class="rp-form-message" data-rp-part="error" data-tone="critical" role="alert" hidden></p></form></rp-product-form>
```
