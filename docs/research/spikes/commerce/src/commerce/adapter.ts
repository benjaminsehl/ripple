import type { CartState, CartStore } from "@shopify/hydrogen";
import type { CartOp, FormDialect } from "./dialect";

export type RippleBackend = "hydrogen" | "liquid";
export type RippleHost = "html" | "react" | "remix" | "liquid";

export interface CommerceStrings {
  added: string;
  updated: string;
  removed: string;
  discountApplied: string;
  discountRemoved: string;
  noteSaved: string;
  error: string;
}

export const DEFAULT_STRINGS: CommerceStrings = {
  added: "Added to cart",
  updated: "Cart updated",
  removed: "Item removed",
  discountApplied: "Discount applied",
  discountRemoved: "Discount removed",
  noteSaved: "Note saved",
  error: "Something went wrong. Try again.",
};

export interface CommerceOptions {
  host?: RippleHost;
  cartEndpoint?: string;
  cartUrl?: string;
  cartAddUrl?: string;
  cartDrawer?: string;
  initialCart?: { cart: unknown | null; errors?: Array<{ message: string }> };
  analytics?: boolean;
  consent?: "no-banner" | "default-banner";
  strings?: Partial<CommerceStrings>;
  navigate?: (url: string, options: { replace: boolean }) => void | Promise<void>;
  reloadFrames?: (names: string[], url: string | null) => void | Promise<void>;
}

export interface ResolvedOptions {
  host: RippleHost;
  backend: RippleBackend;
  cartEndpoint: string;
  cartUrl: string;
  cartAddUrl: string;
  cartDrawer: string;
  initialCart: CommerceOptions["initialCart"];
  analytics: boolean;
  consent: "no-banner" | "default-banner";
  strings: CommerceStrings;
  navigate: CommerceOptions["navigate"];
  reloadFrames: CommerceOptions["reloadFrames"];
}

