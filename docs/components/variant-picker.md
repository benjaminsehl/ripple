# VariantPicker

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `variant-picker` |
| Kind | `commerce` |
| Category | `product` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-variant-picker` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `swatch`, `select`, `label`, `button`, `visually-hidden` |
| Milestone | M3 |

### Purpose

Lets the buyer choose a product variant. Every option value is a link (or a GET form with a select) to the URL of the resulting variant, so selection works without JavaScript; with JavaScript the product regions refresh in place.

- Use when: a product has more than one variant.
- Do not use when: choosing something that is not a product option; use RadioGroup or Select.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `VariantPicker` | `blocks/variant-picker.liquid` | `rp-live` | `rp-variant-picker` | `data-slot="rp-live"`, `data-rp-refresh` | yes | `<id>` |
| option | printed by root | same | `div` (layouts `auto`, `buttons`) or `form` (layout `dropdown`) | `rp-variant-picker-option` | none | one per product option | none |
| legend | printed by root | same | `p` | `rp-variant-picker-legend` | none | layouts `auto`, `buttons` | none |
| selected | printed by root | same | `span` | `rp-variant-picker-selected` | none | inside legend | none |
| values | printed by root | same | `div` | `rp-variant-picker-values` | none | layouts `auto`, `buttons` | none |
| value | printed by root | same | `a` (variant exists) or `span` (variant does not exist) | `rp-variant-picker-value` | none | one per option value | link: `<id>-item-<o>-<v>` |
| label | printed by root | same | `span` | `rp-variant-picker-label` | none | inside value | none |

`<o>` is the 1-based position of the option, `<v>` the 1-based position of the value. In layout `dropdown` the `<select>` has id `<id>-item-<o>`.

Nesting rules: options are the only children of root. A VariantPicker MUST be a sibling of ProductForm, never inside it. For in-place refresh it MUST be inside region `rp-product-buy` (declared by the blueprint), so that the selected state is re-rendered. When the product has only one variant (TSX: every option has exactly one value; Liquid: `product.has_only_default_variant`), the component prints NOTHING.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on root; derives value ids |
| `product` | `product` | object | `RippleProductDetail` ([05-commerce.md](05-commerce.md) 11.1; the fields `url`, `options`, `selectedOrFirstAvailableVariant`, `adjacentVariants` are read) / Liquid `product` drop | none | yes | no | options and values |
| `layout` | `layout` | enum | `auto buttons dropdown` | `auto` | no | no | `data-layout` on root |
| `refresh` | `refresh` | string | region names | `rp-product-buy rp-product-media` | no | no | `data-rp-refresh` on root |
| `search` | none | string | the current query string without `?` | empty string | no | no | base of value URLs (keeps unrelated params); TSX hosts only |

Layout rules: `buttons`: every value is a text button-like link. `auto`: an option whose values ALL have swatch data (a colour or an image) prints Swatches and carries `data-swatch=""` on each value; every other option prints as `buttons`. `dropdown`: every option is a GET form with a select.

### Content model

`none` - the component prints everything from `product`. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6).

### HTML contract

Fixture `default` (`id`: `vp`, `product`: `product.options`; hydrogen backend URLs):

```html
<rp-live class="rp-variant-picker" data-slot="rp-live" id="vp" data-layout="auto" data-rp-refresh="rp-product-buy rp-product-media">
  <div class="rp-variant-picker-option" role="group" aria-label="Color">
    <p class="rp-variant-picker-legend" aria-hidden="true">Color: <span class="rp-variant-picker-selected">Blue</span></p>
    <div class="rp-variant-picker-values">
      <a class="rp-variant-picker-value" id="vp-item-1-1" href="/products/linen-shirt?Color=Blue&amp;Size=S" aria-current="true" data-swatch=""><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#1d4ed8"></span><span class="rp-variant-picker-label">Blue</span></a>
      <a class="rp-variant-picker-value" id="vp-item-1-2" href="/products/linen-shirt?Color=Sand&amp;Size=S" data-swatch="" data-sold-out=""><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#d6c7a1"></span><span class="rp-variant-picker-label">Sand</span><span class="rp-visually-hidden">(Sold out)</span></a>
    </div>
  </div>
  <div class="rp-variant-picker-option" role="group" aria-label="Size">
    <p class="rp-variant-picker-legend" aria-hidden="true">Size: <span class="rp-variant-picker-selected">S</span></p>
    <div class="rp-variant-picker-values">
      <a class="rp-variant-picker-value" id="vp-item-2-1" href="/products/linen-shirt?Color=Blue&amp;Size=S" aria-current="true"><span class="rp-variant-picker-label">S</span></a>
      <a class="rp-variant-picker-value" id="vp-item-2-2" href="/products/linen-shirt?Color=Blue&amp;Size=M"><span class="rp-variant-picker-label">M</span></a>
      <span class="rp-variant-picker-value" data-disabled=""><span class="rp-variant-picker-label">L</span><span class="rp-visually-hidden">(Unavailable)</span></span>
    </div>
  </div>
