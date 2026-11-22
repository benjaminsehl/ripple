// Ripple's light-DOM custom elements (behaviors live in public/ripple/ripple.js).
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'rp-gallery': Record<string, any>
      'rp-product-form': Record<string, any>
      'rp-quantity': Record<string, any>
      'rp-cart-drawer': Record<string, any>
    }
  }
}
export {}
