# Blueprint: `cart`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The cart page: lines with quantity controls, summary, discount code, note and checkout. It is the no-JS target of the cart link and the confirmation page of an add when no drawer exists.

### Regions

`rp-cart-lines` (inside CartLines), `rp-cart-summary` (inside CartSummary).

### Components used

`cart-line`, `cart-lines`, `cart-note`, `cart-summary`, `checkout-button`, `container`, `discount-code`, `grid`, `heading`, `stack`. (`cart-line` is listed because CartLines renders it; `checkout-button` because CartSummary renders it.)

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1
   └─ Grid columns="1 lg:3" gap="8 md:12"
      ├─ CartLines id="cart" span="1 lg:2"      contains region rp-cart-lines; prints the empty state when the cart is empty
      └─ Stack gap="4"                          only when the cart has lines at render time
         ├─ CartSummary cartLines="cart"         contains region rp-cart-summary; its totals part prints the CheckoutButton
         ├─ DiscountCode id="cart-discount"
         └─ CartNote id="cart-note"
rp-view-event (cart view; child form, BP-11)
```

Below `lg` the summary column is under the lines. The layout does not render the CartDrawer on this page (rule L-B, `cartPage`).

Limit, stated so that nobody "fixes" it in the blueprint: the right column is decided on the server. When script removes the last line, `rp-cart-lines` is refreshed to the empty state but the right column stays until the next page load. CheckoutButton is inert for an empty cart; that behaviour is owned by `11-components-commerce.md` `## CheckoutButton`.

The blueprint prints no CheckoutButton of its own: CartSummary's region part `totals` prints it, inside the region, so that a changed checkout URL is refreshed (`11-components-commerce.md` `## CartSummary`, Anatomy). A second button would duplicate the control.

**React** (`blueprints/cart/react/cart.tsx`, complete):

```tsx
import type { RippleCart } from "__PKG__";
import { CartLines } from "@components/cart-lines";
import { CartNote } from "@components/cart-note";
import { CartSummary } from "@components/cart-summary";
import { Container } from "@components/container";
import { DiscountCode } from "@components/discount-code";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Stack } from "@components/stack";

export interface CartPageProps {
  /** Server cart read; null when the buyer has no cart yet. */
  cart: RippleCart | null;
  /** JSON text of the cart view event: `{ "event": ..., "payload": ... }` of 05-commerce.md section 12. */
  viewEvent: string;
  /** Cart endpoint including the locale path prefix (05-commerce.md 10.1 rule 7). Default "/api/cart". */
  cartAction?: string;
}

export function CartPage(props: CartPageProps) {
  const { cart, viewEvent, cartAction = "/api/cart" } = props;
  const payload = viewEvent.replace(/</g, "\\u003c");
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Heading level={1}>Cart</Heading>
          <Grid columns="1 lg:3" gap="8 md:12">
            <CartLines id="cart" cart={cart} action={cartAction} span="1 lg:2" />
            {cart !== null && cart.lines.length > 0 ? (
              <Stack gap="4">
                <CartSummary cart={cart} cartLines="cart" action={cartAction} />
                <DiscountCode id="cart-discount" action={cartAction} />
                <CartNote id="cart-note" cart={cart} action={cartAction} />
              </Stack>
            ) : null}
          </Grid>
        </Stack>
      </Container>
      <rp-view-event view-event-trigger="connect">
        <script type="application/json" data-view-event-payload="" dangerouslySetInnerHTML={{ __html: payload }} />
      </rp-view-event>
    </>
  );
}
```

There is no query constant: the cart comes from `cartHandlers.get({ storefrontClient, request })` (`05-commerce.md` section 10.1 rule 3), mapped to `RippleCart`. The response MUST NOT be cached publicly.

This is the one place where a blueprint uses `dangerouslySetInnerHTML`: the JSON body of the child-form view event (section 3, X-10). `<` is escaped as `\u003c` so that the text cannot close the script element.

**Remix**: rules R-1 to R-6; the script is written `<script type="application/json" data-view-event-payload="" innerHTML={unsafeHTML(payload)} />` with `unsafeHTML` from `remix/component`. The attribute MUST be written with the value `""`: a bare JSX attribute is `true`, and Remix prints `true` on a `data-*` name as `data-view-event-payload="true"` (`06-bindings.md` X-12), which would differ from the React and html output. **html**: rule H-1 with the sample cart of two lines.

