import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  product: get('/products/:handle'),
  cart: {
    index: get('/cart'),
    drawer: get('/cart/drawer'),
  },
  experiments: get('/experiments/:name'),
})
