"use client";
import type { ReactNode } from "react";
import type { CartData } from "@shopify/hydrogen";
import { cx } from "../pkg/index.ts";
import { useCart, type RestProps } from "../pkg/react.ts";

type CartLineData = CartData["lines"]["nodes"][number];

interface CartLinesOwnProps {
  /** The cart the server loaded. It is what the server HTML shows. */
  cart: CartData;
  /** Renders one line. The CartLine contract is owned by 11-components-commerce.md. */
  renderLine: (line: CartLineData) => ReactNode;
  className?: string;
}
export type CartLinesProps = CartLinesOwnProps & RestProps<CartLinesOwnProps>;

export function CartLines(props: CartLinesProps) {
  const { cart, renderLine, className, ...rest } = props;
  // Structure comes from the store (D-045 item 2). The selector returns a reference held by the state.
  const lines = useCart((state) => state.data.lines.nodes, cart.lines.nodes);
  return (
    <rp-cart {...rest} class={cx("rp-cart-lines", className)} data-slot="rp-cart" suppressHydrationWarning>
      {lines.map((line) => renderLine(line))}
    </rp-cart>
  );
}
