import {
  configureCartEndpoint,
  createCartStore,
  initializeShopifyScripts,
  trackCartAnalytics,
  type AnalyticsEventName,
  type CartData,
} from "@shopify/hydrogen";
import { createCommerce, type RefreshStrategy, type ResolvedOptions, type RippleCommerce } from "./adapter";
import { hydrogenDialect } from "./dialect";
import { refreshHtml } from "./refresh-html";
import { refreshReact } from "./refresh-react";
import { refreshRemix } from "./refresh-remix";

const STRATEGIES: Record<"html" | "react" | "remix", RefreshStrategy> = {
  html: refreshHtml,
  react: refreshReact,
  // Without a reloadFrames callback the remix host refreshes like the html host.
  remix: (regions, context) =>
    context.options.reloadFrames ? refreshRemix(regions, context) : refreshHtml(regions, context),
};

function domReady(): Promise<void> {
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise((resolve) => document.addEventListener("DOMContentLoaded", () => resolve(), { once: true }));
}

export function createHydrogenCommerce(options: ResolvedOptions): RippleCommerce {
  configureCartEndpoint(options.cartEndpoint);
  const seeded = options.initialCart !== undefined;
  const cart = seeded
    ? createCartStore({ initialData: options.initialCart as { cart: CartData | null } })
    : createCartStore();
  cart.connect();

  return createCommerce(options, {
    cart,
    dialect: hydrogenDialect(options.cartEndpoint),
    strategy: STRATEGIES[options.host === "liquid" ? "html" : options.host],
    submit: (_form, _submitter, event) => cart.handleFormSubmit(event),
    async probe() {
      if (!seeded) return cart.fetch();
      await domReady();
      if (!window.Shopify?.actions?.updateCart) {
        throw new Error(
          "Standard Actions not available. Print the Shopify script tags (renderShopifyScriptTags) before ripple.js.",
        );
      }
    },
    afterReady(commerce) {
      window.Shopify?.actions?.openCart?.configure({ handler: async () => commerce.openCart() });
      if (!options.analytics || !window.Shopify?.analytics) return;
      try {
        void initializeShopifyScripts({ consent: { mode: options.consent } });
        trackCartAnalytics(cart);
        defineViewEvent();
      } catch (error) {
        console.error("[ripple] analytics not started.", error);
      }
    },
  });
}

/** `rp-view-event` on the hydrogen backend: publishes one Hydrogen analytics view event. */
function defineViewEvent(): void {
  if (customElements.get("rp-view-event")) return;
  customElements.define(
    "rp-view-event",
    class extends HTMLElement {
      #sent = false;
      #observer: IntersectionObserver | null = null;

      connectedCallback(): void {
        if (this.#sent) return;
        if (this.getAttribute("view-event-trigger") !== "intersect" || !("IntersectionObserver" in window)) {
          this.dispatchViewEvent();
          return;
        }
        this.#observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.dispatchViewEvent();
        });
        this.#observer.observe(this);
      }

      disconnectedCallback(): void {
        this.#observer?.disconnect();
        this.#observer = null;
      }

      dispatchViewEvent(): void {
        if (this.#sent) return;
        this.#sent = true;
        this.#observer?.disconnect();
        const raw =
          this.getAttribute("view-event-payload") ??
          this.querySelector('script[type="application/json"][data-view-event-payload]')?.textContent ??
          "";
        try {
          const { event, payload } = JSON.parse(raw) as { event: AnalyticsEventName; payload: never };
          window.Shopify?.analytics?.publish(event, payload);
        } catch (error) {
          console.error("[ripple] rp-view-event: invalid payload.", error);
        }
      }
    },
  );
}