</rp-live>
```

Fixture `dropdown` (`id`: `vp`, `product`: `product.options`, `layout`: `dropdown`):

```html
<rp-live class="rp-variant-picker" data-slot="rp-live" id="vp" data-layout="dropdown" data-rp-refresh="rp-product-buy rp-product-media">
  <form class="rp-variant-picker-option" method="get" action="/products/linen-shirt">
    <label class="rp-label" for="vp-item-1">Color</label>
    <select class="rp-select" data-size="md" id="vp-item-1" name="variant">
      <option value="11" selected>Blue</option>
      <option value="13">Sand (Sold out)</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply</button>
  </form>
  <form class="rp-variant-picker-option" method="get" action="/products/linen-shirt">
    <label class="rp-label" for="vp-item-2">Size</label>
    <select class="rp-select" data-size="md" id="vp-item-2" name="variant">
      <option value="11" selected>S</option>
      <option value="12">M</option>
      <option value="" disabled>L (Unavailable)</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply</button>
  </form>
</rp-live>
```

Fixture `single-variant` (`id`: `vp`, `product`: `product.basic`): the output is the empty string.

Further required fixtures: `buttons` (`layout`: `buttons`; as `default` but the two Color values have no `data-swatch` attribute and no Swatch child); `class`; `invalid-enum-falls-back` (`layout`: `grid`; equals `default`); `escaping` (`refresh`: `Say "hi" & <go>`; `data-rp-refresh="Say &quot;hi&quot; &amp; &lt;go&gt;"`).

Per-value rules (all layouts):

| Condition | Layouts `auto`, `buttons` | Layout `dropdown` |
|---|---|---|
| value is selected | `aria-current="true"` on the link | `selected` on the `<option>` |
| variant exists and is available | link with `href` | `<option value="<numeric variant id>">` |
| variant exists, not available | link with `href`, `data-sold-out=""`, and `<span class="rp-visually-hidden">(Sold out)</span>` | option text suffixed with ` (Sold out)`; still selectable |
| variant does not exist | `<span>` with `data-disabled=""`, no `id`, no `href`, and `<span class="rp-visually-hidden">(Unavailable)</span>` | `<option value="" disabled>` with text suffixed ` (Unavailable)` |

"The variant" of a value is the variant reached by replacing, in the current selection, this option's value with that value.

Host-owned regions and masks: value URLs differ by backend (hydrogen: option params such as `?Color=Sand&Size=S`; Liquid: `value.variant.url`, such as `?variant=13`). Masks: `{ "select": "a.rp-variant-picker-value", "op": "attr", "name": "href" }`. Nothing else is masked; in layout `dropdown` both backends print the numeric variant id as the option value.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current` | value link | server | value is selected | `true` or absent |
| `data-sold-out` | value | server | variant exists and is not available | `""` or absent |
| `data-disabled` | value `span` | server | variant does not exist | `""` |
| `data-swatch` | value | server | the option prints Swatches | `""` or absent |
| `data-pending`, `aria-busy` | root | `rp-live` | while the regions refresh | absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. An unmodified primary click on a value link calls `preventDefault()`, sets `data-pending=""` and `aria-busy="true"` on the root, and calls `getCommerce().refresh(["rp-product-buy", "rp-product-media"], { url: link.href, reason: "variant" })`.
2. Because every region name starts with `rp-product-`, the URL is written with `history.replaceState` (no new history entry).
3. In layout `dropdown`, a `change` on a select submits its form through `rp-live`; the URL is the form action plus `?variant=<id>`.
4. After the refresh the VariantPicker (inside `rp-product-buy`) is new markup; focus is restored to the element with the same `id` ([05-commerce.md](05-commerce.md) section 8.2 step 9).
5. When the refresh fails, the browser navigates to the URL.
6. Modified clicks, and every click when `usable` is false, navigate natively.

