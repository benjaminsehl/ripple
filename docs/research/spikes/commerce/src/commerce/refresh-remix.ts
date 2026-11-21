import type { RefreshStrategy } from "./adapter";

/** Reloads the named Frames through the app-supplied `reloadFrames` callback. */
export const refreshRemix: RefreshStrategy = async (regions, { url, signal, options }) => {
  if (!options.reloadFrames) throw new Error("[ripple] configureCommerce({ reloadFrames }) was not called");
  await options.reloadFrames(regions, url);
  signal.throwIfAborted();
};
