import { parseResponsive } from "./responsive.ts";
export { parseResponsive, resolveResponsive, BREAKPOINTS } from "./responsive.ts";
export type { Breakpoint } from "./responsive.ts";

/** A prop value: one literal of T, or a responsive token string such as "2 md:6". */
export type Responsive<T extends string | number | boolean> = T | (string & {});

const warned = new Set<string>();

declare const process: { env: Record<string, string | undefined> };

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

/**
 * Turns a prop value into the attribute string of the HTML contract.
 * undefined, null and "" give undefined (the attribute is omitted).
 * Numbers and booleans are printed with String(). Strings are returned unchanged.
 * In development, when `allowed` is given, the value is validated with parseResponsive
 * and each problem is reported once with console.warn. The return value is never changed by validation.
 */
export function rv(
  value: string | number | boolean | null | undefined,
  allowed?: readonly string[],
  label?: string,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value);
  if (allowed !== undefined && isDevelopment()) {
    const result = parseResponsive(text, allowed);
    for (const problem of [...result.errors, ...result.warnings]) {
      const message = `[ripple] ${label ?? "prop"}="${text}": ${problem.message}`;
      if (!warned.has(message)) {
        warned.add(message);
        console.warn(message);
      }
    }
  }
  return text;
}

/** Joins class names with one space. Skips undefined, null, false and "". Never de-duplicates or reorders. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  let out = "";
  for (const part of parts) {
    if (typeof part === "string" && part !== "") out = out === "" ? part : `${out} ${part}`;
  }
  return out;
}
