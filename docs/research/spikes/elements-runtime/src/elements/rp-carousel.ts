// <rp-carousel>: previous/next buttons for a CSS scroll-snap list (00-decisions D-016).
import { createChange, definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"

type CarouselReason = "previous-press" | "next-press" | "scroll" | "imperative"

type CarouselOptions = {
  defaultIndex?: number
  onIndexChange?: (index: number, details: { reason: CarouselReason; event?: Event; source: string }) => void
}

const VIEWPORT = '[data-rp-part="viewport"]'
const ITEM = '[data-rp-part="item"]'

function viewportOf(root: Element | null | undefined): HTMLElement | null {
  return root ? root.querySelector<HTMLElement>(VIEWPORT) : null
}

function itemsOf(viewport: HTMLElement): HTMLElement[] {
  return [...viewport.querySelectorAll<HTMLElement>(ITEM)].filter((item) => item.closest(VIEWPORT) === viewport)
}

function isRtl(el: Element): boolean {
  return getComputedStyle(el).direction === "rtl"
}

// Distance scrolled from the start edge, always >= 0 (scrollLeft is negative in RTL).
function scrolled(viewport: HTMLElement): number {
  return Math.abs(viewport.scrollLeft)
}

function maxScroll(viewport: HTMLElement): number {
  return Math.max(0, viewport.scrollWidth - viewport.clientWidth)
}

// Distance of an item's start edge from the viewport's start edge, in the scroll direction.
function startOffset(viewport: HTMLElement, item: HTMLElement): number {
  const box = viewport.getBoundingClientRect()
  const itemBox = item.getBoundingClientRect()
  return isRtl(viewport) ? box.right - itemBox.right : itemBox.left - box.left
}

// Index of the first item whose start edge is at or after the viewport's start edge.
function currentIndex(viewport: HTMLElement): number {
  const items = itemsOf(viewport)
  if (items.length === 0) return 0
  if (scrolled(viewport) >= maxScroll(viewport) - 1 && maxScroll(viewport) > 0) {
    // At the end the last snapped item may not reach the start edge: report the first fully visible one.
    const first = items.findIndex((item) => startOffset(viewport, item) >= -1)
    return first === -1 ? items.length - 1 : first
  }
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  items.forEach((item, index) => {
    const distance = Math.abs(startOffset(viewport, item))
    if (distance < bestDistance - 0.5) {
      best = index
      bestDistance = distance
    }
  })
  return best
}

function behavior(): ScrollBehavior {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
}

// The only writes this element makes: `disabled` on the two buttons.
function syncButtons(root: Element): void {
  const viewport = viewportOf(root)
  if (!viewport) return
  const position = scrolled(viewport)
  const max = maxScroll(viewport)
  root.querySelector('[data-rp-part="prev"]')?.toggleAttribute("disabled", position <= 1)
  root.querySelector('[data-rp-part="next"]')?.toggleAttribute("disabled", position >= max - 1)
}

const rpCarousel = definePrimitive({
  name: "rp-carousel",
  options: { defaultIndex: "number", onIndexChange: "callback" },
  state: (options: CarouselOptions) => ({ index: options.defaultIndex ?? 0 }),
  api: (context) => {
    const change = createChange(context)
    const root = () => context.element("root")
    let reason: CarouselReason = "scroll"
    let cause: Event | undefined

    const scrollToIndex = (index: number, smooth: boolean) => {
      const viewport = viewportOf(root())
      if (!viewport) return
      const items = itemsOf(viewport)
      const item = items[Math.min(Math.max(index, 0), items.length - 1)]
      if (!item) return
      const distance = startOffset(viewport, item)
      viewport.scrollBy({ left: isRtl(viewport) ? -distance : distance, behavior: smooth ? behavior() : "auto" })
    }

    const page = (direction: 1 | -1, event?: Event) => {
      const viewport = viewportOf(root())
      if (!viewport) return
      reason = direction === 1 ? "next-press" : "previous-press"
      cause = event
      const distance = direction * viewport.clientWidth
      viewport.scrollBy({ left: isRtl(viewport) ? -distance : distance, behavior: behavior() })
    }

    return {
      getIndex: () => context.store.get().index,
      next: (event?: Event) => page(1, event),
      previous: (event?: Event) => page(-1, event),
      goTo: (index: number) => {
        reason = "imperative"
        cause = undefined
        scrollToIndex(Number(index), true)
      },
      // Property write: jump without animation and without an event.
      setIndex: (index: number) => {
        const viewport = viewportOf(root())
        if (!viewport) return
        const count = itemsOf(viewport).length
        const next = Math.min(Math.max(Number(index) || 0, 0), Math.max(count - 1, 0))
        context.store.set({ index: next })
        scrollToIndex(next, false)
      },
      // Internal: the viewport scrolled or resized.
      sync: () => {
        const el = root()
        const viewport = viewportOf(el)
        if (!el || !viewport) return
        syncButtons(el)
        const index = currentIndex(viewport)
        if (index !== context.store.get().index) {
          // The scroll already happened: canceling `indexchange` has no effect.
          if (!change("index", index, { reason, event: cause })) context.store.set({ index })
        }
      },
      // Internal: the scroll came to rest; later scrolls are the user's unless a button says otherwise.
      settle: () => {
        reason = "scroll"
        cause = undefined
      },
      // Internal: adopt the server-rendered position without an event.
      adopt: () => {
        const el = root()
        const viewport = viewportOf(el)
        if (!el || !viewport) return
        const wanted = context.store.get().index
        if (wanted > 0) scrollToIndex(wanted, false)
        context.store.set({ index: currentIndex(viewport) })
        syncButtons(el)
      },
    }
  },
  agent: { actions: ["next", "previous", "goTo"] },
  slots: (slot) => ({
    root: slot({
      on: {
        click: (event, { el, api }) => {
          const target = event.target instanceof Element ? event.target : null
          const button = target?.closest('[data-rp-part="prev"], [data-rp-part="next"]')
          if (!el || !button || !el.contains(button) || button.closest(VIEWPORT)) return
          if (button.getAttribute("data-rp-part") === "next") api.next(event)
          else api.previous(event)
        },
      },
      bind: (el, part) => {
        const api = part.api
        let timer: ReturnType<typeof setTimeout> | undefined
        // `scroll` does not bubble: listen in the capture phase on the root.
        const onScroll = (event: Event) => {
          if (event.target !== viewportOf(el)) return
          api.sync()
          clearTimeout(timer)
          timer = setTimeout(api.settle, 150)
        }
        el.addEventListener("scroll", onScroll, true)
        const resize = new ResizeObserver(() => api.sync())
        resize.observe(el)
        api.adopt()
        return () => {
          clearTimeout(timer)
          resize.disconnect()
          el.removeEventListener("scroll", onScroll, true)
        }
      },
    }),
  }),
})

try {
  createParts(rpCarousel, {
    root: {
      tag: "rp-carousel",
      display: "block",
      api: ["getIndex", "next", "previous", "goTo"],
      state: {
        index: {
          get: (api) => api.getIndex(),
          set: (api, value: number) => {
            api.setIndex(value)
          },
        },
      },
    },
  })
} catch (error) {
  console.error("[ripple] rp-carousel failed to define", error)
}

export { rpCarousel }
