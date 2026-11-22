import { createRouter, type RouterContext } from 'remix/router'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'

import controller from './actions/controller.tsx'
import cartController from './actions/cart/controller.tsx'
import { assets } from './assets.ts'
import { shopifyRoutes } from './data/storefront.ts'
import { routes } from './routes.ts'

export const router = createRouter({
  // shopifyRoutes() lets Hydrogen serve POST /api/cart (the cart form endpoint) before routing.
  middleware: [staticFiles('./public', { index: false }), shopifyRoutes() as any, render({ assets })],
})

export type AppContext = RouterContext<typeof router>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

router.map(routes, controller)
router.map(routes.cart, cartController)