**Liquid** (`blueprints/cart/liquid/templates/cart.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.cart.title' | t }}{% endblock %}
    {% block 'grid', columns: '1 lg:3', gap: '8 md:12' %}
      {% block 'cart-lines', id: 'cart', span: '1 lg:2' %}
        {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
      {% endblock %}
      {%- if cart.item_count > 0 -%}
        {% block 'stack', gap: '4' %}
          {% block 'cart-summary', cart_lines: 'cart' %}
            {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart' %}{% endpartial %}
          {% endblock %}
          {% block 'discount-code', id: 'cart-discount' %}{% endblock %}
          {% block 'cart-note', id: 'cart-note', cart_lines: 'cart' %}{% endblock %}
        {% endblock %}
      {%- endif -%}
    {% endblock %}
  {% endblock %}
{% endblock %}
<rp-view-event view-event-trigger="connect">
  <script type="application/json" data-view-event-payload>{{ cart | standard_event_data: 'view', context: 'page' }}</script>
</rp-view-event>
```

Locale keys (`ripple.blueprints.cart.*`): `title` "Cart". (The checkout label is CheckoutButton's own key.)

The Liquid cart form has the id `cart-form` (`<CartLines id>-form`, D-092); components receive the CartLines id through `cart_lines` and derive the form id themselves. The view-event payload is the platform filter's output, printed unescaped inside the JSON script (evidence: `ripple/theme/templates/cart.liquid`). Mask for BT-3: `{ "select": "rp-view-event > script", "op": "text" }` (the payload is masked as a whole, D-089 item 3). UNVERIFIED: the hydrogen-backend payload shape of the cart view (`05-commerce.md` section 12).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Cart | `cartHandlers.get(...)` result mapped to `RippleCart` (`05-commerce.md` section 11.1) | the global `cart`, passed to the region-part snippets |
| Cart endpoint | `cartAction`: `` `${requestContext.locale.pathPrefix}/api/cart` `` (`05-commerce.md` 10.1 rule 7, D-118) | `routes.cart_url` (printed inside the components) |
| View event | `viewEvent`: `JSON.stringify` of the cart view of `05-commerce.md` section 12 | `cart \| standard_event_data: 'view', context: 'page'` |

### No-JS behaviour

1. hydrogen backend: each line has its own form; "Update" sets the quantity, "Remove" removes the line; each posts to `/api/cart` and returns with a 303 to this page.
2. Liquid: one form; the "Update" button posts all quantities; "Remove" is a link (`item.url_to_remove`); the checkout button submits the same form with `name="checkout"`.
3. The note is saved by its "Save" button (hydrogen) or with the cart form (Liquid).
4. The discount form posts on the hydrogen backend. On Liquid the discount control needs script (`05-commerce.md` section 10.5); what it shows without script is owned by DiscountCode (`11-components-commerce.md`).
5. Checkout is a link (hydrogen) or a submit button (Liquid).

### Acceptance tests

BT-1 to BT-9, plus:

- **CR-1** (tier 2) With an empty cart: no `.rp-cart-summary`, no `.rp-checkout-button`; the lines region contains `.rp-empty-state`. With two lines: exactly one `.rp-checkout-button` exists, and `#cart`, `#cart-discount` and `#cart-note` exist.
- **CR-2** (tier 2) No `#cart-drawer` exists in the document, and the header cart link has no `data-rp-open` (D-091 item 5).
- **CR-3** (tier 5) Raising a quantity changes the line total text and the summary subtotal text without a document navigation, and each region root is replaced exactly once per mutation.
- **CR-4** (tier 6) With JavaScript disabled: update a quantity to 3 and submit; the reloaded page shows quantity 3. Remove a line; the reloaded page has one line fewer.
- **CR-5** (tier 2, Liquid) The template declares `rp-cart-lines` and `rp-cart-summary` exactly once each, and `layout/theme.liquid` rendered with `template.name == 'cart'` prints no `#cart-drawer`.
- **CR-6** (tier 2) Exactly one `rp-view-event` exists; it is the last element child of `<main>`, has `view-event-trigger="connect"` and exactly one child, `script[type="application/json"][data-view-event-payload]`, whose text parses as JSON.

---