export interface RippleCommerce {
  backend: RippleBackend;
  host: RippleHost;
  cart: CartStore;
  dialect: FormDialect;
  submitCart(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<void>;
  setLineQuantity(lineId: string, quantity: number): Promise<void>;
  refresh(regions: string[], options?: { url?: string; reason?: string }): Promise<void>;
  openCart(): void;
  ready: Promise<void>;
  usable: boolean;
}

export type RefreshReason =
  | "cart"
  | "variant"
  | "filter"
  | "predictive"
  | "recommendations"
  | "manual";

export type RefreshStrategy = (
  regions: string[],
  context: { url: string | null; reason: string; signal: AbortSignal; options: ResolvedOptions },
) => Promise<void>;

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

const LATE_KEYS = ["navigate", "reloadFrames", "strings"] as const;
let pendingOptions: CommerceOptions = {};
let resolved: ResolvedOptions | null = null;

export function configureCommerce(options: CommerceOptions): void {
  if (resolved === null) {
    pendingOptions = {
      ...pendingOptions,
      ...options,
      strings: { ...pendingOptions.strings, ...options.strings },
    };
    return;
  }
  for (const key of Object.keys(options)) {
    if (!(LATE_KEYS as readonly string[]).includes(key)) {
      console.warn(`[ripple] configureCommerce: "${key}" was set after commerce started and is ignored.`);
    }
  }
  if (options.navigate) resolved.navigate = options.navigate;
  if (options.reloadFrames) resolved.reloadFrames = options.reloadFrames;
  if (options.strings) Object.assign(resolved.strings, options.strings);
}

function readConfigElement(): CommerceOptions {
  if (typeof document === "undefined") return {};
  const element = document.getElementById("rp-commerce");
  if (!element) return {};
  try {
    const parsed: unknown = JSON.parse(element.textContent ?? "");
    return parsed !== null && typeof parsed === "object" ? (parsed as CommerceOptions) : {};
  } catch (error) {
    console.error("[ripple] #rp-commerce does not contain valid JSON.", error);
    return {};
  }
}

export function resolveOptions(): ResolvedOptions {
  const fromElement = readConfigElement();
  const merged: CommerceOptions = {
    ...fromElement,
    ...pendingOptions,
    strings: { ...fromElement.strings, ...pendingOptions.strings },
  };
  const host = merged.host ?? "html";
  resolved = {
    host,
    backend: host === "liquid" ? "liquid" : "hydrogen",
    cartEndpoint: merged.cartEndpoint ?? "/api/cart",
    cartUrl: merged.cartUrl ?? "/cart",
    cartAddUrl: merged.cartAddUrl ?? "/cart/add",
    cartDrawer: merged.cartDrawer ?? "cart-drawer",
    initialCart: merged.initialCart,
    analytics: merged.analytics ?? true,
    consent: merged.consent ?? "default-banner",
    strings: { ...DEFAULT_STRINGS, ...merged.strings },
    navigate: merged.navigate,
    reloadFrames: merged.reloadFrames,
  };
  return resolved;
}

export function getStrings(): CommerceStrings {
  return resolved?.strings ?? DEFAULT_STRINGS;
}

/* ------------------------------------------------------------------ */
/* Accessor                                                            */
/* ------------------------------------------------------------------ */

let current: RippleCommerce | null = null;
let starter: { create: () => RippleCommerce; define: () => void } | null = null;

/**
 * Called once by `src/commerce/index.ts`. `create` builds the adapter; `define` defines the
 * commerce elements. `define` runs after the accessor returns the new object, because elements
 * call `getCommerce()` while they upgrade.
 */
export function registerStarter(create: () => RippleCommerce, define: () => void): void {
  starter = { create, define };
}

export function getCommerce(): RippleCommerce {
  if (current) return current;
  if (starter === null || typeof document === "undefined") return INERT;
  const { create, define } = starter;
  starter = null;
  try {
    current = create();
  } catch (error) {
    console.error("[ripple] commerce failed to start; forms post natively.", error);
    current = createInertCommerce(resolved ?? resolveOptions());
    return current;
  }
  if (current.usable) define();
  return current;
}

/* ------------------------------------------------------------------ */
/* Inert object (server render, unsupported browser, failed start)     */
/* ------------------------------------------------------------------ */

const ZERO = { amount: "0.0", currencyCode: "XXX" };
const EMPTY_GROUP = { userErrors: [], warnings: [] };

function emptyState(): CartState {
  return {
    data: {
      id: null,
      totalQuantity: 0,
      cost: { subtotalAmount: ZERO, totalAmount: ZERO, checkoutChargeAmount: ZERO },
      attributes: [],
      lines: { nodes: [] },
      discountCodes: [],
    },
    loading: true,
    pending: { lines: new Set(), note: false, attributes: false, discountCodes: new Set() },
    errors: {
      cart: EMPTY_GROUP,
      lines: new Map(),
      note: EMPTY_GROUP,
      attributes: new Map(),
      discountCodes: new Map(),
      network: [],
      lastUpdatedAt: 0,
      cartUpdatedAt: 0,
      linesUpdatedAt: 0,
      noteUpdatedAt: 0,
      attributesUpdatedAt: 0,
      discountCodesUpdatedAt: 0,
      networkUpdatedAt: 0,
    },
  } as CartState;
}

function inertStore(): CartStore {
  const state = emptyState();
  const unusable = () => Promise.reject(new Error("[ripple] commerce is not usable"));
  return {
    connect() {},
    destroy() {},
    hydrate() {},
    getState: () => state,
    subscribe: () => () => {},
    fetch: unusable,
    refresh() {},
    reset() {},
    handleFormSubmit: unusable,
  };
}

const INERT_DIALECT: FormDialect = {
  backend: "hydrogen",
  addAction: "/api/cart",
  cartAction: "/api/cart",
  fields: {
    merchandiseId: "merchandiseId",
    quantity: "quantity",
    sellingPlanId: "sellingPlanId",
    lineId: "lineId",
    lineQuantity: "quantity",
    note: "note",
    discountCode: "discountCode",
  },
  intentName: "intent",
  lineAttribute: (key) => `attributes.${key}`,
  cartAttribute: (key) => `attributes.${key}`,
};

export function createInertCommerce(options: ResolvedOptions | null): RippleCommerce {
  return {
    backend: options?.backend ?? "hydrogen",
    host: options?.host ?? "html",
    cart: inertStore(),
    dialect: INERT_DIALECT,
    submitCart: () => Promise.resolve(),
    setLineQuantity: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
    openCart() {},
    ready: Promise.resolve(),
    usable: false,
  };
}

const INERT: RippleCommerce = createInertCommerce(null);

/* ------------------------------------------------------------------ */
/* Action bookkeeping and error lookup                                 */
/* ------------------------------------------------------------------ */

export type ActionKind = keyof Omit<CommerceStrings, "error">;

let actionStartedAt = 0;

/** Marks the start of a buyer cart action. Errors older than this are no longer shown. */
export function beginAction(): number {
  actionStartedAt = Date.now();
  return actionStartedAt;
}

export type ErrorScope = { line: string } | "discount" | "cart";

/** The message to show for a scope, or `null`. Only errors recorded at or after the last `beginAction()` count. */
export function errorMessage(state: CartState, scope: ErrorScope): string | null {
  const { errors } = state;
  const since = actionStartedAt;
  const first = (group: { userErrors: Array<{ message: string }>; warnings: Array<{ message: string }> } | undefined) =>
    group?.userErrors[0]?.message ?? group?.warnings[0]?.message ?? null;

  if (typeof scope === "object") {
    return errors.linesUpdatedAt >= since ? first(errors.lines.get(scope.line)) : null;
  }
  if (scope === "discount") {
    if (errors.discountCodesUpdatedAt < since) return null;
    let message: string | null = null;
    for (const group of errors.discountCodes.values()) message = first(group) ?? message;
    return message;
  }
  if (errors.lastUpdatedAt >= since) {
    const cart = first(errors.cart);
    if (cart) return cart;
  }
  if (errors.noteUpdatedAt >= since) {
    const note = first(errors.note);
    if (note) return note;
  }
  if (errors.attributesUpdatedAt >= since) {
    for (const group of errors.attributes.values()) {
      const message = first(group);
      if (message) return message;
    }
  }
  if (errors.linesUpdatedAt >= since) {
    const rendered = new Set(
      Array.from(document.querySelectorAll<HTMLElement>("[data-rp-line]"), (el) => el.dataset.rpLine),
    );
    for (const [id, group] of errors.lines) {
      if (!rendered.has(id)) {
        const message = first(group);
        if (message) return message;
      }
    }
  }
  if (errors.networkUpdatedAt >= since && errors.network.length > 0) {
    return errors.network[errors.network.length - 1]!.message;
  }
  return null;
}

export function isBusy(state: CartState): boolean {
  const { pending } = state;
  return (
    pending.lines.size > 0 ||
    pending.note ||
    pending.attributes ||
    pending.discountCodes.size > 0 ||
    pending.cost === true ||
    state.revalidating === true
  );
}

/* ------------------------------------------------------------------ */
/* Synthetic submit: the only way to run a cart change from code       */
/* ------------------------------------------------------------------ */

export function submitOp(cart: CartStore, op: CartOp): Promise<void> {
  const form = document.createElement("form");
  for (const [name, value] of Object.entries(op.fields)) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.append(input);
  }
  const button = document.createElement("button");
  button.name = "intent";
  button.value = op.intent;
  form.append(button);
  const event = new SubmitEvent("submit", { submitter: button, cancelable: true });
  Object.defineProperty(event, "target", { value: form });
  return cart.handleFormSubmit(event);
}

