export function announce(text: string, _priority: "polite" | "assertive" = "polite"): void {
  (window as unknown as { __announced: string[] }).__announced ??= [];
  (window as unknown as { __announced: string[] }).__announced.push(text);
}
