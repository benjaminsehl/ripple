import type { Handle, RemixNode } from "remix/component";
import { cx } from "../pkg/index.ts";
import type { RestProps } from "../pkg/remix.ts";

/** The fields ProductForm reads. The full resource shape is defined in 05-commerce.md. */
export interface ProductFormProduct {
  selectedOrFirstAvailableVariant: { id: string };
}

interface ProductFormOwnProps {
  /** Required. Printed on the <form>. */
  id: string;
  product: ProductFormProduct;
  /** The route where createCartServerHandlers() is mounted. */
  action?: string;
  class?: string;
  children?: RemixNode;
}
export type ProductFormProps = ProductFormOwnProps & RestProps<ProductFormOwnProps>;

export function ProductForm(handle: Handle<ProductFormProps>) {
  return () => {
    const { id, product, action = "/api/cart", class: className, children, ...rest } = handle.props;
    return (
      <rp-product-form {...rest} class={cx("rp-product-form", className)} data-slot="rp-product-form" data-rmx-key={id}>
        <form class="rp-product-form-fields" id={id} method="post" action={action} data-rmx-document>
          <input type="hidden" name="merchandiseId" value={product.selectedOrFirstAvailableVariant.id} data-rp-field="merchandise-id" />
          {children}
          <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden data-rmx-preserve-attrs="hidden"></p>
        </form>
      </rp-product-form>
    );
  };
}
