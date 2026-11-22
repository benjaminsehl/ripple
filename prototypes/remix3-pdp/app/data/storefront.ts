import {
  createCartServerHandlers,
  createShopifyRequestContext,
  createStorefrontClient,
  defineShopifyI18n,
  getCart,
  getCartId,
  gql,
  handleShopifyRoutes,
} from '@shopify/hydrogen'

import { fixtureProducts } from './fixtures.ts'
import { fixtureCartFetch, getFixtureCart } from './fixture-cart.ts'
import type { Cart, Product } from './types.ts'

// Data comes from mock.shop through Hydrogen core. When mock.shop can't be reached
// (some sandboxes block it), the same shapes come from fixtures.ts and an in-memory cart
// that speaks Hydrogen's /api/cart form contract. Force a mode with RIPPLE_DATA=live|fixture.

export const STORE_DOMAIN = process.env.PUBLIC_STORE_DOMAIN ?? 'mock.shop'
export const i18n = defineShopifyI18n({ defaultLocale: { language: 'EN', country: 'US' } })
const cartHandlers = createCartServerHandlers()

export const dataMode: 'live' | 'fixture' = await resolveMode()

async function resolveMode() {
  let forced = process.env.RIPPLE_DATA
  if (forced === 'live' || forced === 'fixture') return forced
  try {
    let res = await fetch(`https://${STORE_DOMAIN}/api`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ shop { name } }' }),
      signal: AbortSignal.timeout(2500),
    })
    if (res.ok) return 'live'
  } catch {}
  console.warn(`[ripple] ${STORE_DOMAIN} unreachable: using fixture data`)
  return 'fixture'
}

function clientFor(request: Request) {
  let requestContext = createShopifyRequestContext({ request, i18n })
  let storefrontClient = createStorefrontClient({
    type: 'public',
    requestContext,
    config: { storeDomain: STORE_DOMAIN, publicStorefrontToken: process.env.PUBLIC_STOREFRONT_API_TOKEN },
  })
  return { requestContext, storefrontClient }
}

/** Remix middleware: lets Hydrogen own /api/cart (and its other routes) before the app router. */
export function shopifyRoutes() {
  return async (context: { request: Request }, next: () => Promise<Response>) => {
    let { request } = context
    if (dataMode === 'fixture') {
      let res = await fixtureCartFetch(request)
      return res ?? next()
    }
    let { requestContext, storefrontClient } = clientFor(request)
    let shopifyRoute = handleShopifyRoutes({ request, requestContext, storefrontClient, handlers: [cartHandlers] })
    if (shopifyRoute) return shopifyRoute
    let response = await next()
    return response
  }
}

const PRODUCT_FIELDS = `
  id handle title vendor productType descriptionHtml
  options { name optionValues { name swatch { color } } }
  featuredImage { url altText width height }
  images(first: 12) { nodes { url altText width height } }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  variants(first: 100) { nodes {
    id title availableForSale
    price { amount currencyCode } compareAtPrice { amount currencyCode }
    selectedOptions { name value }
    image { url altText width height }
  } }
`
const PRODUCT_QUERY = gql(`query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`)
const PRODUCTS_QUERY = gql(`query Products($first: Int!) { products(first: $first) { nodes { ${PRODUCT_FIELDS} } } }`)

export async function getProduct(request: Request, handle: string): Promise<Product | null> {
  if (dataMode === 'fixture') return fixtureProducts.find((p) => p.handle === handle) ?? null
  let { storefrontClient } = clientFor(request)
  let result: any = await storefrontClient.graphql(PRODUCT_QUERY as any, { variables: { handle } })
  return (result.data?.product as Product) ?? null
}

export async function getProducts(request: Request, first = 8): Promise<Product[]> {
  if (dataMode === 'fixture') return fixtureProducts.slice(0, first)
  let { storefrontClient } = clientFor(request)
  let result: any = await storefrontClient.graphql(PRODUCTS_QUERY as any, { variables: { first } })
  return (result.data?.products?.nodes as Product[]) ?? []
}

export async function getCartFor(request: Request): Promise<Cart | null> {
  if (dataMode === 'fixture') return getFixtureCart(request)
  let { storefrontClient } = clientFor(request)
  let result = await getCart(getCartId(request), storefrontClient)
  return (result.cart as unknown as Cart) ?? null
}

/** The variant named by ?Color=…&Size=… or the first available one. */
export function selectVariant(product: Product, url: URL) {
  let nodes = product.variants.nodes
  return (
    nodes.find((v) => v.selectedOptions.every((o) => url.searchParams.get(o.name) === o.value)) ??
    nodes.find((v) => v.availableForSale) ??
    nodes[0] ??
    null
  )
}
