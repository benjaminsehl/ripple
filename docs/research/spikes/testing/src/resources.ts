// Resource fixtures: the only commerce data a fixture may reference ({ "$resource": "<type>.<name>" }).
// `hydrogen` is the value TSX hosts and the html reference receive (shapes: docs/05-commerce.md 11.1).
// `liquid` is the drop-like object bound in the Liquid render scope.
export interface ResourceFixture {
  hydrogen: unknown
  liquid: unknown
}

const IMAGE_URL = "https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg"
const LIQUID_IMAGE_SRC = "//cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?v=1700000000"
const usd = (amount: string) => ({ amount, currencyCode: "USD" })

const image = {
  hydrogen: { url: IMAGE_URL, altText: "Linen shirt on a hanger", width: 1600, height: 2000 },
  liquid: { src: LIQUID_IMAGE_SRC, alt: "Linen shirt on a hanger", width: 1600, height: 2000 },
}
const imageNoAlt = {
  hydrogen: { url: IMAGE_URL, altText: null, width: 1600, height: 2000 },
  liquid: { src: LIQUID_IMAGE_SRC, alt: null, width: 1600, height: 2000 },
}

function variant(numericId: number, title: string, available: boolean, price: string, compareAt: string | null) {
  return {
    hydrogen: {
      id: `gid://shopify/ProductVariant/${numericId}`,
      title,
      availableForSale: available,
      price: usd(price),
      compareAtPrice: compareAt === null ? null : usd(compareAt),
      image: image.hydrogen,
    },
    liquid: {
      id: numericId,
      title,
      available,
      price: Math.round(Number(price) * 100),
      compare_at_price: compareAt === null ? null : Math.round(Number(compareAt) * 100),
      image: image.liquid,
    },
  }
}
const variantBasic = variant(43696932421654, "Medium", true, "48.00", null)
const variantOnSale = variant(43696932421655, "Large", true, "48.00", "60.00")
const variantSoldOut = variant(43696932421656, "Small", false, "48.00", null)

function product(numericId: number, title: string, handle: string, first: ReturnType<typeof variant>, variants: Array<ReturnType<typeof variant>>) {
  const available = variants.some((v) => v.hydrogen.availableForSale)
  return {
    hydrogen: {
      id: `gid://shopify/Product/${numericId}`,
      title,
      handle,
      url: `/products/${handle}`,
      vendor: "Ripple Supply",
      availableForSale: available,
      featuredImage: image.hydrogen,
      price: first.hydrogen.price,
      compareAtPrice: first.hydrogen.compareAtPrice,
    },
    liquid: {
      id: numericId,
      title,
      handle,
      url: `/products/${handle}`,
      vendor: "Ripple Supply",
      available,
      featured_image: image.liquid,
      price: first.liquid.price,
      compare_at_price: first.liquid.compare_at_price,
      selected_or_first_available_variant: first.liquid,
      variants: variants.map((v) => v.liquid),
      media: [1, 2, 3].map((n) => ({ id: numericId * 10 + n, media_type: "image", ...image.liquid })),
    },
  }
}
const productBasic = product(7, "Linen Shirt", "linen-shirt", variantBasic, [variantBasic, variantOnSale, variantSoldOut])
const productOnSale = product(8, "Wool Sweater", "wool-sweater", variantOnSale, [variantOnSale])
const productSoldOut = product(9, "Canvas Tote", "canvas-tote", variantSoldOut, [variantSoldOut])

