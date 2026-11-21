import { announce } from "@ui-sdk/core";
import { beginAction, errorMessage, getCommerce, getStrings } from "./adapter";

/** Behaviour of one `rp-product-form` root. Returns the cleanup function. */
export function connectProductForm(root: HTMLElement): () => void {
  const commerce = getCommerce();

  const errorPart = () => root.querySelector<HTMLElement>('[data-rp-part="error"]');
  const showError = (message: string | null): void => {
    const part = errorPart();
    if (!part) return;
    part.textContent = message ?? "";
    part.hidden = message === null;
  };
  const setPending = (on: boolean): void => {
    root.toggleAttribute("data-pending", on);
    if (on) root.setAttribute("aria-busy", "true");
    else root.removeAttribute("aria-busy");
  };

  const onSubmit = (event: Event): void => {
    const form = event.target;
    if (!(event instanceof SubmitEvent) || !(form instanceof HTMLFormElement)) return;
    if (form.closest("rp-product-form") !== root || !commerce.usable) return;
    const submitter = event.submitter;
    // Only the add button is handled. Accelerated checkout buttons keep their native behaviour.
    if (submitter !== null && !submitter.matches('[data-rp-part="submit"]')) return;
    if (root.hasAttribute("data-pending")) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const started = beginAction();
    showError(null);
    setPending(true);
    const quantity = Number(form.querySelector<HTMLInputElement>('[data-rp-field="quantity"]')?.value ?? "1") || 1;
    const merchandiseId = form.querySelector<HTMLInputElement>('[data-rp-field="merchandise-id"]')?.value ?? "";

    commerce
      .submitCart(form, submitter, event)
      .then(() => {
        if (!commerce.usable) return;
        const state = commerce.cart.getState();
        const failed = state.errors.lastUpdatedAt >= started;
        if (failed) {
          showError(errorMessage(state, "cart") ?? getStrings().error);
          return;
        }
        announce(getStrings().added);
        const proceed = root.dispatchEvent(
          new CustomEvent("action", {
            cancelable: true,
            detail: { value: "add", reason: "submit", merchandiseId, quantity },
          }),
        );
        if (proceed) commerce.openCart();
      })
      .catch((error: unknown) => {
        console.error("[ripple] add to cart failed.", error);
        showError(getStrings().error);
      })
      .finally(() => {
        if (root.isConnected) setPending(false);
      });
  };

  root.addEventListener("submit", onSubmit);
  return () => root.removeEventListener("submit", onSubmit);
}
