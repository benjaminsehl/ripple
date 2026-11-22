import { readFileSync } from "node:fs"
import { generateBaseCss, type ElementDisplay } from "./display-css.ts"
const c = (tag: string): ElementDisplay => ({ tag, display: "contents" })
const b = (tag: string): ElementDisplay => ({ tag, display: "block" })
const elements = [c("rp-dialog"), b("rp-quantity"), b("rp-carousel"), b("rp-navigation-menu"), b("rp-cart"), c("rp-product-form"), c("rp-live"), b("rp-predictive-search"), b("rp-recommendations"), b("ui-tabs"), b("ui-tabs-list"), c("ui-tabs-tab"), b("ui-tabs-indicator"), b("ui-tabs-panel"), c("ui-tooltip-trigger"), b("ui-tooltip-arrow"), b("ui-toast-region"), b("ui-toast"), b("ui-toast-title"), b("ui-toast-description"), c("ui-toast-action"), c("ui-toast-close")]
const src = readFileSync(new URL("../css/base.css", import.meta.url), "utf8")
const out = generateBaseCss(src, elements)
console.log(out === src ? "IDENTICAL" : "DIFFERENT")
if (out !== src) console.log(out)