function line(n: number, v: ReturnType<typeof variant>, p: ReturnType<typeof product>, quantity: number) {
  const key = `${v.liquid.id}:rpline${n}`
  const compare = v.liquid.compare_at_price
  return {
    hydrogen: {
      id: `gid://shopify/CartLine/${n}?cart=c1`,
      quantity,
      title: p.hydrogen.title,
      variantTitle: v.hydrogen.title,
      url: `${p.hydrogen.url}?variant=${v.liquid.id}`,
      image: image.hydrogen,
      totalPrice: usd(((v.liquid.price * quantity) / 100).toFixed(2)),
      compareAtTotalPrice: compare === null ? null : usd(((compare * quantity) / 100).toFixed(2)),
      attributes: [],
    },
    liquid: {
      key,
      quantity,
      product: p.liquid,
      variant: v.liquid,
      url: `${p.liquid.url}?variant=${v.liquid.id}`,
      image: image.liquid,
      final_line_price: v.liquid.price * quantity,
      original_line_price: (compare ?? v.liquid.price) * quantity,
      properties: {},
      url_to_remove: `/cart/change?id=${key}&quantity=0`,
    },
  }
}
const lineBasic = line(1, variantBasic, productBasic, 2)
const lineOnSale = line(2, variantOnSale, productOnSale, 1)

function cart(lines: Array<ReturnType<typeof line>>) {
  const cents = lines.reduce((sum, l) => sum + l.liquid.final_line_price, 0)
  const count = lines.reduce((sum, l) => sum + l.liquid.quantity, 0)
  return {
    hydrogen: {
      id: lines.length ? "gid://shopify/Cart/c1" : null,
      totalQuantity: count,
      checkoutUrl: "https://mock.shop/checkout/c1",
      note: "",
      subtotal: usd((cents / 100).toFixed(2)),
      total: usd((cents / 100).toFixed(2)),
      discountCodes: [],
      lines: lines.map((l) => l.hydrogen),
    },
    liquid: { item_count: count, note: null, items: lines.map((l) => l.liquid), items_subtotal_price: cents, total_price: cents },
  }
}

export const RESOURCES: Record<string, ResourceFixture> = {
  "image.basic": image,
  "image.no-alt": imageNoAlt,
  "money.basic": { hydrogen: usd("48.00"), liquid: 4800 },
  "money.compare": { hydrogen: usd("60.00"), liquid: 6000 },
  "variant.basic": variantBasic,
  "variant.on-sale": variantOnSale,
  "variant.sold-out": variantSoldOut,
  "product.basic": productBasic,
  "product.on-sale": productOnSale,
  "product.sold-out": productSoldOut,
  "collection.basic": {
    hydrogen: { id: "gid://shopify/Collection/3", title: "Shirts", handle: "shirts", url: "/collections/shirts", image: image.hydrogen },
    liquid: {
      id: 3,
      title: "Shirts",
      handle: "shirts",
      url: "/collections/shirts",
      image: image.liquid,
      products: [productBasic.liquid, productOnSale.liquid, productSoldOut.liquid],
      products_count: 3,
    },
  },
  "article.basic": {
    hydrogen: {
      id: "gid://shopify/Article/5",
      title: "How linen is made",
      url: "/blogs/journal/how-linen-is-made",
      excerpt: "From flax to fabric in six steps.",
      publishedAt: "2026-03-01T09:00:00Z",
      image: image.hydrogen,
    },
    liquid: {
      id: 5,
      title: "How linen is made",
      url: "/blogs/journal/how-linen-is-made",
      excerpt: "From flax to fabric in six steps.",
      published_at: "2026-03-01T09:00:00Z",
      image: image.liquid,
    },
  },
  "line.basic": lineBasic,
  "line.on-sale": lineOnSale,
  "cart.empty": cart([]),
  "cart.two-lines": cart([lineBasic, lineOnSale]),
  "media.three-images": {
    hydrogen: [1, 2, 3].map((n) => ({ id: `gid://shopify/MediaImage/${70 + n}`, image: image.hydrogen })),
    liquid: productBasic.liquid.media,
  },
}

export function resolveResource(reference: string, side: "hydrogen" | "liquid"): unknown {
  const entry = RESOURCES[reference]
  if (!entry) throw new Error(`unknown resource fixture "${reference}"; known: ${Object.keys(RESOURCES).join(", ")}`)
  return structuredClone(entry[side])
}