const SETUP_ERROR = /Standard Actions|could not be configured/;

export function isSetupError(error: unknown): boolean {
  return error instanceof Error && SETUP_ERROR.test(error.message);
}

/** Lets the browser submit the form itself. Call only after `usable` is false. */
export function nativeSubmit(form: HTMLFormElement, submitter: HTMLElement | null): void {
  if (!form.isConnected) return;
  if (
    submitter instanceof HTMLElement &&
    submitter.isConnected &&
    (submitter as HTMLButtonElement).form === form
  ) {
    form.requestSubmit(submitter);
  } else {
    form.requestSubmit();
  }
}

/* ------------------------------------------------------------------ */
/* The shared implementation                                           */
/* ------------------------------------------------------------------ */

export interface BackendParts {
  cart: CartStore;
  dialect: FormDialect;
  strategy: RefreshStrategy;
  /** Runs the submission against the store. Receives only connected forms. */
  submit(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<void>;
  /** Resolves when the backend is known to work; rejects when it is not. */
  probe(): Promise<void>;
  /** Runs once after a successful probe. */
  afterReady(commerce: RippleCommerce): void;
}

const HISTORY: Record<string, "push" | "replace" | undefined> = { variant: "replace", filter: "push" };
/** A failed refresh for these reasons leaves the page as it is. Every other reason falls back to navigation. */
const NO_NAVIGATION_FALLBACK: ReadonlySet<string> = new Set(["predictive", "recommendations"]);
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function regionRoots(names: string[]): HTMLElement[] {
  return names.flatMap((name) =>
    Array.from(document.querySelectorAll<HTMLElement>(`[data-rp-region="${CSS.escape(name)}"]`)),
  );
}

type FocusMemo = { id: string; line: string | null; hook: string | null; region: string } | null;

function captureFocus(names: string[]): FocusMemo {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  const region = active.closest<HTMLElement>("[data-rp-region]");
  if (!region || !names.includes(region.dataset.rpRegion ?? "")) return null;
  return {
    id: active.id,
    line: active.closest<HTMLElement>("[data-rp-line]")?.dataset.rpLine ?? null,
    hook: active.dataset.rpPart ?? active.dataset.rpField ?? null,
    region: region.dataset.rpRegion ?? "",
  };
}

function restoreFocus(memo: FocusMemo): void {
  if (!memo) return;
  if (document.activeElement && document.activeElement !== document.body) return;
  let target: HTMLElement | null = memo.id ? document.getElementById(memo.id) : null;
  if (!target && memo.line && memo.hook) {
    const line = document.querySelector<HTMLElement>(`[data-rp-line="${CSS.escape(memo.line)}"]`);
    target =
      line?.querySelector<HTMLElement>(`[data-rp-part="${memo.hook}"], [data-rp-field="${memo.hook}"]`) ?? null;
  }
  const region = document.querySelector<HTMLElement>(`[data-rp-region="${CSS.escape(memo.region)}"]`);
  target ??= region?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
  target ??= region?.closest("dialog")?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
  target?.focus();
}

export function createCommerce(options: ResolvedOptions, parts: BackendParts): RippleCommerce {
  const inflight = new Map<string, AbortController>();

  const disable = (error: unknown) => {
    if (!commerce.usable) return;
    commerce.usable = false;
    console.error("[ripple] commerce disabled; forms post natively.", error);
  };

  const commerce: RippleCommerce = {
    backend: options.backend,
    host: options.host,
    cart: parts.cart,
    dialect: parts.dialect,
    usable: true,
    ready: Promise.resolve(),

    async submitCart(form, submitter, event) {
      await commerce.ready;
      if (!commerce.usable) return nativeSubmit(form, submitter);
      beginAction();
      try {
        await parts.submit(form, submitter, event);
      } catch (error) {
        if (!isSetupError(error)) throw error;
        disable(error);
        nativeSubmit(form, submitter);
      }
    },

    async setLineQuantity(lineId, quantity) {
      await commerce.ready;
      if (!commerce.usable) throw new Error("[ripple] commerce is not usable");
      beginAction();
      const whole = Math.max(0, Math.round(quantity));
      try {
        await submitOp(parts.cart, { intent: "set", fields: { lineId, quantity: String(whole) } });
      } catch (error) {
        if (isSetupError(error)) disable(error);
        throw error;
      }
    },

    async refresh(regions, refreshOptions = {}) {
      const names = Array.from(new Set(regions.filter((name) => name !== "")));
      if (names.length === 0) return;
      const url = refreshOptions.url ?? null;
      const reason = refreshOptions.reason ?? "manual";
      const request = new CustomEvent("rp:refresh", {
        cancelable: true,
        detail: { regions: names, url, reason },
      });
      if (!document.dispatchEvent(request)) return;

      const key = names.slice().sort().join(" ");
      inflight.get(key)?.abort();
      const controller = new AbortController();
      inflight.set(key, controller);

      const mode = HISTORY[reason];
      if (url !== null && mode && options.host !== "react") {
        if (mode === "push") history.pushState(history.state, "", url);
        else history.replaceState(history.state, "", url);
      }

      for (const root of regionRoots(names)) root.setAttribute("aria-busy", "true");
      const focus = captureFocus(names);
      let ok = true;
      try {
        await parts.strategy(names, { url, reason, signal: controller.signal, options });
      } catch (error) {
        if (controller.signal.aborted) return;
        ok = false;
        console.error("[ripple] region refresh failed; falling back to navigation.", error);
      }
      if (controller.signal.aborted) return;
      inflight.delete(key);

      for (const root of regionRoots(names)) {
        root.removeAttribute("aria-busy");
        for (const input of Array.from(
          root.querySelectorAll<HTMLInputElement>('input[data-rp-field="quantity"]'),
        )) {
          if (input !== document.activeElement) input.value = input.defaultValue;
        }
      }
      if (ok) restoreFocus(focus);
      document.dispatchEvent(new CustomEvent("rp:refreshed", { detail: { regions: names, ok } }));
      if (!ok && !NO_NAVIGATION_FALLBACK.has(reason)) {
        if (url !== null) location.assign(url);
        else location.reload();
      }
    },

    openCart() {
      const dialog = document.getElementById(options.cartDrawer);
      if (dialog instanceof HTMLDialogElement) {
        if (!dialog.open) dialog.showModal();
        return;
      }
      if (new URL(options.cartUrl, location.href).pathname !== location.pathname) {
        location.assign(options.cartUrl);
      }
    },
  };

  commerce.ready = parts.probe().then(
    () => {
      watchCart(commerce);
      parts.afterReady(commerce);
    },
    (error: unknown) => disable(error),
  );

  if (options.host !== "react" && !(options.host === "remix" && "navigation" in window)) {
    let pushed = false;
    document.addEventListener("rp:refresh", (event) => {
      const detail = (event as CustomEvent<{ reason: string; url: string | null }>).detail;
      if (detail.url !== null && HISTORY[detail.reason] === "push") pushed = true;
    });
    window.addEventListener("popstate", () => {
      if (pushed) location.reload();
    });
  }

  return commerce;
}

/** Region names declared by every `rp-cart` root, in document order, limited to regions present in the document. */
export function cartRegions(): string[] {
  const names = new Set<string>();
  for (const root of Array.from(document.querySelectorAll<HTMLElement>("rp-cart[data-rp-refresh]"))) {
    for (const name of (root.dataset.rpRefresh ?? "").split(/\s+/)) {
      if (name && document.querySelector(`[data-rp-region="${CSS.escape(name)}"]`)) names.add(name);
    }
  }
  return Array.from(names);
}

/** Refreshes the cart regions every time the store goes from busy to idle. */
function watchCart(commerce: RippleCommerce): void {
  let busy = isBusy(commerce.cart.getState());
  commerce.cart.subscribe((state) => {
    const now = isBusy(state);
    if (busy && !now) void commerce.refresh(cartRegions(), { reason: "cart" });
    busy = now;
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) commerce.cart.refresh();
  });
}
