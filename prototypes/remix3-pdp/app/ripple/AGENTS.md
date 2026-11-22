# Ripple: read this before writing storefront UI

Ripple is the UI kit for this store. Import everything from `app/ripple/index.ts`.
Pages built from Ripple are on-theme in every token set, work with JavaScript off,
and talk to the cart correctly. Hand-rolled HTML gets none of that for free.

**The rule:** before you type a raw tag, find it in the table below. If a row matches, use the component.
Only when no row matches do you reach for the escape hatch (bottom of this file).

## 1. "I'm about to write…" → use this

| If you're about to write…                                      | Use                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| a max-width wrapper `<div class="mx-auto max-w-7xl px-…">`      | `<Container size?>`                                    |
| a full-width band with vertical padding / background            | `<Section tone? py?>`                                  |
| `flex flex-col gap-…`                                           | `<Stack gap>`                                          |
| `flex items-center gap-… flex-wrap` / `justify-between`         | `<Inline gap align justify>`                           |
| `grid grid-cols-2 lg:grid-cols-4`                               | `<Grid columns={{ base: 2, lg: 4 }} gap>`              |
| a two-column image/text or main/sidebar layout                  | `<Split ratio="7:5">` (stacks on mobile)               |
| a card/panel with padding, border, rounded corners              | `<Box pad tone border radius>`                         |
| `<h1>`…`<h6>`                                                   | `<Heading level size>`                                 |
| `<p>`, small print, labels, uppercase kicker text               | `<Text size tone weight variant="eyebrow">`            |
| `dangerouslySetInnerHTML` / descriptionHtml                     | `<Text variant="prose" html={product.descriptionHtml}>`|
| `<a class="underline">` inline link                             | `<Link href>`                                          |
| `<button>` or a button-looking `<a>`                            | `<Button variant size block href? icon?>`              |
| a pill/tag/"Sale"/"New" label                                   | `<Badge tone>`                                         |
| an `<svg>` icon                                                 | `<Icon name>` (bag search user menu close plus minus check truck return leaf arrow star) |
| `<details><summary>` / accordion / FAQ                          | `<Disclosure summary open?>`                           |
| "In stock" / "Only 3 left" line                                 | `<Status tone>`                                        |
| breadcrumb trail                                                | `<Breadcrumbs items>`                                  |
| `<hr>`                                                          | `<Divider>`                                            |
| a price, `$${amount}`, `toFixed(2)`, `Intl.NumberFormat`        | `<Price money compareAt? size?>` (never format money yourself) |
| a product `<img>`                                               | `<Media image ratio?>`                                 |
| an image carousel / gallery / thumbnails                        | `<ProductGallery product variant layout="carousel" \| "grid">` |
| color swatches, size buttons, `<input type="radio">` for options| `<VariantPicker>` inside `<ProductForm>`               |
| quantity +/- input                                              | `<QuantityInput>`                                      |
| "Add to cart" button / `<form action="/api/cart">`              | `<ProductForm product variant>` (renders picker + qty + button) |
| a product tile in a grid                                        | `<ProductCard product badge?>`                         |
| cart line items, subtotal, checkout button                      | `<CartLines cart>`, `<CartSummary cart freeShippingThreshold?>`, `<CartEmpty>` |
| a cart drawer / mini cart / cart icon with count               | Already in the page shell (`CartDrawer`, `CartLink`). Don't add another. |

Custom layouts of the product form: pass children and arrange the three parts yourself.

```tsx
<ProductForm product={product} variant={variant}>
  <VariantPicker />
  <Inline gap={3} nowrap>
    <QuantityInput />
    <AddToCartButton class="flex-1">Add to bag</AddToCartButton>
  </Inline>
</ProductForm>
```

## 2. Props use scales, not values

- **Space** (`gap`, `pad`, `py`): `0 1 2 3 4 5 6 8 10 12 16 20 24` (×4px × theme density).
- **Text size** (`size` on Heading/Text/Price): `xs sm md lg xl 2xl 3xl 4xl 5xl`.
- **Responsive**: any space/columns prop takes `{ base, sm, md, lg }`: `gap={{ base: 4, lg: 8 }}`.
- **Tone**: Text `default | muted | highlight`; Section `default | subtle | inverse | accent`; Badge `default | highlight | accent | outline`.
- **Button** `variant`: `primary` (one per view) `| secondary | ghost | link`; `size`: `sm | md | lg`.
- Data props take Storefront API objects directly: `product`, `variant`, `cart`, `money` (MoneyV2). Don't reshape them.

## 3. Page skeleton

```tsx
<PageShell title={product.title} theme={theme} cart={cart}>   {/* app/ui/layout.tsx: header, footer, drawer */}
  <Container>
    <Section py={{ base: 6, lg: 10 }}>
      <Split ratio="7:5">
        <ProductGallery product={product} variant={variant} />
        <Stack gap={8}>
          <Stack gap={3}>
            <Text variant="eyebrow">{product.vendor}</Text>
            <Heading level={1} size="4xl">{product.title}</Heading>
            <Price money={variant.price} compareAt={variant.compareAtPrice} size="xl" />
          </Stack>
          <ProductForm product={product} variant={variant} />
        </Stack>
      </Split>
    </Section>
  </Container>
</PageShell>
```

Selected variant comes from the URL (`?Color=Sage&Size=M`). See `app/actions/controller.tsx` → `product` for how to resolve it.

## 4. Escape hatch (allowed, but visible)

Use it when no row in §1 fits. Two forms, both fine:

1. **Utility classes on a Ripple component** for position and one-off layout:
   `<Badge class="absolute left-4 top-4">`, `<Stack class="lg:sticky lg:top-24">`. Every component accepts `class` and Tailwind utilities win over Ripple styles.
2. **Custom HTML + Tailwind** for things Ripple doesn't have (a rating row, a spec table, an editorial hero).

Rules for both:
- **Only token utilities for color, font and radius**: `bg-accent text-accent-fg bg-subtle bg-surface text-muted text-highlight border-border font-display rounded-rp rounded-rp-lg`. No hex colors, no `bg-zinc-900`, no `font-serif`, no `rounded-xl`. Spacing utilities (`p-4`, `gap-6`) are already on Ripple's scale.
- **Mark it**: add `data-escape="short reason"` to the outermost custom element. `?inspect=1` outlines every marked element so reviewers see what's off-system.
- Never re-implement something in §1 (a price, a button, the cart form) as custom HTML. If it almost fits, use the component and add a `class`.

## 5. Check your work

`node scripts/ripple-check.mjs <files>` flags raw tags that have a Ripple equivalent and unmarked escape hatches. Fix what it reports.
