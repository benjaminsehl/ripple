import type { RefreshStrategy } from "./adapter";

/** Fetches the document at `url` and swaps each `[data-rp-region]` element for its same-named counterpart. */
export const refreshHtml: RefreshStrategy = async (regions, { url, signal }) => {
  const response = await fetch(url ?? location.href, {
    headers: { accept: "text/html" },
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) throw new Error(`[ripple] region refresh: HTTP ${response.status}`);
  const next = new DOMParser().parseFromString(await response.text(), "text/html");

  const swaps: Array<[Element, Element]> = [];
  for (const name of regions) {
    const selector = `[data-rp-region="${CSS.escape(name)}"]`;
    const before = Array.from(document.querySelectorAll(selector));
    const after = Array.from(next.querySelectorAll(selector));
    if (before.length !== after.length) {
      throw new Error(`[ripple] region "${name}": ${before.length} in the page, ${after.length} in the response`);
    }
    before.forEach((element, index) => swaps.push([element, after[index]!]));
  }
  signal.throwIfAborted();
  for (const [stale, fresh] of swaps) stale.replaceWith(document.adoptNode(fresh));
};
