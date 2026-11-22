import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'

import { assets } from '../assets.ts'
import { dataMode, getCartFor, getProduct, getProducts, selectVariant } from '../data/storefront.ts'
import { routes } from '../routes.ts'
import { resolveTheme, withCookie } from '../ui/theme.ts'
import { ProductPage } from './products/product-page.tsx'
import { experimentPages } from './experiments/index.ts'

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },
    async home(context) {
      let [first] = await getProducts(context.request, 1)
      let url = new URL(context.request.url)
      return redirect(`/products/${first?.handle ?? 'everyday-hoodie'}${url.search}`, 302)
    },
    async product(context) {
      let { request, params } = context
      let product = await getProduct(request, params.handle)
      if (!product) return new Response('Product not found', { status: 404 })
      let [cart, related] = await Promise.all([getCartFor(request), getProducts(request, 5)])
      let url = new URL(request.url)
      // The variant form submits with GET; drop the add-to-cart fields so the URL stays ?Color=…&Size=…
      if (url.searchParams.has('merchandiseId') || url.searchParams.has('quantity')) {
        url.searchParams.delete('merchandiseId')
        url.searchParams.delete('quantity')
        url.searchParams.delete('intent')
        return redirect(url.pathname + url.search, 302)
      }
      let variant = selectVariant(product, url)
      let { theme, setCookie } = resolveTheme(request)
      let response = await context.render(
        <ProductPage
          product={product}
          variant={variant}
          related={related.filter((p) => p.handle !== product!.handle).slice(0, 4)}
          cart={cart}
          theme={theme}
          inspect={url.searchParams.has('inspect')}
          dataMode={dataMode}
        />,
      )
      return withCookie(response, setCookie)
    },
    async experiments(context) {
      let page = experimentPages[context.params.name]
      if (!page) return new Response('Not found', { status: 404 })
      return page(context)
    },
  },
})
