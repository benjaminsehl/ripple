import type { CartStore } from "@shopify/hydrogen";
export interface RippleCommerce { backend: "hydrogen" | "liquid"; host: string; cart: CartStore; usable: boolean; ready: Promise<void> }
let current: RippleCommerce | null = null;
export function setCommerceForSpike(c: RippleCommerce | null) { current = c; }
export function getCommerce(): RippleCommerce { if (!current) throw new Error("not configured"); return current; }
