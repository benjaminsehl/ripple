// Opener pattern for overlays with a page equivalent (00-decisions D-009).
type DialogHost = HTMLElement & { api?: { open: (event?: Event) => boolean } }

const OPENER = "a[data-rp-open]"

function hostOf(link: Element): { dialog: HTMLDialogElement; host: DialogHost } | null {
  const dialog = document.getElementById(link.getAttribute("data-rp-open") ?? "")
  if (!(dialog instanceof HTMLDialogElement)) return null
  const host = dialog.parentElement as DialogHost | null
  if (!host || host.localName !== "rp-dialog" || !host.matches(":defined") || !host.api) return null
  return { dialog, host }
}

// The two attributes on the upgrade allow-list. Written only when the dialog can open.
function markOpeners(root: ParentNode): void {
  for (const link of root.querySelectorAll(OPENER)) {
    const found = hostOf(link)
    if (!found) continue
    if (link.getAttribute("aria-haspopup") !== "dialog") link.setAttribute("aria-haspopup", "dialog")
    if (link.getAttribute("aria-controls") !== found.dialog.id) link.setAttribute("aria-controls", found.dialog.id)
  }
}

let installed = false

function installOpener(): void {
  if (installed || typeof document === "undefined") return
  installed = true
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const origin = event.target instanceof Element ? event.target : null
    const link = origin?.closest(OPENER)
    if (!link) return
    const found = hostOf(link)
    if (!found) return
    event.preventDefault()
    found.host.api!.open(event)
  })
  const mark = () => markOpeners(document)
  customElements.whenDefined("rp-dialog").then(() => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mark, { once: true })
    else mark()
    new MutationObserver((records) => {
      if (records.some((record) => record.addedNodes.length > 0)) mark()
    }).observe(document.documentElement, { childList: true, subtree: true })
  })
}

export { installOpener }
