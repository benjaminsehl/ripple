import type { RefreshStrategy } from "./adapter";

/** Cart regions render from store state in React. URL-driven regions are re-rendered by the app's router. */
export const refreshReact: RefreshStrategy = async (_regions, { url, reason, options }) => {
  if (url === null) return;
  if (options.navigate) await options.navigate(url, { replace: reason === "variant" });
  else location.assign(url);
};
