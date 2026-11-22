export interface ProductFormProps {
  /** The product being sold. */
  product: ProductInput
  /** Selected variant. Default: the selected or first available variant. */
  variant?: ProductVariant
  /** Print accelerated checkout buttons after the body. @default false */
  acceleratedCheckout?: boolean
  /** Id of the inner <form>. */
  id?: string
  className?: string
  children: ReactNode
}
