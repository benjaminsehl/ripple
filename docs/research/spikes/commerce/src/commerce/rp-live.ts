import { getCommerce } from "./adapter";

function isPlainClick(event: MouseEvent): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** The URL a GET form would navigate to, without empty parameters. */
export function formUrl(form: HTMLFormElement, submitter: HTMLElement | null): string {
  const url = new URL(form.action, location.href);
  url.search = "";
  const data = submitter ? new FormData(form, submitter) : new FormData(form);
  for (const [name, value] of data) {
    if (typeof value === "string" && value !== "") url.searchParams.append(name, value);
  }
  return url.href;
}

/** Behaviour of one `rp-live` root. Returns the cleanup function. */
export function connectLive(root: HTMLElement): () => void {
  const commerce = getCommerce();
  const owns = (node: Element): boolean => node.closest("rp-live") === root;

  function go(url: string): void {
    const regions = (root.dataset.rpRefresh ?? "").split(/\s+/).filter(Boolean);
    if (regions.length === 0) {
      location.assign(url);
      return;
    }
    const reason = regions.every((name) => name.startsWith("rp-product-")) ? "variant" : "filter";
    root.setAttribute("data-pending", "");
    root.setAttribute("aria-busy", "true");
    void commerce.refresh(regions, { url, reason }).finally(() => {
      root.removeAttribute("data-pending");
      root.removeAttribute("aria-busy");
    });
  }

  const onSubmit = (event: Event): void => {
    const form = event.target;
    if (!(event instanceof SubmitEvent) || !(form instanceof HTMLFormElement) || !owns(form)) return;
    if (form.method !== "get" || !commerce.usable) return;
    event.preventDefault();
    go(formUrl(form, event.submitter));
  };

  const onChange = (event: Event): void => {
    const control = event.target;
    if (
      !(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) ||
      !owns(control) ||
      !commerce.usable
    ) {
      return;
    }
    const form = control.form;
    if (form && form.method === "get" && owns(form)) form.requestSubmit();
  };

  const onClick = (event: MouseEvent): void => {
    if (!isPlainClick(event) || !commerce.usable) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !owns(link) || link.target !== "" || link.hasAttribute("download")) return;
    if (link.origin !== location.origin || link.getAttribute("aria-disabled") === "true") return;
    event.preventDefault();
    go(link.href);
  };

  root.addEventListener("submit", onSubmit);
  root.addEventListener("change", onChange);
  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("submit", onSubmit);
    root.removeEventListener("change", onChange);
    root.removeEventListener("click", onClick);
  };
}