### Behaviour without JavaScript

Value links navigate to the variant URL; the server renders the page for that variant. In layout `dropdown` each option has an `Apply` submit button (`data-rp-js="fallback"`, hidden once `rp-live` is defined). Nothing is missing.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `rp:refresh` | `document` (dispatched by the adapter) | `{ regions, url, reason: "variant" }` | none |
| event | `rp:refreshed` | `document` | `{ regions, ok }` | none |

### Accessibility

- Pattern: a group of links per option with `aria-current` on the selected link (`hydrogen/packages/hydrogen/skills/hydrogen-variant-form/SKILL.md`: links, not radios); layout `dropdown`: native select with a label. `checkPattern`: none.
- Accessible name: each option group is named by `aria-label` (the option name); each value by its label text, plus `(Sold out)` or `(Unavailable)`. Swatch values keep the label in the DOM; CSS hides it visually.
- Focus: stays on the activated value after the refresh (restored by `id`).
- Announcements: None in V1; the selected value is exposed through `aria-current`.

| Key | Action |
|---|---|
| Tab | moves through the value links |
| Enter | selects the value |

### Styling

- File: `components/variant-picker/variant-picker.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-md`, `--radius-control`, `--color-border`, `--color-foreground`, `--color-background`, `--color-primary`, `--color-primary-foreground`, `--color-muted-foreground`, `--color-accent`, `--color-ring`, `--text-sm`, `--rp-duration-fast`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-variant-picker-gap` | `calc(var(--spacing) * 4)` | block gap between options |
| `--rp-variant-picker-value-gap` | `calc(var(--spacing) * 2)` | gap between values |
| `--rp-variant-picker-value-height` | `var(--spacing-control-md)` | block size of a text value |
| `--rp-variant-picker-radius` | `var(--radius-control)` | corner radius of a text value |

| Modifier selector | Sets |
|---|---|
| `.rp-variant-picker-value[aria-current="true"]` | `--_bg: var(--color-primary); --_fg: var(--color-primary-foreground); --_border: var(--color-primary)` |
| `.rp-variant-picker-value[data-sold-out]` | `--_fg: var(--color-muted-foreground)` and a diagonal line drawn with a background gradient |
| `.rp-variant-picker-value[data-disabled]` | `--_fg: var(--color-muted-foreground); --_border: transparent`; `cursor: not-allowed` |
| `.rp-variant-picker-value[data-swatch]` | `--_bg: transparent; --_border: transparent`; the label is clipped with the VisuallyHidden technique; a selected swatch value gets a 2px ring in `--color-foreground` |

Required rules: `base.css` carries `rp-live { display: block }` (generated). Every value has a minimum target size of 24 by 24 CSS px (D-066). Hover styles inside `@media (hover: hover)`.

### Host notes

- HTML: None.
- React: `VariantPicker(props: { id: string; product: VariantPickerProduct; layout?: "auto" | "buttons" | "dropdown"; refresh?: string; search?: string; className?: string })`. No hook. The component calls the pure function `variantPickerOptions`, which lives with its types in `variant-picker.data.ts` (CV-10; the binding imports `./variant-picker.data`, blueprints import `@components/variant-picker.data`); the app passes a `RippleProductDetail` (mapped from the fragment `RippleProductDetail`; its `url` is computed by the host).
- Remix: `data-rmx-key="<id>"` on the root; `data-rmx-preserve-attrs="data-pending aria-busy"` on the root.
- Liquid: loop `product.options_with_values`; per value: `exists` is `value.variant != blank`; sold out is `value.variant.available == false`; URL is `value.product_url` when not blank, otherwise `value.variant.url`; selected is `value.selected`; swatch is `value.swatch`. `auto` test per option: every value has `value.swatch != blank`. Layout `dropdown`: `action="{{ product.url }}"`, `<option value="{{ value.variant.id }}">`. One schema setting: `layout` (`select`). Locale keys: `ripple.variant-picker.sold_out` = `(Sold out)`; `ripple.variant-picker.unavailable` = `(Unavailable)`; `ripple.variant-picker.apply` = `Apply`. In layout `dropdown` the option text is `<name> <string>`.

`components/variant-picker/react/variant-picker.data.ts` and `components/variant-picker/remix/variant-picker.data.ts` MUST contain exactly this code (manifest file key `data`; no `"use client"`). `buildProductSelectionSearchParams` is one of the seven value imports of D-094. The option shapes are defined once, in [05-commerce.md](05-commerce.md) section 11.1, and imported from `<pkg>` (D-094): the input is the four fields of `RippleProductDetail` that the alias `VariantPickerProduct` picks (`RippleProductOption`, `RippleProductOptionValue` and `RippleVariant` are their member types), and the output is `RippleVariantOption[]` (values `RippleVariantOptionValue`). This file declares no interface of its own.

```ts
import { buildProductSelectionSearchParams } from "@shopify/hydrogen";
import type { RippleProductDetail, RippleVariantOption } from "__PKG__";

