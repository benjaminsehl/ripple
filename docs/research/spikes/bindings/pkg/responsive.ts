export const BREAKPOINTS = ["sm", "md", "lg", "xl", "2xl"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];
export type ResponsiveErrorCode =
  | "empty"
  | "whitespace"
  | "bad-token"
  | "unknown-breakpoint"
  | "unknown-value"
  | "duplicate-breakpoint"
  | "order";
export interface ResponsiveError { code: ResponsiveErrorCode; token: string; message: string }
export interface ResponsiveToken { breakpoint: Breakpoint | null; value: string }
export interface ResponsiveResult { tokens: ResponsiveToken[]; errors: ResponsiveError[]; warnings: ResponsiveError[] }

const RE_VALUE = /^[a-z0-9]+(?:[./-][a-z0-9]+)*$/;

export function parseResponsive(input: string, allowed: readonly string[]): ResponsiveResult {
  const tokens: ResponsiveToken[] = [];
  const errors: ResponsiveError[] = [];
  const warnings: ResponsiveError[] = [];
  if (input === "") {
    errors.push({ code: "empty", token: "", message: "The value is empty. Omit the prop instead." });
    return { tokens, errors, warnings };
  }
  if (input !== input.trim() || /[\t\n\f\r]/.test(input) || input.includes("  ")) {
    errors.push({ code: "whitespace", token: input, message: "Tokens are separated by exactly one space, with no leading or trailing space." });
  }
  const seen = new Set<string>();
  let lastRank = -2;
  for (const raw of input.split(/[\t\n\f\r ]+/).filter(Boolean)) {
    const colon = raw.indexOf(":");
    const prefix = colon === -1 ? null : raw.slice(0, colon);
    const value = colon === -1 ? raw : raw.slice(colon + 1);
    if (prefix !== null && !(BREAKPOINTS as readonly string[]).includes(prefix)) {
      errors.push({ code: "unknown-breakpoint", token: raw, message: `"${prefix}" is not a breakpoint. Allowed: ${BREAKPOINTS.join(", ")}.` });
      continue;
    }
    if (!RE_VALUE.test(value)) {
      errors.push({ code: "bad-token", token: raw, message: `"${raw}" is not a token of the form value or breakpoint:value.` });
      continue;
    }
    if (!allowed.includes(value)) {
      errors.push({ code: "unknown-value", token: raw, message: `"${value}" is not allowed. Allowed: ${allowed.join(", ")}.` });
      continue;
    }
    const key = prefix ?? "";
    if (seen.has(key)) {
      errors.push({ code: "duplicate-breakpoint", token: raw, message: prefix === null ? "More than one unprefixed token." : `More than one token for breakpoint "${prefix}".` });
      continue;
    }
    seen.add(key);
    const rank = prefix === null ? -1 : (BREAKPOINTS as readonly string[]).indexOf(prefix);
    if (rank < lastRank) {
      warnings.push({ code: "order", token: raw, message: "Tokens should be in ascending breakpoint order: unprefixed, sm, md, lg, xl, 2xl." });
    }
    lastRank = Math.max(lastRank, rank);
    tokens.push({ breakpoint: prefix as Breakpoint | null, value });
  }
  return { tokens, errors, warnings };
}

/** The effective value when the breakpoints in `active` match (G-8). Returns null when no token applies. */
export function resolveResponsive(tokens: ResponsiveToken[], active: readonly Breakpoint[]): string | null {
  let result: string | null = null;
  let best = -2;
  for (const token of tokens) {
    const rank = token.breakpoint === null ? -1 : BREAKPOINTS.indexOf(token.breakpoint);
    if (token.breakpoint !== null && !active.includes(token.breakpoint)) continue;
    if (rank > best) {
      best = rank;
      result = token.value;
    }
  }
  return result;
}
