import { announce } from "@ui-sdk/core";
import { getCommerce } from "./adapter";
import { formUrl } from "./rp-live";

const DEBOUNCE_MS = 200;
const REGION = "rp-predictive-results";

/** Behaviour of one `rp-predictive-search` root. Returns the cleanup function. */
export function connectPredictiveSearch(root: HTMLElement): () => void {
  const commerce = getCommerce();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let term = "";

  const input = () => root.querySelector<HTMLInputElement>('[data-rp-part="input"]');
  const results = () => root.querySelector<HTMLElement>('[data-rp-part="results"]');
  const links = () => Array.from(results()?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
  const setOpen = (open: boolean): void => {
    const panel = results();
    if (panel && panel.hidden === open) panel.hidden = !open;
  };

  function search(): void {
    const field = input();
    const form = field?.form;
    if (!field || !form || !commerce.usable) return;
    term = field.value.trim();
    if (term === "") {
      setOpen(false);
      return;
    }
    root.setAttribute("data-pending", "");
    root.setAttribute("aria-busy", "true");
    const requested = term;
    void commerce.refresh([REGION], { url: formUrl(form, null), reason: "predictive" }).finally(() => {
      if (requested !== term) return;
      root.removeAttribute("data-pending");
      root.removeAttribute("aria-busy");
    });
  }

  const onInput = (event: Event): void => {
    if (event.target !== input()) return;
    clearTimeout(timer);
    timer = setTimeout(search, DEBOUNCE_MS);
  };

  const onRefreshed = (event: Event): void => {
    const detail = (event as CustomEvent<{ regions: string[]; ok: boolean }>).detail;
    if (!detail.ok || !detail.regions.includes(REGION) || term === "") return;
    if (!results()?.querySelector(`[data-rp-region="${REGION}"]`)) return;
    setOpen(true);
    const status = results()?.querySelector<HTMLElement>('[data-rp-part="status"]');
    if (status?.textContent) announce(status.textContent.trim());
  };

  const onKeydown = (event: KeyboardEvent): void => {
    const field = input();
    const panel = results();
    if (!field || !panel) return;
    if (event.key === "Escape") {
      if (panel.hidden) return;
      event.preventDefault();
      setOpen(false);
      field.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (panel.hidden) return;
    const list = links();
    if (list.length === 0) return;
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (document.activeElement !== field && index === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (next < 0) field.focus();
    else list[Math.min(next, list.length - 1)]!.focus();
  };

  const onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    if (!document.hasFocus()) return;
    setOpen(false);
  };

  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKeydown);
  root.addEventListener("focusout", onFocusOut);
  document.addEventListener("rp:refreshed", onRefreshed);
  return () => {
    clearTimeout(timer);
    root.removeEventListener("input", onInput);
    root.removeEventListener("keydown", onKeydown);
    root.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("rp:refreshed", onRefreshed);
  };
}
