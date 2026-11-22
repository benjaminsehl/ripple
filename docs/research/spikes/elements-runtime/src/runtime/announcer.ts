// Announcements (00-decisions D-008 item 7, D-066 item 5).
import { announce as kernelAnnounce, prepareAnnouncements } from "@ui-sdk/core"

type AnnounceOptions = { priority?: "polite" | "assertive"; from?: Element | null }

// Content outside an open modal dialog is inert, so the page-level live
// regions are silent while one is open. A caller inside an open modal dialog
// is announced through that dialog's own Announcer part instead.
function announce(text: string, options: AnnounceOptions = {}): void {
  if (typeof document === "undefined" || text === "") return
  const dialog = options.from?.closest("dialog") ?? null
  const region =
    dialog && dialog.matches(":modal") ? dialog.querySelector('[data-rp-part="status"]') : null
  if (!region) {
    kernelAnnounce(text, { priority: options.priority ?? "polite" })
    return
  }
  region.textContent = ""
  setTimeout(() => {
    region.textContent = text
  }, 30)
}

function startAnnouncer(): void {
  if (typeof document !== "undefined") prepareAnnouncements(document)
}

export { announce, startAnnouncer, type AnnounceOptions }
