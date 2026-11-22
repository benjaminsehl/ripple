// Storefront API shapes, trimmed to what Ripple's commerce components read.
// Components take these objects straight from a query, so an agent never reshapes data.

export interface Money {
  amount: string
  currencyCode: string
}

export interface Image {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export interface SelectedOption {
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
  selectedOptions: SelectedOption[]
  image: Image | null
}

export interface ProductOption {
  name: string
  optionValues: { name: string; swatch: { color: string | null } | null }[]
}

export interface Product {
  id: string
  handle: string
  title: string
  vendor: string
  productType: string
  descriptionHtml: string
  options: ProductOption[]
  variants: { nodes: ProductVariant[] }
  images: { nodes: Image[] }
  featuredImage: Image | null
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money }
  compareAtPriceRange?: { minVariantPrice: Money }
}

export interface CartLine {
  id: string
  quantity: number
  cost: { totalAmount: Money; amountPerQuantity: Money; compareAtAmountPerQuantity: Money | null }
  merchandise: {
    id: string
    title: string
    image: Image | null
    selectedOptions: SelectedOption[]
    product: { id: string; title: string; handle: string; vendor: string }
  }
}

export interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: Money; totalAmount: Money }
  lines: { nodes: CartLine[] }
}
