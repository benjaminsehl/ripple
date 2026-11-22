import "@ui-sdk/web/button"
import "@ui-sdk/web/field"
import "@ui-sdk/web/input"
import "@ui-sdk/web/dialog"
import { definePrimitive, createChange } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"
import { createAgent, agentTools } from "@ui-sdk/web/agent"

// A commerce element in the proposed style: reflects state, exposes api methods.
const productForm = definePrimitive({
  name: "rp-product-form",
  options: { quantity: "number", defaultQuantity: "number", onQuantityChange: "callback", onAdd: "callback" },
  state: (o) => ({ quantity: o.defaultQuantity ?? o.quantity ?? 1, pending: false }),
  api: (context) => {
    const change = createChange(context)
    return {
      setQuantity: (n, event) => change("quantity", n, { reason: "programmatic", event }),
      add: () => { window.__added = (window.__added || 0) + context.store.get().quantity; return true },
    }
  },
  agent: { actions: ["setQuantity", "add"] },
  slots: (slot) => ({ root: slot({ attrs: (s) => ({ "data-quantity": String(s.quantity) }) }) }),
})
createParts(productForm, { root: { tag: "rp-product-form", display: "block", api: ["setQuantity", "add"],
  state: { quantity: { get: (api) => undefined, set: (api, v) => api.setQuantity(v) } } } })

window.agent = createAgent({ allow: (step) => !step.confirm || window.__approve === true })
window.agentTools = agentTools
