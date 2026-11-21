import { definePrimitive, createParts, createChange } from "/web/core.js"
const cartCount = definePrimitive({
  name: "rp-cart-count",
  options: { count: "number", defaultCount: "number", onCountChange: "callback" },
  state: (options) => ({ count: options.defaultCount ?? options.count ?? 0, pending: false }),
  api: (context) => {
    const change = createChange(context)
    return {
      getCount: () => context.store.get().count,
      setCount: (n, event) => change("count", n, { reason: "programmatic", event }),
      setPending: (pending) => context.store.set({ pending }),
    }
  },
  agent: { actions: ["setCount"] },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        "data-count": String(state.count),
        "data-empty": state.count === 0 ? "" : undefined,
        "data-pending": state.pending ? "" : undefined,
        "aria-busy": state.pending ? "true" : undefined,
      }),
    }),
    value: slot({
      bind: (el, part) => {
        const write = () => { const t = String(part.store.get().count); if (el.textContent !== t) el.textContent = t }
        write()
        return part.store.subscribe(write)
      },
    }),
  }),
})
window.__parts = createParts(cartCount, {
  root: { tag: "rp-cart-count", display: "contents", api: ["getCount", "setCount", "setPending"],
    state: { count: { get: (api) => api.getCount(), set: (api, v) => api.setCount(v) } } },
  value: "rp-cart-count-value",
})
window.__customReady = true
