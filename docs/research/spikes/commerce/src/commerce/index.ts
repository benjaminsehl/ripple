import {
  configureCommerce,
  createInertCommerce,
  getCommerce,
  registerStarter,
  resolveOptions,
  type RippleCommerce,
} from "./adapter";
import { createHydrogenCommerce } from "./adapter-hydrogen";
import { createLiquidCommerce } from "./adapter-liquid";
import { connectCart } from "./rp-cart";
import { connectLive } from "./rp-live";
import { connectPredictiveSearch } from "./rp-predictive-search";
import { connectProductForm } from "./rp-product-form";
import { connectRecommendations } from "./rp-recommendations";

export { configureCommerce, getCommerce };
export type { CommerceOptions, CommerceStrings, RippleCommerce } from "./adapter";

// SPIKE ONLY: plain HTMLElement shell. The shipped shell is the definePrimitive/createParts
// skeleton of 04-elements.md (or its SPIKE-04 fallback); both call connectX(root) / cleanup.
function define(tag: string, connect: (root: HTMLElement) => () => void): void {
  if (customElements.get(tag)) return;
  customElements.define(
    tag,
    class extends HTMLElement {
      #cleanup: (() => void) | null = null;
      connectedCallback() {
        this.#cleanup ??= connect(this);
      }
      disconnectedCallback() {
        this.#cleanup?.();
        this.#cleanup = null;
      }
    },
  );
}

function create(): RippleCommerce {
  const options = resolveOptions();
  if (typeof AbortSignal.any !== "function" || typeof crypto?.randomUUID !== "function") {
    return createInertCommerce(options);
  }
  return options.backend === "liquid" ? createLiquidCommerce(options) : createHydrogenCommerce(options);
}

function defineElements(): void {
  define("rp-cart", connectCart);
  define("rp-product-form", connectProductForm);
  define("rp-live", connectLive);
  define("rp-predictive-search", connectPredictiveSearch);
  define("rp-recommendations", connectRecommendations);
}

if (typeof document !== "undefined") {
  registerStarter(create, defineElements);
  queueMicrotask(() => void getCommerce());
}
