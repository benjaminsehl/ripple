import type { ReactNode } from "react";
import { cx } from "../pkg/index.ts";
import type { RestProps } from "../pkg/react.ts";

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
  className?: string;
  children?: ReactNode;
}
export type ProductFormProps = ProductFormOwnProps & RestProps<ProductFormOwnProps>;

export function ProductForm(props: ProductFormProps) {
  const { id, product, action = "/api/cart", className, children, ...rest } = props;
  return (
    <rp-product-form {...rest} class={cx("rp-product-form", className)} data-slot="rp-product-form" suppressHydrationWarning>
      <form className="rp-product-form-fields" id={id} method="post" action={action} suppressHydrationWarning>
        <input type="hidden" name="merchandiseId" value={product.selectedOrFirstAvailableVariant.id} data-rp-field="merchandise-id" />
        {children}
        <p className="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden suppressHydrationWarning></p>
      </form>
    </rp-product-form>
  );
}
