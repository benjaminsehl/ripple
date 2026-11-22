import { createController } from 'remix/router'

import { dataMode, getCartFor } from '../../data/storefront.ts'
import { CartPanel } from '../../ripple/index.ts'
import { routes } from '../../routes.ts'
import { FREE_SHIPPING } from '../../ui/layout.tsx'
import { resolveTheme, withCookie } from '../../ui/theme.ts'
import { CartPage } from './cart-page.tsx'

export default createController(routes.cart, {
  actions: {
    async index(context) {
      let cart = await getCartFor(context.request)
      let { theme, setCookie } = resolveTheme(context.request)
      let inspect = new URL(context.request.url).searchParams.has('inspect')
      return withCookie(await context.render(<CartPage cart={cart} theme={theme} inspect={inspect} dataMode={dataMode} />), setCookie)
    },
    // HTML fragment the cart drawer swaps in after a change.
    async drawer(context) {
      let cart = await getCartFor(context.request)
      return context.render(<CartPanel cart={cart} freeShippingThreshold={FREE_SHIPPING} />)
    },
  },
})
