// Runtime start (01-architecture.md section 3.3 step 1). Importing this module
// starts the runtime once. It does nothing on a server.
import { startAnnouncer } from "./announcer"
import { installCommandsPolyfill } from "./commands-polyfill"
import { installOpener } from "./opener"

// Runs one start-up step. A step that throws is logged and never stops the others.
function guard(step: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    console.error(`[ripple] ${step} failed`, error)
  }
}

declare global {
  interface Window {
    rpRuntime?: boolean
  }
}

if (typeof document !== "undefined" && !window.rpRuntime) {
  window.rpRuntime = true
  guard("commands polyfill", installCommandsPolyfill)
  guard("opener listener", installOpener)
  guard("announcer", () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startAnnouncer, { once: true })
    } else {
      startAnnouncer()
    }
  })
}

export { guard }
export { announce, type AnnounceOptions } from "./announcer"
export { loadChunk, registerLazy, startLoader } from "./loader"
