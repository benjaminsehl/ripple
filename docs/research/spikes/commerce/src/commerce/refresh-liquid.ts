import type { RefreshStrategy } from "./adapter";

type Partials = {
  fetch(...args: Array<string | { url?: string; signal?: AbortSignal }>): Promise<unknown>;
  apply(payload: unknown): unknown;
};

let library: Promise<{ partials: Partials }> | null = null;

function load(): Promise<{ partials: Partials }> {
  // @ts-expect-error platform-provided specifier, resolved by the storefront (D-046)
  library ??= import("@shopify/partial-rendering");
  library.catch(() => {
    library = null;
  });
  return library;
}

/** `partials.fetch(...names, { url, signal })` then `partials.apply(payload)`. */
export const refreshLiquid: RefreshStrategy = async (regions, { url, signal }) => {
  const { partials } = await load();
  const payload =
    url === null
      ? await partials.fetch(...regions, { signal })
      : await partials.fetch(...regions, { url: new URL(url, location.href).href, signal });
  signal.throwIfAborted();
  await partials.apply(payload);
};
