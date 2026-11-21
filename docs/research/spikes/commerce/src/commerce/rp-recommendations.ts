import { getCommerce } from "./adapter";

const REGION = "rp-product-recommendations";

/** Behaviour of one `rp-recommendations` root. Returns the cleanup function. */
export function connectRecommendations(root: HTMLElement): () => void {
  const url = root.getAttribute("data-url");
  if (!url || !("IntersectionObserver" in window)) return () => {};
  const commerce = getCommerce();
  let done = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (done || !entries.some((entry) => entry.isIntersecting)) return;
      done = true;
      observer.disconnect();
      if (!commerce.usable) return;
      root.setAttribute("data-pending", "");
      root.setAttribute("aria-busy", "true");
      const clear = () => {
        root.removeAttribute("data-pending");
        root.removeAttribute("aria-busy");
      };
      void commerce.refresh([REGION], { url, reason: "recommendations" }).finally(clear);
    },
    { rootMargin: "0px 0px 400px 0px" },
  );
  observer.observe(root);
  return () => observer.disconnect();
}
