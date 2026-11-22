import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { HTMLAttributes, ReactNode, Ref, RefObject } from "react";
import type { CartState, CartStore } from "@shopify/hydrogen";
import { getCommerce } from "./commerce-adapter.ts";

/** Props a caller may add to a component root: every React HTML attribute and handler that the component does not define itself. */
export type RestProps<Own> = Omit<HTMLAttributes<HTMLElement>, keyof Own | "className" | "children">;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseElementOptions {
  /** Live properties to assign to the element. A value of undefined means "do not touch" (uncontrolled). */
  props?: Record<string, unknown>;
  /** DOM event name (lowercase) to handler. Attached once per name; the latest handler is always called. */
  events?: Record<string, ((event: CustomEvent) => void) | undefined>;
}

export function useElement<E extends HTMLElement>(ref: RefObject<E | null>, options: UseElementOptions): void {
  const { props = {}, events = {} } = options;
  const latest = useRef(events);
  latest.current = events;

  const names = Object.keys(events).sort().join(",");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const off = names
      .split(",")
      .filter(Boolean)
      .map((name) => {
        const listener = (event: Event) => latest.current[name]?.(event as CustomEvent);
        el.addEventListener(name, listener);
        return () => el.removeEventListener(name, listener);
      });
    return () => off.forEach((remove) => remove());
  }, [ref, names]);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let live = true;
    const assign = () => {
      if (!live) return;
      for (const [key, value] of Object.entries(props)) {
        if (value !== undefined && (el as unknown as Record<string, unknown>)[key] !== value) {
          (el as unknown as Record<string, unknown>)[key] = value;
        }
      }
    };
    if (customElements.get(el.localName)) assign();
    else void customElements.whenDefined(el.localName).then(assign);
    return () => {
      live = false;
    };
  });
}

function cartStore(): CartStore | null {
  try {
    const commerce = getCommerce();
    return commerce.usable ? commerce.cart : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

/**
 * Reads a value from the one cart store of the page.
 * `serverValue` is what the server rendered; it is returned during server rendering, during hydration,
 * and whenever the store is not usable.
 * `selector` MUST return a primitive or a reference taken from the state (no new object or array per call).
 */
export function useCart<T>(selector: (state: CartState) => T, serverValue: T): T {
  const store = cartStore();
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => (store ? selector(store.getState()) : serverValue),
    () => serverValue,
  );
}

type CE<Extra = {}> = Omit<HTMLAttributes<HTMLElement>, "className"> &
  Extra & { class?: string; ref?: Ref<HTMLElement>; children?: ReactNode; tabindex?: number | string; for?: string };

declare module "react" {
  interface ButtonHTMLAttributes<T> {
    commandfor?: string | undefined;
    command?: string | undefined;
  }
  namespace JSX {
    interface IntrinsicElements {
      "rp-dialog": CE;
      "rp-quantity": CE;
      "rp-carousel": CE;
      "rp-navigation-menu": CE;
      "rp-cart": CE;
      "rp-product-form": CE;
      "rp-live": CE;
      "rp-predictive-search": CE;
      "rp-recommendations": CE;
      "ui-tabs": CE<{ "default-value"?: string }>;
      "ui-tabs-list": CE;
      "ui-tabs-tab": CE<{ value: string }>;
      "ui-tabs-panel": CE<{ value: string }>;
      "ui-tooltip": CE;
      "ui-tooltip-trigger": CE;
      "ui-tooltip-content": CE;
      "ui-toast-region": CE;
    }
  }
}
