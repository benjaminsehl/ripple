// <pkg>/elements. Import order is the start-up order (01-architecture.md 3.3):
// 1. runtime, 2. the four rp-* elements, 3. lazy chunk registration.
import "../runtime/index"
import "./rp-dialog"
import "./rp-carousel"
import "./rp-quantity"
import "./rp-navigation-menu"
import { guard, loadChunk, registerLazy, startLoader } from "../runtime/index"

// The subset of the UI SDK toast options that Ripple supports.
type ToastOptions = {
  id?: string
  description?: string
  type?: "default" | "success" | "error" | "warning" | "info" | "loading"
  duration?: number
  priority?: "polite" | "assertive"
}
type ToastModule = { toast: (title: string, options?: ToastOptions) => unknown }

guard("lazy chunks", () => {
  registerLazy("tabs", "ui-tabs", () => import("./ui-tabs"))
  registerLazy("tooltip", "ui-tooltip", () => import("./ui-tooltip"))
  registerLazy("toast", "ui-toast-region", () => import("./ui-toast"))
  startLoader()
})

// Shows a toast in the page's <ui-toast-region>. Loads the toast chunk on first use.
async function toast(title: string, options?: ToastOptions): Promise<void> {
  const chunk = (await loadChunk("toast")) as ToastModule | undefined
  chunk?.toast(title, options)
}

export { toast, type ToastOptions }
export { announce, type AnnounceOptions } from "../runtime/index"
