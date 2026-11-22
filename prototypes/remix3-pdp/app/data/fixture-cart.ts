import { parseCartRequest } from '@shopify/hydrogen'

import { fixtureProducts } from './fixtures.ts'
import type { Cart, CartLine } from './types.ts'

// An in-memory stand-in for Shopify's cart, behind the same POST /api/cart form contract
// that Hydrogen's createCartServerHandlers() serves. Parsing reuses Hydrogen's parseCartRequest.

const COOKIE = 'rp_fixture_cart'
const carts = new Map<string, Cart>()

function cartId(request: Request) {
  let match = request.headers.get('cookie')?.match(new RegExp(`${COOKIE}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getFixtureCart(request: Request): Cart | null {
  let id = cartId(request)
  return (id && carts.get(id)) || null
}

function findVariant(id: string) {
  for (let product of fixtureProducts) {
    let variant = product.variants.nodes.find((v) => v.id === id)
    if (variant) return { product, variant }
  }
  return null
}

function money(n: number) {
  return { amount: n.toFixed(2), currencyCode: 'USD' }
}

function recompute(cart: Cart) {
  let lines = cart.lines.nodes
  for (let line of lines) {
    let unit = Number(line.cost.amountPerQuantity.amount)
    line.cost.totalAmount = money(unit * line.quantity)
  }
  let subtotal = lines.reduce((sum, l) => sum + Number(l.cost.totalAmount.amount), 0)
  cart.totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)
  cart.cost = { subtotalAmount: money(subtotal), totalAmount: money(subtotal) }
}

export async function fixtureCartFetch(request: Request): Promise<Response | null> {
  let url = new URL(request.url)
  if (url.pathname !== '/api/cart') return null
  if (request.method === 'GET') return Response.json({ cart: getFixtureCart(request) })
  if (request.method !== 'POST') return null

  let isForm = !request.headers.get('content-type')?.includes('application/json')
  let headers = new Headers()
  let id = cartId(request)
  let cart = id ? carts.get(id) : undefined
  if (!cart) {
    id = crypto.randomUUID()
    cart = {
      id: `gid://shopify/Cart/${id}`,
      checkoutUrl: '#checkout-unavailable-in-fixture-mode',
      totalQuantity: 0,
      cost: { subtotalAmount: money(0), totalAmount: money(0) },
      lines: { nodes: [] },
    }
    carts.set(id, cart)
    headers.append('set-cookie', `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`)
  }

  let { action } = (await parseCartRequest(request)) as any
  if (action.intent === 'add') {
    for (let input of action.lines) {
      let found = findVariant(input.merchandiseId)
      if (!found) continue
      let existing = cart.lines.nodes.find((l) => l.merchandise.id === input.merchandiseId)
      if (existing) existing.quantity += input.quantity ?? 1
      else {
        let line: CartLine = {
          id: `gid://shopify/CartLine/${crypto.randomUUID()}`,
          quantity: input.quantity ?? 1,
          cost: {
            totalAmount: found.variant.price,
            amountPerQuantity: found.variant.price,
            compareAtAmountPerQuantity: found.variant.compareAtPrice,
          },
          merchandise: {
            id: found.variant.id,
            title: found.variant.title,
            image: found.variant.image,
            selectedOptions: found.variant.selectedOptions,
            product: { id: found.product.id, title: found.product.title, handle: found.product.handle, vendor: found.product.vendor },
          },
        }
        cart.lines.nodes.push(line)
      }
    }
  } else if (action.intent === 'update') {
    for (let input of action.lines) {
      let line = cart.lines.nodes.find((l) => l.id === input.id)
      if (line) line.quantity = input.quantity
    }
    cart.lines.nodes = cart.lines.nodes.filter((l) => l.quantity > 0)
  } else if (action.intent === 'remove') {
    let ids = new Set<string>(action.lineIds)
    cart.lines.nodes = cart.lines.nodes.filter((l) => !ids.has(l.id))
  }
  recompute(cart)

  if (!isForm) return Response.json({ cart }, { headers })
  let referer = request.headers.get('referer')
  let location = referer && new URL(referer).origin === url.origin ? new URL(referer).pathname + new URL(referer).search : '/'
  headers.set('location', location)
  return new Response(null, { status: 303, headers })
}
