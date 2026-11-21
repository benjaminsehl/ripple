export type CartIntent =
  | "add"
  | "increase"
  | "decrease"
  | "remove"
  | "set"
  | "discount-apply"
  | "discount-remove"
  | "note-update"
  | "attributes-update";

/** One cart change in the Hydrogen form protocol: the submitter value plus Hydrogen field names. */
export interface CartOp {
  intent: CartIntent;
  fields: Record<string, string>;
}

export interface FormDialect {
  backend: "hydrogen" | "liquid";
  /** `action` of the add-to-cart form. */
  addAction: string;
  /** `action` of every other cart form. */
  cartAction: string;
  /** Field names. `null` means the backend has no such field. */
  fields: {
    merchandiseId: string;
    quantity: string;
    sellingPlanId: string;
    lineId: string | null;
    lineQuantity: string;
    note: string;
    discountCode: string | null;
  };
  /** Name of the submitter that carries the operation, or `null` when the form action carries it. */
  intentName: string | null;
  lineAttribute(key: string): string;
  cartAttribute(key: string): string;
}

export function hydrogenDialect(cartEndpoint: string): FormDialect {
  return {
    backend: "hydrogen",
    addAction: cartEndpoint,
    cartAction: cartEndpoint,
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
}

export function liquidDialect(cartUrl: string, cartAddUrl: string): FormDialect {
  return {
    backend: "liquid",
    addAction: cartAddUrl,
    cartAction: cartUrl,
    fields: {
      merchandiseId: "id",
      quantity: "quantity",
      sellingPlanId: "selling_plan",
      lineId: null,
      lineQuantity: "updates[]",
      note: "note",
      discountCode: null,
    },
    intentName: null,
    lineAttribute: (key) => `properties[${key}]`,
    cartAttribute: (key) => `attributes[${key}]`,
  };
}

/** `data-rp-field` value to Hydrogen protocol field name. */
export const FIELD_TO_PROTOCOL: Record<string, string> = {
  "merchandise-id": "merchandiseId",
  quantity: "quantity",
  "line-id": "lineId",
  "selling-plan": "sellingPlanId",
  note: "note",
  "discount-code": "discountCode",
};

const INTENTS: ReadonlySet<string> = new Set([
  "add",
  "increase",
  "decrease",
  "remove",
  "set",
  "discount-apply",
  "discount-remove",
  "note-update",
  "attributes-update",
]);

export function isCartIntent(value: string): value is CartIntent {
  return INTENTS.has(value);
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function controls(form: HTMLFormElement): Control[] {
  return Array.from(form.elements).filter(
    (el): el is Control =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement,
  );
}

function isSuccessful(control: Control): boolean {
  if (control.disabled) return false;
  if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
    return control.checked;
  }
  return true;
}

function wholeQuantity(raw: string): number | null {
  const parsed = Number(raw.trim());
  if (raw.trim() === "" || Number.isNaN(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

/**
 * Translates a Liquid-dialect form submission into Hydrogen protocol operations.
 * Returns an empty list when the submission changes nothing.
 */
export function translateLiquidForm(form: HTMLFormElement, submitter: HTMLElement | null): CartOp[] {
  const all = controls(form).filter(isSuccessful);
  const hooked = (hook: string) => all.find((control) => control.dataset.rpField === hook);
  const submitterName = submitter?.getAttribute("name") ?? "";
  const submitterValue = submitter?.getAttribute("value") ?? "";

  // 1. A Ripple JS-only form (discount, standalone note): the submitter carries a Hydrogen intent.
  if (submitterName === "intent" && isCartIntent(submitterValue)) {
    const fields: Record<string, string> = {};
    for (const control of all) {
      const protocol = FIELD_TO_PROTOCOL[control.dataset.rpField ?? ""];
      if (protocol) fields[protocol] = control.value;
    }
    return [{ intent: submitterValue, fields }];
  }

  // 2. A product form: `id` (+ quantity, selling_plan, properties[...]).
  const merchandise = hooked("merchandise-id");
  if (merchandise) {
    const fields: Record<string, string> = { merchandiseId: merchandise.value };
    fields.quantity = hooked("quantity")?.value || "1";
    const plan = hooked("selling-plan")?.value;
    if (plan) fields.sellingPlanId = plan;
    for (const control of all) {
      const match = /^properties\[(.+)\]$/.exec(control.name);
      if (match && control.value !== "") fields[`attributes.${match[1]}`] = control.value;
    }
    return [{ intent: "add", fields }];
  }

  // 3. The cart form: send only what differs from the server-rendered values.
  const ops: CartOp[] = [];
  for (const line of Array.from(form.querySelectorAll<HTMLElement>("[data-rp-line]"))) {
    const input = line.querySelector<HTMLInputElement>('input[data-rp-field="quantity"]');
    const key = line.dataset.rpLine;
    if (!input || !key || input.value === input.defaultValue) continue;
    const quantity = wholeQuantity(input.value);
    if (quantity === null) continue;
    ops.push({ intent: "set", fields: { lineId: key, quantity: String(quantity) } });
  }
  const note = hooked("note");
  if (note && !(note instanceof HTMLSelectElement) && note.value !== note.defaultValue) {
    ops.push({ intent: "note-update", fields: { note: note.value } });
  }
  const attributes = all.filter((control) => /^attributes\[(.+)\]$/.test(control.name));
  const changed = attributes.some(
    (control) => !(control instanceof HTMLSelectElement) && control.value !== control.defaultValue,
  );
  if (changed) {
    const fields: Record<string, string> = {};
    for (const control of attributes) {
      const key = /^attributes\[(.+)\]$/.exec(control.name)![1];
      fields[`attributes.${key}`] = control.value;
    }
    ops.push({ intent: "attributes-update", fields });
  }
  return ops;
}
