import { announce } from "@ui-sdk/core";
import {
  beginAction,
  errorMessage,
  getCommerce,
  getStrings,
  isBusy,
  nativeSubmit,
  type ActionKind,
} from "./adapter";

const DEBOUNCE_MS = 250;

function setFlag(element: Element, name: string, on: boolean, value = ""): void {
  if (on) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  } else if (element.hasAttribute(name)) {
    element.removeAttribute(name);
  }
}

function showError(part: HTMLElement, message: string | null): void {
  const text = message ?? "";
  if (part.textContent !== text) part.textContent = text;
  if (part.hidden !== (text === "")) part.hidden = text === "";
}

/** Behaviour of one `rp-cart` root. Returns the cleanup function. */
export function connectCart(root: HTMLElement): () => void {
  const commerce = getCommerce();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const sent = new Map<string, string>();

  /** True when `node` belongs to this root and not to a nested `rp-cart`. */
  const owns = (node: Element | null): node is Element => node !== null && node.closest("rp-cart") === root;
  const own = <T extends Element>(selector: string): T[] =>
    Array.from(root.querySelectorAll<T>(selector)).filter(owns);

  const say = (kind: ActionKind): void => {
    const text = getStrings()[kind];
    const status = own<HTMLElement>('[data-rp-part="status"]')[0];
    if (status) status.textContent = text;
    else announce(text);
  };

  function paint(): void {
    const state = commerce.cart.getState();
    const busy = isBusy(state);
    setFlag(root, "data-pending", busy);
    setFlag(root, "aria-busy", busy, "true");

    if (!state.loading) {
      const total = state.data.totalQuantity;
      for (const part of own<HTMLElement>('[data-rp-part="count"]')) {
        if (part.textContent !== String(total)) part.textContent = String(total);
        if (part.hidden !== (total === 0)) part.hidden = total === 0;
      }
    }

    for (const line of own<HTMLElement>("[data-rp-line]")) {
      const id = line.dataset.rpLine ?? "";
      const pending = state.pending.lines.has(id);
      setFlag(line, "data-pending", pending);
      setFlag(line, "aria-busy", pending, "true");
    }

    for (const part of own<HTMLElement>('[data-rp-part="error"]')) {
      const line = part.closest<HTMLElement>("[data-rp-line]");
      const form = part.closest("form");
      const scope = line
        ? { line: line.dataset.rpLine ?? "" }
        : form?.querySelector('[data-rp-field="discount-code"]')
          ? ("discount" as const)
          : ("cart" as const);
      showError(part, errorMessage(state, scope));
    }
  }

  async function run(kind: ActionKind, action: () => Promise<void>): Promise<void> {
    const started = beginAction();
    try {
      await action();
    } catch (error) {
      console.error("[ripple] cart action failed.", error);
      const part = own<HTMLElement>('[data-rp-part="error"]').find((el) => !el.closest("[data-rp-line]"));
      if (part) showError(part, getStrings().error);
      return;
    }
    if (commerce.usable && commerce.cart.getState().errors.lastUpdatedAt < started) say(kind);
  }

  function commitQuantity(line: HTMLElement): void {
    const id = line.dataset.rpLine ?? "";
    const input = line.querySelector<HTMLInputElement>('input[data-rp-field="quantity"]');
    if (!id || !input) return;
    const raw = input.value.trim();
    const quantity = Math.max(0, Math.round(Number(raw)));
    if (raw === "" || Number.isNaN(quantity)) return;
    if (raw === (sent.get(id) ?? input.defaultValue)) return;
    if (!commerce.usable) {
      const submit = input.form?.querySelector<HTMLElement>('[data-rp-part="submit"]') ?? null;
      if (input.form) nativeSubmit(input.form, submit);
      return;
    }
    sent.set(id, raw);
    void run(quantity === 0 ? "removed" : "updated", () => commerce.setLineQuantity(id, quantity));
  }

  function scheduleQuantity(target: EventTarget | null): void {
    if (!(target instanceof Element)) return;
    const line = target.closest<HTMLElement>("[data-rp-line]");
    if (!line || !owns(line)) return;
    const id = line.dataset.rpLine ?? "";
    clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        const live = own<HTMLElement>(`[data-rp-line="${CSS.escape(id)}"]`)[0];
        if (live) commitQuantity(live);
      }, DEBOUNCE_MS),
    );
  }

  function kindOf(form: HTMLFormElement, submitter: HTMLElement | null): ActionKind {
    const intent = submitter?.getAttribute("name") === "intent" ? submitter.getAttribute("value") : null;
    if (intent === "remove") return "removed";
    if (intent === "discount-apply") return "discountApplied";
    if (intent === "discount-remove") return "discountRemoved";
    if (intent === "note-update") return "noteSaved";
    if (intent === "add") return "added";
    return "updated";
  }

  const onSubmit = (event: Event): void => {
    const form = event.target;
    if (!(event instanceof SubmitEvent) || !(form instanceof HTMLFormElement) || !owns(form)) return;
    if (form.method !== "post" || !commerce.usable) return;
    const submitter = event.submitter;
    if (submitter?.getAttribute("name") === "checkout") return;
    event.preventDefault();
    void run(kindOf(form, submitter), () => commerce.submitCart(form, submitter, event));
  };

  const onChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !owns(target)) return;
    if (target.matches('input[data-rp-field="quantity"]')) {
      if (target.closest("[data-rp-line]")) scheduleQuantity(target);
      return;
    }
    if (target.matches('[data-rp-field="note"]')) {
      const form = (target as HTMLTextAreaElement).form;
      const submit = form?.querySelector<HTMLElement>('[data-rp-part="submit"]') ?? null;
      if (form && submit) form.requestSubmit(submit);
    }
  };

  const onValueChange = (event: Event): void => scheduleQuantity(event.target);

  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-rp-part="remove"]') : null;
    if (!link || !owns(link) || !commerce.usable) return;
    const id = link.closest<HTMLElement>("[data-rp-line]")?.dataset.rpLine;
    if (!id) return;
    event.preventDefault();
    void run("removed", () => commerce.setLineQuantity(id, 0));
  };

  const onRefreshed = (): void => {
    sent.clear();
    paint();
  };

  root.addEventListener("submit", onSubmit);
  root.addEventListener("change", onChange);
  root.addEventListener("valuechange", onValueChange, true);
  root.addEventListener("click", onClick);
  document.addEventListener("rp:refreshed", onRefreshed);
  const unsubscribe = commerce.cart.subscribe(paint);
  void commerce.ready.then(paint);

  return () => {
    root.removeEventListener("submit", onSubmit);
    root.removeEventListener("change", onChange);
    root.removeEventListener("valuechange", onValueChange, true);
    root.removeEventListener("click", onClick);
    document.removeEventListener("rp:refreshed", onRefreshed);
    unsubscribe();
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  };
}
