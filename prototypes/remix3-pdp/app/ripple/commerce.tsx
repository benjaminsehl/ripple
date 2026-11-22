import { formatMoney } from '@shopify/hydrogen'
import type { Handle, RemixNode } from 'remix/component'

import type { Cart, CartLine, Image as ShopImage, Money, Product, ProductVariant } from '../data/types.ts'
import { Button } from './controls.tsx'
import { Icon } from './icons.tsx'
import { cx, style, text, type Passthrough, type TextSize } from './props.ts'

// Commerce components take Storefront API objects as-is (product, variant, cart).
// Every form posts to Hydrogen's /api/cart contract, so they work with JavaScript off.

export const CART_ACTION = '/api/cart'
export const productHref = (handle: string) => `/products/${handle}`

function money(m: Money) {
  return formatMoney(m as any, { locale: 'en-US' }).toString()
}

/** Formatted price. Shows compareAt struck through and paints the price as a sale when compareAt > money. */
export function Price(handle: Handle<Passthrough & { money: Money; compareAt?: Money | null; size?: TextSize }>) {
  return () => {
    let { money: m, compareAt, size, class: className, style: s, ...rest } = handle.props
    let sale = !!compareAt && Number(compareAt.amount) > Number(m.amount)
    return (
      <span {...rest} class={cx('rp-price', className)} data-sale={sale ? '' : undefined} style={style(size ? { '--size': text(size) } : undefined, s)}>
        {sale ? <span class="rp-visually-hidden">Sale price</span> : null}
        <span class="rp-price-current">{money(m)}</span>
        {sale ? (
          <>
            <span class="rp-visually-hidden">Regular price</span>
            <s class="rp-price-compare">{money(compareAt!)}</s>
          </>
        ) : null}
      </span>
    )
  }
}

/** Product image. ratio defaults to 4/5; images are object-fit: cover. */
export function Media(handle: Handle<Passthrough & { image: ShopImage | null; ratio?: string; sizes?: string; loading?: 'lazy' | 'eager' }>) {
  return () => {
    let { image, ratio, sizes, loading = 'lazy', class: className, style: s, ...rest } = handle.props
    return (
      <div {...rest} class={cx('rp-media', className)} style={style(ratio ? { '--ratio': ratio, aspectRatio: ratio } : undefined, s)}>
        {image ? <img src={image.url} alt={image.altText ?? ''} width={image.width ?? undefined} height={image.height ?? undefined} loading={loading} sizes={sizes} /> : null}
      </div>
    )
  }
}

/** The images that belong to the selected variant (matched on the swatch option, e.g. Color). */
export function imagesForVariant(product: Product, variant: ProductVariant | null): ShopImage[] {
  let all = product.images.nodes
  if (!variant) return all
  let swatchOption = product.options.find((o) => o.optionValues.some((v) => v.swatch?.color)) ?? product.options[0]
  let value = variant.selectedOptions.find((o) => o.name === swatchOption?.name)?.value
  let matched = value ? all.filter((img) => img.altText?.toLowerCase().includes(value!.toLowerCase())) : []
  if (matched.length) return matched
  if (variant.image) return [variant.image, ...all.filter((i) => i.url !== variant.image!.url)]
  return all
}

/**
 * Product images. layout="carousel": swipeable track with thumbnails (vertical on desktop).
 * layout="grid": two-column image grid on desktop, carousel on mobile. Works without JS (scroll-snap + anchors).
 */
