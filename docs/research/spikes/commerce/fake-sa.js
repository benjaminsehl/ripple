// Minimal EMULATION of Standard Actions (cdn.shopify.com is blocked here). Shapes follow hydrogen/packages/hydrogen/vendor/standard-actions.d.ts.
(function(){
  const log = (window.__log = []);
  let cart = window.__initialCart ?? null; // server cart
  let config = null; let seq = 0;
  const summary = () => cart && ({ id: cart.id, totalQuantity: cart.lines.reduce((n,l)=>n+l.quantity,0), cost:{totalAmount:{amount:"0.0",currencyCode:"USD"}}, lines:{nodes: cart.lines.map(l=>({id:l.id,quantity:l.quantity,cost:{totalAmount:{amount:"0.0",currencyCode:"USD"}}}))}, discountCodes: [] });
  async function defaultUpdate(payload){
    await new Promise(r=>setTimeout(r, 30));
    if (!cart) cart = { id: "gid://shopify/Cart/c1", lines: [] };
    for (const l of payload.lines ?? []) {
      if (l.id) { const x = cart.lines.find(c=>c.id===l.id); if (x) x.quantity = l.quantity; cart.lines = cart.lines.filter(c=>c.quantity>0); }
      else cart.lines.push({ id: "gid://shopify/CartLine/"+(++seq)+"?cart=c1", quantity: l.quantity, merchandiseId: l.merchandiseId });
    }
    return window.__userErrors ? { cart: summary(), userErrors: window.__userErrors } : { cart: summary() };
  }
  function updateCart(payload, options){
    log.push(["updateCart", JSON.parse(JSON.stringify(payload))]);
    const run = () => config?.handler ? config.handler(() => { log.push(["defaultHandler"]); return defaultUpdate(payload); }, payload, options) : defaultUpdate(payload);
    const promise = run();
    if (payload.lines) {
      const action = payload.lines[0].id ? (payload.lines[0].quantity === 0 ? "remove" : "update") : "add";
      const ev = new Event("shopify:cart:lines-update", { bubbles: true });
      Object.assign(ev, { action, context: "standard-action", lines: payload.lines, promise, detail: options?.event?.detail });
      const target = config?.eventTarget?.({ type: ev.type, action }) ?? document;
      target.dispatchEvent(ev);
    }
    return promise;
  }
  updateCart.configure = (c) => { log.push(["configure", Object.keys(c)]); if (config || window.__preconfigured) return false; config = c; return true; };
  updateCart.isDefault = () => !config;
  const getCart = async (p) => { log.push(["getCart", p ?? null]); return { cart: summary() }; };
  let oc = null; const openCart = async () => { log.push(["openCart"]); return oc?.handler ? oc.handler(async () => {}) : undefined; }; openCart.configure = (c) => { oc = c; log.push(["openCart.configure"]); return true; }; openCart.isDefault = () => true;
  window.Shopify = { actions: { getCart, updateCart, openCart } };
})();
