import type { Handle } from 'remix/component'

import { dataMode, getCartFor, getProduct, getProducts, selectVariant } from '../../data/storefront.ts'
import type { Cart, Product, ProductVariant } from '../../data/types.ts'
import type { ThemeName } from '../../ripple/theme.tsx'
import { PageShell } from '../../ui/layout.tsx'
import { resolveTheme, withCookie } from '../../ui/theme.ts'

// Data loading is done for you. Build the page in DropPage below.
export async function handler(context: any) {
  let request: Request = context.request
  let url = new URL(request.url)
  let product = (await getProduct(request, 'loop-crewneck'))!
  let variant = selectVariant(product, url)
  let [cart, all] = await Promise.all([getCartFor(request), getProducts(request, 5)])
  let related = all.filter((p) => p.handle !== product.handle).slice(0, 3)
  let { theme, setCookie } = resolveTheme(request)
  let page = <DropPage product={product} variant={variant} related={related} cart={cart} theme={theme} inspect={url.searchParams.has('inspect')} dataMode={dataMode} />
  return withCookie(await context.render(page), setCookie)
}

interface Props {
  product: Product
  variant: ProductVariant | null
  related: Product[]
  cart: Cart | null
  theme: ThemeName
  inspect: boolean
  dataMode: string
}

function DropPage(handle: Handle<Props>) {
  return () => {
    let { product, cart, theme, inspect, dataMode } = handle.props
    return (
      <PageShell title={product.title} theme={theme} cart={cart} inspect={inspect} dataMode={dataMode}>
        TODO
      </PageShell>
    )
  }
}