export function ProductGallery(
  handle: Handle<Passthrough & { product: Product; variant?: ProductVariant | null; layout?: 'carousel' | 'grid'; ratio?: string }>,
) {
  return () => {
    let { product, variant = null, layout = 'carousel', ratio, class: className, style: s, ...rest } = handle.props
    let images = imagesForVariant(product, variant)
    let id = `gallery-${product.handle}`
    return (
      <rp-gallery {...rest} class={cx('rp-gallery', className)} data-layout={layout} style={style(ratio ? { '--ratio': ratio } : undefined, s)}>
        <div class="rp-gallery-main">
          <div class="rp-gallery-track" tabindex={0} role="region" aria-label={`${product.title} images`}>
            {images.map((img, i) => (
              <figure class="rp-gallery-slide" id={`${id}-${i}`}>
                <img src={img.url} alt={img.altText ?? product.title} width={img.width ?? undefined} height={img.height ?? undefined} loading={i === 0 ? 'eager' : 'lazy'} />
              </figure>
            ))}
          </div>
          {images.length > 1 ? <span class="rp-gallery-count" aria-hidden="true"><span data-rp-gallery-index>1</span> / {images.length}</span> : null}
        </div>
        {images.length > 1 ? (
          <nav class="rp-gallery-thumbs" aria-label="Choose image">
            {images.map((img, i) => (
              <a class="rp-gallery-thumb" href={`#${id}-${i}`} aria-current={i === 0 ? 'true' : 'false'} data-rmx-document>
                <img src={img.url} alt="" loading="lazy" />
                <span class="rp-visually-hidden">Image {i + 1}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </rp-gallery>
    )
  }
}

// ── Product form ────────────────────────────────────────────────────────────

interface ProductFormContext {
  product: Product
  variant: ProductVariant | null
}

/**
 * Wraps variant selection + add to cart in one progressive form.
 * Without children it renders the standard stack: VariantPicker, QuantityInput, AddToCartButton.
 * Pass children to compose your own layout from those three (they read product/variant from context).
 * JS off: picking options and pressing "Update" reloads the page with ?Color=…&Size=…; Add posts to /api/cart.
 * JS on: options apply instantly and Add opens the cart drawer.
 */
export function ProductForm(handle: Handle<Passthrough & { product: Product; variant: ProductVariant | null; children?: RemixNode }, ProductFormContext>) {
  return () => {
    let { product, variant, class: className, children, ...rest } = handle.props
    handle.context.set({ product, variant })
    return (
      <rp-product-form>
        <form
          {...rest}
          class={cx('rp-product-form rp-stack', className)}
          style={{ '--gap': 'var(--rp-space-6)' }}
          method="post"
          action={CART_ACTION}
          data-rmx-reset-scroll="manual"
          data-rmx-history="replace"
        >
          <input type="hidden" name="merchandiseId" value={variant?.id ?? ''} />
          {children ?? (
            <>
              <VariantPicker />
              <div class="rp-inline" style={{ '--gap': 'var(--rp-space-3)' }} data-nowrap="">
                <QuantityInput />
                <AddToCartButton class="flex-1" />
              </div>
            </>
          )}
        </form>
      </rp-product-form>
    )
  }
}

/** All option pickers for the product in ProductForm. Options with swatch colors render as swatches, others as pills. */
export function VariantPicker(handle: Handle<Passthrough & { product?: Product; variant?: ProductVariant | null }>) {
  return () => {
    let ctx = handle.context.get(ProductForm)
    let product = handle.props.product ?? ctx?.product
    let variant = handle.props.variant ?? ctx?.variant ?? null
    if (!product) return null
    let selected = Object.fromEntries((variant?.selectedOptions ?? []).map((o) => [o.name, o.value]))
    let options = product.options.filter((o) => o.optionValues.length > 1 || product!.options.length > 1)
    if (options.length === 0 || (options.length === 1 && options[0].optionValues.length === 1)) return null
    return (
      <div class={cx('rp-stack', handle.props.class)} style={{ '--gap': 'var(--rp-space-5)' }}>
        {options.map((option) => {
          let isSwatch = option.optionValues.some((v) => v.swatch?.color)
          return (
            <fieldset class="rp-picker">
              <legend class="rp-picker-legend">
                {option.name}
                <span>{selected[option.name]}</span>
              </legend>
              <div class="rp-picker-options">
                {option.optionValues.map((value) => {
                  let wanted = { ...selected, [option.name]: value.name }
                  let match = product!.variants.nodes.find((v) => v.selectedOptions.every((o) => wanted[o.name] === o.value))
                  let unavailable = !match || !match.availableForSale
                  let checked = selected[option.name] === value.name
                  return (
                    <label class="rp-picker-option" data-unavailable={unavailable ? '' : undefined} title={unavailable ? `${value.name} (sold out)` : value.name}>
                      <input type="radio" name={option.name} value={value.name} checked={checked} data-current={checked ? '' : undefined} />
                      {isSwatch ? (
                        <>
                          <span class="rp-swatch" style={{ '--swatch': value.swatch?.color ?? '#ccc' }} />
                          <span class="rp-visually-hidden">{value.name}{unavailable ? ' (sold out)' : ''}</span>
                        </>
                      ) : (
                        <span class="rp-pill">
                          {value.name}
                          {unavailable ? <span class="rp-visually-hidden"> (sold out)</span> : null}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}
        <button
          class="rp-button rp-picker-update"
          data-variant="secondary"
          data-size="sm"
          type="submit"
          formmethod="get"
          formaction={productHref(product.handle)}
          formnovalidate
        >
          Update selection
        </button>
      </div>
    )
  }
}

/** Quantity stepper. Inside ProductForm it is the add quantity; in a cart line it is the line quantity. */
export function QuantityInput(handle: Handle<Passthrough & { name?: string; value?: number; min?: number; size?: 'sm' | 'md'; label?: string }>) {
  return () => {
    let { name = 'quantity', value = 1, min = 1, size, label = 'Quantity', class: className, ...rest } = handle.props
    return (
      <rp-quantity class={cx('rp-qty', className)} data-size={size}>
        <button type="button" data-step="-1" aria-label={`Decrease ${label.toLowerCase()}`}><Icon name="minus" /></button>
        <input {...rest} name={name} value={String(value)} inputmode="numeric" pattern="[0-9]*" aria-label={label} data-min={min} autocomplete="off" />
        <button type="button" data-step="1" aria-label={`Increase ${label.toLowerCase()}`}><Icon name="plus" /></button>
      </rp-quantity>
    )
  }
}

/** Submit button for ProductForm. Shows "Sold out" (disabled) and the selected variant's price. */
export function AddToCartButton(handle: Handle<Passthrough & { showPrice?: boolean; size?: 'md' | 'lg'; children?: RemixNode }>) {
  return () => {
    let ctx = handle.context.get(ProductForm)
    let variant = ctx?.variant
    let { showPrice = true, size = 'lg', class: className, children, ...rest } = handle.props
    let soldOut = !variant || !variant.availableForSale
    return (
      <>
        <Button {...rest} class={cx('rp-add', className)} type="submit" name="intent" value="add" size={size} block disabled={soldOut} data-rp-add="">
          {soldOut ? 'Sold out' : (children ?? 'Add to cart')}
          {!soldOut && showPrice && variant ? <span class="opacity-60 font-normal">· {money(variant.price)}</span> : null}
        </Button>
        <span class="rp-visually-hidden" role="status" data-rp-add-status></span>
      </>
    )
  }
}

// ── Product card ────────────────────────────────────────────────────────────

/** Product tile for grids and carousels: image, title, price, optional badge. Links to the product page. */
export function ProductCard(handle: Handle<Passthrough & { product: Product; href?: string; badge?: string; ratio?: string }>) {
  return () => {
    let { product, href, badge, ratio, class: className, style: s, ...rest } = handle.props
    let compareAt = product.compareAtPriceRange?.minVariantPrice
    let onSale = compareAt && Number(compareAt.amount) > Number(product.priceRange.minVariantPrice.amount)
    return (
      <a {...rest} href={href ?? productHref(product.handle)} class={cx('rp-card', className)} style={style(ratio ? { '--ratio': ratio } : undefined, s)}>
        <div class="rp-card-media">
          {product.featuredImage ? <img src={product.featuredImage.url} alt={product.featuredImage.altText ?? product.title} loading="lazy" /> : null}
        </div>
        {badge || onSale ? <span class="rp-badge" data-tone={onSale && !badge ? 'highlight' : undefined}>{badge ?? 'Sale'}</span> : null}
        <div class="rp-stack" style={{ '--gap': 'var(--rp-space-1)' }}>
          <span class="rp-card-title">{product.title}</span>
          <Price money={product.priceRange.minVariantPrice} compareAt={compareAt} size="sm" />
        </div>
      </a>
    )
  }
}

// ── Cart ────────────────────────────────────────────────────────────────────

/** One cart line with Hydrogen's no-JS line form: quantity set/increase/decrease and remove. */
export function CartLineItem(handle: Handle<Passthrough & { line: CartLine }>) {
  return () => {
    let { line, class: className, ...rest } = handle.props
    let m = line.merchandise
    let options = m.selectedOptions.filter((o) => o.value !== 'Default Title').map((o) => o.value).join(' · ')
    return (
      <li {...rest} class={cx('rp-cart-line', className)}>
        <a class="rp-cart-line-media" href={productHref(m.product.handle)} tabindex={-1}>
          {m.image ? <img src={m.image.url} alt={m.image.altText ?? ''} loading="lazy" /> : null}
        </a>
        <div>
          <a class="rp-cart-line-title" href={productHref(m.product.handle)}>{m.product.title}</a>
          {options ? <p class="rp-cart-line-meta rp-text">{options}</p> : null}
          <form method="post" action={CART_ACTION} data-rp-cart-form="" data-rmx-reset-scroll="manual">
            <button type="submit" name="intent" value="set" hidden />
            <input type="hidden" name="lineId" value={line.id} />
            <span class="rp-qty" data-size="sm">
              <button type="submit" name="intent" value="decrease" aria-label="Decrease quantity"><Icon name="minus" /></button>
              <input name="quantity" value={String(line.quantity)} inputmode="numeric" pattern="[0-9]*" aria-label={`Quantity of ${m.product.title}`} autocomplete="off" />
              <button type="submit" name="intent" value="increase" aria-label="Increase quantity"><Icon name="plus" /></button>
            </span>
            <button type="submit" name="intent" value="remove" formnovalidate class="rp-cart-line-remove">Remove</button>
          </form>
        </div>
        <Price money={line.cost.totalAmount} compareAt={line.cost.compareAtAmountPerQuantity ? { ...line.cost.compareAtAmountPerQuantity, amount: String(Number(line.cost.compareAtAmountPerQuantity.amount) * line.quantity) } : null} size="sm" />
      </li>
    )
  }
}

/** The list of cart lines. Renders nothing for an empty cart (pair with CartEmpty). */
export function CartLines(handle: Handle<Passthrough & { cart: Cart | null }>) {
  return () => {
    let { cart, class: className, ...rest } = handle.props
    if (!cart?.lines.nodes.length) return null
    return (
      <ul {...rest} class={cx('rp-cart-lines', className)}>
        {cart.lines.nodes.map((line) => <CartLineItem line={line} />)}
      </ul>
    )
  }
}

/** Empty-cart state with a call to action. */
export function CartEmpty(handle: Handle<Passthrough & { href?: string; children?: RemixNode }>) {
  return () => (
    <div class={cx('rp-cart-empty', handle.props.class)}>
      <Icon name="bag" class="text-muted size-10" />
      <p class="rp-text">{handle.props.children ?? 'Your cart is empty.'}</p>
      <Button href={handle.props.href ?? '/'} variant="secondary">Continue shopping</Button>
    </div>
  )
}

/** Subtotal, optional free-shipping meter, and checkout button. */
export function CartSummary(handle: Handle<Passthrough & { cart: Cart | null; freeShippingThreshold?: number }>) {
  return () => {
    let { cart, freeShippingThreshold, class: className, ...rest } = handle.props
    if (!cart?.lines.nodes.length) return null
    let subtotal = Number(cart.cost.subtotalAmount.amount)
    let remaining = freeShippingThreshold ? Math.max(0, freeShippingThreshold - subtotal) : 0
    return (
      <div {...rest} class={cx('rp-cart-summary', className)}>
        {freeShippingThreshold ? (
          <div class="rp-stack" style={{ '--gap': 'var(--rp-space-2)' }}>
            <p class="rp-text" style={{ '--size': 'var(--rp-text-sm)' }}>
              {remaining > 0 ? <>You’re <strong>{money({ amount: String(remaining), currencyCode: cart.cost.subtotalAmount.currencyCode })}</strong> away from free shipping</> : <>You’ve unlocked <strong>free shipping</strong></>}
            </p>
            <div class="rp-progress" role="progressbar" aria-label="Free shipping progress" aria-valuenow={Math.round((subtotal / freeShippingThreshold) * 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ '--value': `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }} />
            </div>
          </div>
        ) : null}
        <div class="rp-cart-summary-row"><span>Subtotal</span><Price money={cart.cost.subtotalAmount} /></div>
        <div class="rp-cart-summary-row"><span>Shipping</span><span class="text-muted">Calculated at checkout</span></div>
        <div class="rp-cart-summary-row" data-total=""><span>Total</span><Price money={cart.cost.totalAmount} /></div>
        <Button href={cart.checkoutUrl} size="lg" block iconEnd="arrow" data-rmx-document="">Checkout</Button>
      </div>
    )
  }
}

/** Header cart button with live count. Links to /cart; with JS it opens CartDrawer instead. */
export function CartLink(handle: Handle<Passthrough & { cart: Cart | null; href?: string }>) {
  return () => {
    let { cart, href = '/cart', class: className, ...rest } = handle.props
    let count = cart?.totalQuantity ?? 0
    return (
      <a {...rest} href={href} class={cx('rp-button rp-cart-link', className)} data-variant="ghost" data-icon-only="" data-rp-cart-open="" aria-label={`Cart, ${count} items`}>
        <Icon name="bag" />
        <span class="rp-cart-count" data-rp-cart-count="" data-count={count}>{count || ''}</span>
      </a>
    )
  }
}

/** The contents of the cart drawer. Also served alone at /cart/drawer so the drawer can refresh. */
export function CartPanel(handle: Handle<{ cart: Cart | null; freeShippingThreshold?: number }>) {
  return () => {
    let { cart, freeShippingThreshold } = handle.props
    let count = cart?.totalQuantity ?? 0
    return (
      <div class="contents" data-rp-cart-panel="" data-count={count}>
        <div class="rp-drawer-header">
          <h2 class="rp-heading" style={{ '--size': 'var(--rp-text-xl)' }}>Cart{count ? <span class="text-muted font-body text-sm normal-case tracking-normal"> · {count} {count === 1 ? 'item' : 'items'}</span> : null}</h2>
          <button class="rp-button" data-variant="ghost" data-icon-only="" type="button" data-rp-drawer-close="" aria-label="Close cart"><Icon name="close" /></button>
        </div>
        <div class="rp-drawer-body">{cart?.lines.nodes.length ? <CartLines cart={cart} /> : <CartEmpty />}</div>
        {cart?.lines.nodes.length ? (
          <div class="rp-drawer-footer"><CartSummary cart={cart} freeShippingThreshold={freeShippingThreshold} /></div>
        ) : null}
      </div>
    )
  }
}

/** Slide-over cart. Render once per page (in the layout). Opens on add to cart and on CartLink click. */
export function CartDrawer(handle: Handle<{ cart: Cart | null; freeShippingThreshold?: number }>) {
  return () => (
    <rp-cart-drawer data-src="/cart/drawer">
      <dialog class="rp-drawer" aria-label="Cart">
        <CartPanel cart={handle.props.cart} freeShippingThreshold={handle.props.freeShippingThreshold} />
      </dialog>
    </rp-cart-drawer>
  )
}

// ── Store chrome ────────────────────────────────────────────────────────────

/** Sticky store header: nav on the left, logo centered, search/account/cart on the right. */
export function StoreHeader(handle: Handle<Passthrough & { shopName: string; nav?: { label: string; href: string }[]; cart: Cart | null }>) {
  return () => {
    let { shopName, nav = [], cart, class: className, ...rest } = handle.props
    return (
      <header {...rest} class={cx('rp-header', className)}>
        <div class="rp-container">
          <div class="rp-header-inner">
            <div class="rp-header-start">
              <Button variant="ghost" icon="menu" label="Menu" href="#footer-nav" class="rp-header-menu" />
              <nav class="rp-header-nav" aria-label="Main">{nav.map((n) => <a href={n.href}>{n.label}</a>)}</nav>
            </div>
            <a class="rp-header-logo" href="/">{shopName}</a>
            <div class="rp-header-actions">
              <Button variant="ghost" icon="search" label="Search" href="/search" />
              <Button variant="ghost" icon="user" label="Account" href="/account" class="hidden sm:inline-flex" />
              <CartLink cart={cart} />
            </div>
          </div>
        </div>
      </header>
    )
  }
}

export function Announcement(handle: Handle<Passthrough & { children?: RemixNode }>) {
  return () => <div class={cx('rp-announcement', handle.props.class)}>{handle.props.children}</div>
}

export function StoreFooter(handle: Handle<Passthrough & { shopName: string; children?: RemixNode }>) {
  return () => (
    <footer class={cx('rp-footer', handle.props.class)}>
      <div class="rp-container rp-inline" style={{ '--gap': 'var(--rp-space-4)' }} data-justify="between">
        <span>© {new Date().getFullYear()} {handle.props.shopName}</span>
        {handle.props.children}
      </div>
    </footer>
  )
}