/** The fields of RippleProductDetail that the picker reads (05-commerce.md section 11.1). */
export type VariantPickerProduct = Pick<RippleProductDetail, "url" | "options" | "selectedOrFirstAvailableVariant" | "adjacentVariants">;

export function variantPickerOptions(product: VariantPickerProduct, search = ""): RippleVariantOption[] {
  const selected = product.selectedOrFirstAvailableVariant;
  const current = selected ? selected.selectedOptions : [];
  const candidates = selected ? [selected, ...product.adjacentVariants] : product.adjacentVariants;
  const optionNames = product.options.map((option) => option.name);
  return product.options.map((option) => {
    const selectedValue = current.find((entry) => entry.name === option.name)?.value ?? null;
    return {
      name: option.name,
      selectedValue,
      values: option.optionValues.map((value) => {
        const target = optionNames.map((name) => ({
          name,
          value: name === option.name ? value.name : (current.find((entry) => entry.name === name)?.value ?? ""),
        }));
        const variant =
          candidates.find((candidate) =>
            target.every((wanted) =>
              candidate.selectedOptions.some((have) => have.name === wanted.name && have.value === wanted.value),
            ),
          ) ?? null;
        const query = buildProductSelectionSearchParams({
          selectedOptions: target,
          optionNames,
          base: new URLSearchParams(search),
        }).toString();
        return {
          name: value.name,
          selected: value.name === selectedValue,
          exists: variant !== null,
          available: variant !== null && variant.availableForSale,
          url: variant === null ? null : `${product.url}${query ? `?${query}` : ""}`,
          variantId: variant === null ? null : variant.id.slice(variant.id.lastIndexOf("/") + 1),
          swatch: value.swatch
            ? { color: value.swatch.color ?? null, image: value.swatch.image?.previewImage ?? null }
            : null,
        };
      }),
    };
  });
}
```

The component prints nothing when `product.options.every((option) => option.optionValues.length <= 1)`.

```tsx
<VariantPicker id="options" product={product} search={url.searchParams.toString()} />
```

```liquid
{% block 'variant-picker', id: 'options', product: product %}{% endblock %}
```

### Commerce

- Store fields read: none. The Hydrogen product-form store is NOT used (D-047).
- Hydrogen helpers used on the server (pure functions): `buildProductSelectionSearchParams` (in the binding); `getSelectedProductOptions` (in the app's loader).
- Adapter methods called (by `rp-live`): `refresh`, `usable`.
- Regions refreshed: `rp-product-buy`, `rp-product-media` (prop `refresh`). The blueprint MUST declare both: `rp-product-buy` around Price, VariantPicker and ProductForm; `rp-product-media` inside ProductGallery.
- Pending and error behaviour: `data-pending` and `aria-busy` on the root during the refresh; on failure the browser navigates to the URL.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Value link | `<product url>?<Option>=<Value>&...` (one param per option) | `value.variant.url` (`?variant=<id>`) |
| Dropdown | GET `<product url>?variant=<numeric id>`; `handleShopifyRoutes` redirects it to option params | GET `{{ product.url }}?variant=<id>` |
| Server reads selection | `getSelectedProductOptions({ searchParams })`, then `selectedOrFirstAvailableVariant(selectedOptions:)` | `product.selected_or_first_available_variant` |

### Agent surface

`accessibility-tree` (links and selects). Bridge: component `rp-live`, manifest `agent.actions`: `["submit"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2): `submit()` calls `requestSubmit()` on the first GET form inside the root; it throws `"rp-live: nothing to submit here"` in the `buttons` layout, which prints no form. Confirm: none. Secret: none.

