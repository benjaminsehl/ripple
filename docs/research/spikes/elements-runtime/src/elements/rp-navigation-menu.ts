// <rp-navigation-menu>: hover intent and arrow keys for popover submenus (00-decisions D-017).
import { definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"

const ITEM = '[data-rp-part="item"]'
const OPEN_DELAY = 120
const CLOSE_DELAY = 250
// Without the popover API (below Chrome 114, Safari 17) panels are static content and this element does nothing.
const SUPPORTED = typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype

function itemOf(root: Element, target: EventTarget | null): HTMLElement | null {
  const item = target instanceof Element ? target.closest<HTMLElement>(ITEM) : null
  return item && root.contains(item) ? item : null
}

function panelOf(item: Element): HTMLElement | null {
  if (!SUPPORTED) return null
  const panel = item.querySelector<HTMLElement>("[popover]")
  return panel && panel.closest(ITEM) === item ? panel : null
}

function isOpen(panel: HTMLElement): boolean {
  return panel.matches(":popover-open")
}

// The first link or button of an item that is not inside its panel.
function entryOf(item: Element): HTMLElement | null {
  for (const el of item.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")) {
    if (!el.closest("[popover]")) return el
  }
  return null
}

function topItems(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(ITEM)].filter((item) => item.parentElement?.closest(ITEM) == null)
}

const rpNavigationMenu = definePrimitive({
  name: "rp-navigation-menu",
  state: () => ({}),
  api: (context) => {
    const root = () => context.element("root")
    let openTimer: ReturnType<typeof setTimeout> | undefined
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    const clear = () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
    }
    context.onDestroy(clear)

    const close = () => {
      clear()
      const el = root()
      if (!el || !SUPPORTED) return
      for (const panel of el.querySelectorAll<HTMLElement>("[popover]")) {
        if (isOpen(panel)) panel.hidePopover()
      }
    }

    return {
      close,
      // Internal: the mouse rests on an item.
      hover: (item: HTMLElement) => {
        clear()
        const panel = panelOf(item)
        if (!panel) {
          closeTimer = setTimeout(close, CLOSE_DELAY)
          return
        }
        if (isOpen(panel)) return
        openTimer = setTimeout(() => {
          if (panel.isConnected && !isOpen(panel)) panel.showPopover()
        }, OPEN_DELAY)
      },
      // Internal: the mouse left every item.
      leave: () => {
        clear()
        closeTimer = setTimeout(close, CLOSE_DELAY)
      },
      // Internal: arrow keys.
      key: (event: KeyboardEvent) => {
        const el = root()
        const item = el ? itemOf(el, event.target) : null
        if (!el || !item) return
        const target = event.target as Element
        const inPanel = target.closest("[popover]") !== null
        const rtl = getComputedStyle(el).direction === "rtl"
        const forward = rtl ? "ArrowLeft" : "ArrowRight"
        const backward = rtl ? "ArrowRight" : "ArrowLeft"
        if (inPanel) return
        if (event.key === "ArrowDown") {
          const panel = panelOf(item)
          if (!panel) return
          event.preventDefault()
          if (!isOpen(panel)) panel.showPopover()
          panel.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus()
          return
        }
        const items = topItems(el)
        const index = items.indexOf(item)
        let next = -1
        if (event.key === forward) next = (index + 1) % items.length
        else if (event.key === backward) next = (index - 1 + items.length) % items.length
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = items.length - 1
        if (next === -1 || next === index) return
        event.preventDefault()
        close()
        entryOf(items[next])?.focus()
      },
    }
  },
  agent: { actions: ["close"] },
  slots: (slot) => ({
    root: slot({
      on: {
        pointerover: (event, { el, api }) => {
          if (!el || (event as PointerEvent).pointerType !== "mouse") return
          const item = itemOf(el, event.target)
          if (item) api.hover(item)
        },
        pointerout: (event, { el, api }) => {
          if (!el || (event as PointerEvent).pointerType !== "mouse") return
          const to = (event as PointerEvent).relatedTarget
          if (!itemOf(el, to)) api.leave()
        },
        keydown: (event, { api }) => api.key(event as KeyboardEvent),
      },
    }),
  }),
})

try {
  createParts(rpNavigationMenu, {
    root: { tag: "rp-navigation-menu", display: "block", api: ["close"] },
  })
} catch (error) {
  console.error("[ripple] rp-navigation-menu failed to define", error)
}

export { rpNavigationMenu }
