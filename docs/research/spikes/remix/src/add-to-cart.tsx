import type { Handle, RemixNode } from 'remix/component'
import { cx } from './props.ts'

export interface AddToCartProps {
  /** Storefront API ProductVariant GID. */
  variantId: string
  quantity?: number
  available?: boolean
  /** Cart endpoint served by Hydrogen's createCartServerHandlers(). */
  action?: string
  sellingPlanId?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  class?: string
  /** Button label. */
  children?: RemixNode
  /** Label when available === false. */
  soldOutLabel?: string
  /** spike only */
  documentNav?: boolean
}

// Field names are Hydrogen's cart form contract (hydrogen/packages/hydrogen/src/core/cart/form.ts):
// merchandiseId, quantity, sellingPlanId, and a submit button name="intent" value="add".
export function AddToCart(handle: Handle<AddToCartProps>) {
  return () => {
    let { variantId, quantity = 1, available = true, action = '/api/cart', sellingPlanId, variant = 'primary', size = 'md', children = 'Add to cart', soldOutLabel = 'Sold out', documentNav = true } = handle.props
    return (
      <rp-cart-form class={cx('rp-add-to-cart', handle.props.class)}>
        <form method="post" action={action} data-rmx-document={documentNav ? true : undefined}>
          <input type="hidden" name="merchandiseId" value={variantId} />
          <input type="hidden" name="quantity" value={String(quantity)} />
          {sellingPlanId !== undefined && <input type="hidden" name="sellingPlanId" value={sellingPlanId} />}
          <button class="rp-button" data-variant={variant} data-size={size} type="submit" name="intent" value="add" disabled={!available}>
            {available ? children : soldOutLabel}
          </button>
          <span class="rp-form-message" role="status" data-rp-cart-status=""></span>
        </form>
      </rp-cart-form>
    )
  }
}