### Checker rules

RP101 (`layout`), RP104 (`id`, `product`), RP114 (value ids), RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid: partials `rp-product-buy`, `rp-product-media` declared). Manifest `rules[]`: `variant-picker-outside-form` (kind `forbids-ancestor`, selector `.rp-variant-picker`, target `rp-product-form`; message "A VariantPicker is inside a ProductForm."; fix "Move the VariantPicker out of the ProductForm; it is a GET form or a set of links of its own."; test T08 of [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) depends on this id, D-061); `variant-picker-fallback-submit` (`requires-descendant`, selector `form.rp-variant-picker-option`, target `button[type="submit"][data-rp-js="fallback"]`).

### Acceptance tests

1. Tier 2: fixtures `default`, `dropdown`, `buttons`, `single-variant`, `class`, `invalid-enum-falls-back`, `escaping` are canonical-equal in all four hosts with the mask above.
2. Tier 5 (unit): `variantPickerOptions` on `product.options` returns, for `Size` / `L`: `exists: false`, `url: null`; for `Color` / `Sand`: `exists: true`, `available: false`, `url: "/products/linen-shirt?Color=Sand&Size=S"`, `variantId: "13"`.
3. Tier 5: test C-13 of [05-commerce.md](05-commerce.md) (a variant link replaces the URL without a new history entry and replaces `rp-product-buy`); after the refresh `document.activeElement.id` equals the id of the clicked link.
4. Tier 6: with scripting disabled, clicking `M` loads a page whose variant field has the id of Blue / M; in layout `dropdown`, choosing `M` and pressing `Apply` does the same.
5. Tier 3: zero mutations at upgrade.
6. Tier 5: a ctrl-click on a value link does not call `refresh`.

### Evidence and UNVERIFIED

- Evidence: `hydrogen/packages/hydrogen/skills/hydrogen-variant-form/SKILL.md` (values are GET links; `aria-current`; never hide values; non-existent values are not interactive; `?variant=` redirected by `handleShopifyRoutes`); `hydrogen/packages/hydrogen/src/core/product/url.ts` (`buildProductSelectionSearchParams`); `hydrogen/packages/hydrogen/src/core/product/state.ts` (`adjacentVariants`: variants that differ from the selected variant by one option value); `ripple/theme/blocks/variant-picker.liquid` (`value.variant`, `value.selected`, `value.swatch`); `ripple/docs/05-commerce.md` section 7.3.
- UNVERIFIED: that `adjacentVariants` always contains every existing one-option-away variant (if it is truncated for a product, a value is shown as "Unavailable" although it exists; the query SHOULD then also select `encodedVariantExistence`, which V1 does not decode); Liquid `value.variant.url` and `value.product_url` on the preview store (tier 8).

### Fallback (SPIKE-nn)

None.

---
