import type { Image, Product, ProductVariant } from './types.ts'

// Used only when mock.shop is unreachable (see storefront.ts). Same shapes as the live API.

const COLORS = [
  { name: 'Ochre', key: 'ochre', hex: '#C8913A' },
  { name: 'Sage', key: 'sage', hex: '#8FA58A' },
  { name: 'Ink', key: 'ink', hex: '#2B3140' },
  { name: 'Bone', key: 'bone', hex: '#E4DCCD' },
  { name: 'Clay', key: 'clay', hex: '#B5654A' },
]
const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const SOLD_OUT = new Set(['Ink/XS', 'Clay/XL', 'Sage/S'])

const img = (file: string, altText: string): Image => ({
  url: `/fixtures/${file}.svg`,
  altText,
  width: 800,
  height: 1000,
})
const usd = (amount: string) => ({ amount, currencyCode: 'USD' })

function apparel(opts: {
  handle: string
  title: string
  productType: string
  file: string
  price: string
  compareAt?: string
  sizes?: string[]
  colors?: typeof COLORS
  shots?: string[]
  descriptionHtml: string
  featured?: string
}): Product {
  let colors = opts.colors ?? COLORS
  let sizes = opts.sizes ?? SIZES
  let images: Image[] = []
  for (let c of colors) {
    for (let shot of opts.shots ?? ['']) {
      images.push(img(`${opts.file}-${c.key}${shot ? `-${shot}` : ''}`, `${opts.title} in ${c.name}${shot ? `, ${shot}` : ''}`))
    }
  }
  let variants: ProductVariant[] = []
  let n = 0
  for (let c of colors) {
    for (let s of sizes) {
      n++
      variants.push({
        id: `gid://shopify/ProductVariant/${opts.handle}-${n}`,
        title: sizes.length > 1 ? `${c.name} / ${s}` : c.name,
        availableForSale: !SOLD_OUT.has(`${c.name}/${s}`),
        price: usd(opts.price),
        compareAtPrice: opts.compareAt ? usd(opts.compareAt) : null,
        selectedOptions: sizes.length > 1 ? [{ name: 'Color', value: c.name }, { name: 'Size', value: s }] : [{ name: 'Color', value: c.name }],
        image: images.find((i) => i.altText?.includes(`in ${c.name}`)) ?? null,
      })
    }
  }
  let options: Product['options'] = [{ name: 'Color', optionValues: colors.map((c) => ({ name: c.name, swatch: { color: c.hex } as { color: string | null } | null })) }]
  if (sizes.length > 1) options.push({ name: 'Size', optionValues: sizes.map((s) => ({ name: s, swatch: null })) })
  return {
    id: `gid://shopify/Product/${opts.handle}`,
    handle: opts.handle,
    title: opts.title,
    vendor: 'Ripple Supply',
    productType: opts.productType,
    descriptionHtml: opts.descriptionHtml,
    options,
    variants: { nodes: variants },
    images: { nodes: images },
    featuredImage: images.find((i) => opts.featured && i.url.includes(opts.featured)) ?? images[0] ?? null,
    priceRange: { minVariantPrice: usd(opts.price), maxVariantPrice: usd(opts.price) },
    compareAtPriceRange: opts.compareAt ? { minVariantPrice: usd(opts.compareAt) } : undefined,
  }
}

export const fixtureProducts: Product[] = [
  apparel({
    handle: 'everyday-hoodie',
    title: 'Everyday Hoodie',
    productType: 'Hoodies',
    file: 'hoodie',
    price: '88.00',
    compareAt: '110.00',
    shots: ['front', 'back', 'detail', 'styled'],
    descriptionHtml:
      '<p>A heavyweight 420gsm loopback cotton hoodie, garment-dyed for a broken-in feel from day one. Double-layer hood, flat drawcords, and a kangaroo pocket sized for real hands.</p>',
  }),
  apparel({
    handle: 'loop-crewneck',
    title: 'Loop Crewneck',
    productType: 'Sweatshirts',
    file: 'crew',
    featured: 'sage',
    price: '74.00',
    descriptionHtml: '<p>The hoodie’s quieter sibling. Same loopback cotton, ribbed collar, dropped shoulder.</p>',
  }),
  apparel({
    handle: 'standard-tee',
    title: 'Standard Tee',
    productType: 'T-Shirts',
    file: 'tee',
    featured: 'bone',
    price: '32.00',
    descriptionHtml: '<p>Midweight jersey tee with a clean, boxy cut.</p>',
  }),
  apparel({
    handle: 'rib-beanie',
    title: 'Rib Beanie',
    productType: 'Accessories',
    file: 'beanie',
    featured: 'clay',
    price: '28.00',
    sizes: ['One size'],
    descriptionHtml: '<p>Merino-blend rib knit with a deep cuff.</p>',
  }),
  apparel({
    handle: 'market-tote',
    title: 'Market Tote',
    productType: 'Accessories',
    file: 'tote',
    featured: 'ink',
    price: '24.00',
    sizes: ['One size'],
    descriptionHtml: '<p>14oz canvas tote with an inside pocket.</p>',
  }),
]
