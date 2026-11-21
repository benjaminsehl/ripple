import type {} from "remix/component";

/** Props a caller may add to a component root: every Remix host prop that the component does not define itself. */
export type RestProps<Own> = Omit<JSX.IntrinsicElements["div"], keyof Own | "class" | "className" | "children" | "mix" | "role">;

type El<Extra = {}> = JSX.IntrinsicElements["span"] & Extra;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "rp-dialog": El;
      "rp-quantity": El;
      "rp-carousel": El;
      "rp-navigation-menu": El;
      "rp-cart": El;
      "rp-product-form": El;
      "rp-live": El;
      "rp-predictive-search": El;
      "rp-recommendations": El;
      "ui-tabs": El<{ "default-value"?: string }>;
      "ui-tabs-list": El;
      "ui-tabs-tab": El<{ value: string }>;
      "ui-tabs-panel": El<{ value: string }>;
      "ui-tooltip": El;
      "ui-tooltip-trigger": El;
      "ui-tooltip-content": El;
      "ui-toast-region": El;
    }
  }
}
