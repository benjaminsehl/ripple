// <rp-dialog>: wrapper around one native <dialog> (00-decisions D-008).
// Used by Dialog, Drawer, MobileNav, CartDrawer and the ProductGallery lightbox.
import { createChange, definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"

type DialogReason = "trigger-press" | "close-press" | "escape-key" | "outside-press" | "link-press" | "imperative"

type DialogOptions = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: DialogReason; event?: Event; source: string }) => void
}

type NavigateEventLike = Event & {
  canIntercept?: boolean
  hashChange?: boolean
  downloadRequest?: string | null
  sourceElement?: Element | null
}

// Dialogs that already honoured data-default-open, so a reconnect does not reopen them.
const autoOpened = new WeakSet<HTMLDialogElement>()

function dialogOf(root: Element | null | undefined): HTMLDialogElement | null {
  const first = root?.querySelector("dialog") ?? null
  return first instanceof HTMLDialogElement && first.parentElement === root ? first : null
}

function canFocus(el: Element | null): el is HTMLElement {
  return el instanceof HTMLElement && el.isConnected && el !== document.body && !el.hidden
}

const rpDialog = definePrimitive({
  name: "rp-dialog",
  options: { defaultOpen: "boolean", onOpenChange: "callback" },
  state: (options: DialogOptions) => ({ open: options.defaultOpen ?? false }),
  api: (context) => {
    const change = createChange(context)
    const root = () => context.element("root")
    // Why the next external change of the dialog's `open` attribute happens.
    let reason: DialogReason = "imperative"
    let cause: Event | undefined
    let opener: Element | null = null
    let openerId = ""

    const note = (next: DialogReason, event?: Event) => {
      reason = next
      cause = event
    }

    const rememberOpener = (el: Element | null) => {
      opener = el
      openerId = el?.id ?? ""
    }

    // Native <dialog> restores focus itself. This covers the cases it misses:
    // an opener that never took focus (Safari buttons) or that was replaced.
    const afterClose = (dialog: HTMLDialogElement) => {
      const active = document.activeElement
      if (!active || active === document.body || dialog.contains(active)) {
        const replacement = openerId ? document.getElementById(openerId) : null
        if (canFocus(opener)) opener.focus()
        else if (canFocus(replacement)) replacement.focus()
      }
      rememberOpener(null)
    }

    // The dialog's `open` attribute changed. When the change did not come from
    // this api (native command, Escape, light dismiss, <form method="dialog">),
    // report it; when a listener cancels it, put the dialog back.
    const sync = () => {
      const dialog = dialogOf(root())
      if (!dialog) return
      const open = dialog.open
      if (open === context.store.get().open) return
      const accepted = change("open", open, { reason, event: cause })
      note("imperative")
      if (!accepted) {
        if (open) dialog.close()
        else dialog.showModal()
        return
      }
      if (!open) afterClose(dialog)
    }

    const show = (dialog: HTMLDialogElement, event?: Event) => {
      const source = event?.target instanceof Element ? event.target.closest("a, button") : null
      rememberOpener(source ?? document.activeElement)
      dialog.showModal()
    }

    const open = (event?: Event): boolean => {
      const dialog = dialogOf(root())
      if (!dialog || dialog.open) return false
      if (!change("open", true, { reason: event ? "trigger-press" : "imperative", event })) return false
      show(dialog, event)
      return true
    }

    const close = (event?: Event): boolean => {
      const dialog = dialogOf(root())
      if (!dialog || !dialog.open) return false
      if (!change("open", false, { reason: event ? "close-press" : "imperative", event })) return false
      dialog.close()
      afterClose(dialog)
      return true
    }

    // Property and attribute writes: no event (same rule as every UI SDK element).
    const setOpen = (value: boolean) => {
      const dialog = dialogOf(root())
      if (!dialog || dialog.open === value) return
      context.store.set({ open: value })
      if (value) show(dialog)
      else {
        dialog.close()
        afterClose(dialog)
      }
    }

    // Top-level navigation started by a link or form (Remix keeps the document).
    const onNavigate = (event: Event) => {
      const navigation = event as NavigateEventLike
      if (!navigation.canIntercept || navigation.hashChange || navigation.downloadRequest != null) return
      const source = navigation.sourceElement
      if (!source || source.closest("[data-rmx-target]")) return
      const dialog = dialogOf(root())
      if (dialog?.open) {
        note("link-press", event)
        dialog.close()
      }
    }
    const navigation = (globalThis as { navigation?: EventTarget }).navigation
    navigation?.addEventListener("navigate", onNavigate)
    context.onDestroy(() => navigation?.removeEventListener("navigate", onNavigate))

    return {
      isOpen: () => context.store.get().open,
      open,
      close,
      setOpen,
      // Internal. Not listed in createParts `api`.
      adopt: () => context.store.set({ open: dialogOf(root())?.open ?? false }),
      sync,
      note,
      rememberOpener,
    }
  },
  agent: { actions: ["open", "close"] },
  slots: (slot) => ({
    root: slot({
      on: {
        // Backdrop click fallback for browsers without `closedby`.
        click: (event, { el, api }) => {
          const dialog = dialogOf(el)
          if (!dialog || event.target !== dialog || !dialog.open) return
          if (dialog.getAttribute("closedby") !== "any" || "closedBy" in HTMLDialogElement.prototype) return
          const box = dialog.getBoundingClientRect()
          const mouse = event as MouseEvent
          const inside =
            mouse.clientX >= box.left && mouse.clientX <= box.right && mouse.clientY >= box.top && mouse.clientY <= box.bottom
          if (inside) return
          api.note("outside-press", event)
          dialog.close()
        },
      },
      bind: (el, part) => {
        const api = part.api
        // `command`, `cancel` and `close` do not bubble: listen in the capture phase on the root.
        const onCommand = (event: Event) => {
          if (event.target !== dialogOf(el)) return
          const { command, source } = event as Event & { command?: string; source?: Element | null }
          if (command === "show-modal") {
            api.note("trigger-press", event)
            api.rememberOpener(source ?? null)
          } else if (command === "close") {
            api.note("close-press", event)
          }
        }
        const onCancel = (event: Event) => {
          if (event.target === dialogOf(el)) api.note("escape-key", event)
        }
        el.addEventListener("command", onCommand, true)
        el.addEventListener("cancel", onCancel, true)
        // The `open` attribute is the single source of truth for every way a dialog opens or closes.
        const observer = new MutationObserver((records) => {
          if (records.some((record) => record.target === dialogOf(el))) api.sync()
        })
        observer.observe(el, { attributes: true, attributeFilter: ["open"], subtree: true })

        const dialog = dialogOf(el)
        if (dialog?.open) {
          api.adopt()
        } else if (dialog?.hasAttribute("data-default-open") && !autoOpened.has(dialog)) {
          autoOpened.add(dialog)
          dialog.showModal()
        }
        return () => {
          observer.disconnect()
          el.removeEventListener("command", onCommand, true)
          el.removeEventListener("cancel", onCancel, true)
        }
      },
    }),
  }),
})

try {
  createParts(rpDialog, {
    root: {
      tag: "rp-dialog",
      display: "block",
      api: ["isOpen", "open", "close", "setOpen"],
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, value: boolean) => {
            api.setOpen(Boolean(value))
          },
        },
      },
    },
  })
} catch (error) {
  console.error("[ripple] rp-dialog failed to define", error)
}

export { rpDialog }
