# Price

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `price` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `span` `.rp-price` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `visually-hidden` |
| Milestone | M3 |

### Purpose

Prints a price formatted by the server, with an optional struck-through compare-at price.

- Use when: showing the price of a product, a variant or a cart line.
- Do not use when: showing a cart total; CartSummary prints totals itself.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Price` | `blocks/price.liquid` + `snippets/rp-price.liquid` | `span` | `rp-price` | none | yes | none |
| prefix | printed by root | same | `span` | `rp-price-prefix` | none | no | none |
| current | printed by root | same | `span` | `rp-price-current` | none | yes | none |
| compare | printed by root | same | `s` | `rp-price-compare` | none | no | none |

Nesting rules: children of root in this order: prefix (when `from`), visually hidden "Sale price" label (when on sale), current, visually hidden "Regular price" label (when on sale), compare (when on sale). The formatted amount is the only child of a `<bdi>` inside current and inside compare. "On sale" means: `compareAtPrice` is set and its amount is greater than the amount of `price`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `price` | `price` | object | `RippleMoney` / Liquid number of cents | none | yes | no | text of the current part |
| `compareAtPrice` | `compare_at_price` | object | `RippleMoney` or `null` / Liquid number of cents or blank | none | no | no | compare part, `data-sale=""` on root |
| `size` | `size` | enum | `sm base lg xl 2xl` | `base` | no | no | `data-size` on root |
| `from` | `from` | boolean | `true false` | `false` | no | no | `data-from=""` on root, and the prefix part |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | money formatting (CV-1); TSX hosts only |

### Content model

`none` - no children. The Liquid block has an empty body.

### HTML contract

Fixture `default` (`price`: 48.00 USD):

```html
<span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
```

Fixture `sale` (`price`: 12.00 USD, `compareAtPrice`: 16.00 USD, `size`: `lg`):

```html
<span class="rp-price" data-size="lg" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
```

Fixture `from` (`price`: 48.00 USD, `from`: true):

```html
<span class="rp-price" data-size="base" data-from=""><span class="rp-price-prefix">From</span><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
```

Fixture `compare-not-higher` (`price`: 48.00 USD, `compareAtPrice`: 48.00 USD): HTML equals `default`.

Further required fixtures: `class`; `invalid-enum-falls-back` (`size`: `huge`; equals `default`).

Host-owned regions and masks: no host-owned region. Masks: `{ "select": ".rp-price-current", "op": "text" }`; `{ "select": ".rp-price-compare", "op": "text" }` (fixture `sale`). Resource references for money props are `{ "$resource": "money.usd-48" }`, `money.usd-12`, `money.usd-16` ([13-testing.md](13-testing.md): hydrogen `{ amount: "48.0", currencyCode: "USD" }`; Liquid `4800`).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-sale` | root | server | on sale | `""` or absent |
| `data-from` | root | server | `from` is true | `""` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. There is no money element (D-049). The text changes only when a region that contains the Price is refreshed, or when React re-renders it.

### Behaviour without JavaScript

Identical: the server-formatted text is shown.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: text; `checkPattern`: none.
- Accessible name: not applicable. A screen reader reads `Sale price $12.00 Regular price $16.00`; the `<s>` element alone MUST NOT be relied on to convey "old price".
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| None | |

### Styling

- File: `components/price/price.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-sale`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-price-gap` | `calc(var(--spacing) * 2)` | inline space between parts |
| `--rp-price-font-size` | `var(--text-base)` | font size of the current part |
| `--rp-price-sale-color` | `var(--color-sale)` | colour of the current part when on sale |
| `--rp-price-compare-color` | `var(--color-muted-foreground)` | colour of the compare part |

| Modifier selector | Sets |
|---|---|
| `.rp-price[data-size="sm"]` | `--rp-price-font-size: var(--text-sm)` |
| `.rp-price[data-size="base"]` | `--rp-price-font-size: var(--text-base)` |
| `.rp-price[data-size="lg"]` | `--rp-price-font-size: var(--text-lg)` |
| `.rp-price[data-size="xl"]` | `--rp-price-font-size: var(--text-xl)` |
| `.rp-price[data-size="2xl"]` | `--rp-price-font-size: var(--text-2xl)` |
| `.rp-price[data-sale]` | `--_fg: var(--rp-price-sale-color)` |

Required rules: root `display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: var(--rp-price-gap)`; the compare part is one step smaller than the current part and uses `text-decoration: line-through`; `font-variant-numeric: tabular-nums` on root.

### Host notes

- HTML: write the formatted text by hand.
- React: `Price(props: { price: RippleMoney; compareAtPrice?: RippleMoney | null; size?: "sm" | "base" | "lg" | "xl" | "2xl"; from?: boolean; locale?: string; strings?: { sale?: string; regular?: string; from?: string }; className?: string })`. Imports `formatMoney` from `@shopify/hydrogen` (a value import allowed by D-094, CV-9). Text: `formatMoney(price, { locale }).localizedString`. No hook.
- Remix: None.
- Liquid: markup in `snippets/rp-price.liquid`; `blocks/price.liquid` is the thin wrapper. Text: `{{ price | money }}`. On-sale test: `compare_at_price != blank and compare_at_price > price`. One schema setting: `size` (`select`). Locale keys: `ripple.price.sale` = `Sale price`; `ripple.price.regular` = `Regular price`; `ripple.price.from` = `From`.

```tsx
<Price price={variant.price} compareAtPrice={variant.compareAtPrice} size="lg" locale="en-US" />
```

```liquid
{% block 'price', price: variant.price, compare_at_price: variant.compare_at_price, size: 'lg' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP104 (`price`), RP110. No `rules[]` entry.

### Acceptance tests

1. Tier 2: fixtures `default`, `sale`, `from`, `compare-not-higher`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the masks above.
2. Tier 5 (unit, TSX hosts): `Price` with `{ amount: "48.0", currencyCode: "USD" }` and `locale: "en-US"` prints `$48.00`; with `locale: "de-DE"` and `EUR` prints `48,00 €`.
3. Tier 5 (Liquid shim): `price: 4800` prints the shim's `money` output inside `<bdi>`.
4. Tier 5: the accessibility tree text of fixture `sale` is `Sale price $12.00 Regular price $16.00`.

### Evidence and UNVERIFIED

- Evidence: `hydrogen/packages/hydrogen/src/core/money/format.ts` (`formatMoney(money, options)`); `ripple/theme/blocks/price.liquid`; `ripple/theme/AGENTS.md` (money filters, `<bdi>`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
