import { createCartStore } from "@shopify/hydrogen";
import { createCommerce, submitOp, type ResolvedOptions, type RippleCommerce } from "./adapter";
import { liquidDialect, translateLiquidForm } from "./dialect";
import { refreshLiquid } from "./refresh-liquid";

export function createLiquidCommerce(options: ResolvedOptions): RippleCommerce {
  // Another script configured updateCart before Ripple: Hydrogen cannot own it (D-041 item 5).
  if (window.Shopify?.actions?.updateCart?.isDefault() === false) {
    throw new Error("Shopify.actions.updateCart is already configured by another script.");
  }
  // configureCartEndpoint MUST NOT be called on the liquid backend.
  const cart = createCartStore();
  cart.connect();

  return createCommerce(options, {
    cart,
    dialect: liquidDialect(options.cartUrl, options.cartAddUrl),
    strategy: refreshLiquid,
    async submit(form, submitter) {
      for (const op of translateLiquidForm(form, submitter)) await submitOp(cart, op);
    },
    probe: () => cart.fetch(),
    afterReady(commerce) {
      window.Shopify?.actions?.openCart?.configure({ handler: async () => commerce.openCart() });
      void defineViewEvent();
    },
  });
}

async function defineViewEvent(): Promise<void> {
  if (customElements.get("rp-view-event")) return;
  try {
    // @ts-expect-error platform-provided specifier, resolved by the storefront (D-046)
    const { createViewEventElement } = await import("@shopify/standard-events");
    customElements.define("rp-view-event", createViewEventElement());
  } catch (error) {
    console.error("[ripple] Standard Events not available; view events are not sent.", error);
  }
}
