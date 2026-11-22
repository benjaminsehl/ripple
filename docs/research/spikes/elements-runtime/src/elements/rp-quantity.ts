// <rp-quantity>: stepper around a native <input type="number"> (00-decisions D-015).
import { createChange, definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"
import { announce } from "../runtime/announcer"

type QuantityChangeDetails = {
  reason: "increment-press" | "decrement-press" | "input-commit" | "imperative"
  event?: Event
  source: string
}

type QuantityOptions = {
  defaultValue?: number
  onValueChange?: (value: number, details: QuantityChangeDetails) => void
}

type Bounds = { min: number; max: number; step: number }

const INPUT = '[data-rp-part="input"]'

// Pure helpers. They read the DOM at call time and keep no references.
function inputOf(root: Element | null | undefined): HTMLInputElement | null {
  return root ? root.querySelector<HTMLInputElement>(INPUT) : null
}

function numberAttr(input: HTMLInputElement, name: string, fallback: number): number {
  const raw = input.getAttribute(name)
  if (raw === null || raw.trim() === "") return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boundsOf(input: HTMLInputElement): Bounds {
  const step = numberAttr(input, "step", 1)
  return {
    min: numberAttr(input, "min", 1),
    max: numberAttr(input, "max", Number.POSITIVE_INFINITY),
    step: step > 0 ? step : 1,
  }
}

// Clamp to [min, max] and snap down to the step grid that starts at min.
function normalize(value: number, { min, max, step }: Bounds): number {
  if (!Number.isFinite(value)) return min
  const snapped = min + Math.floor((value - min) / step + 1e-9) * step
  let result = Math.max(min, snapped)
  if (result > max) result = min + Math.floor((max - min) / step + 1e-9) * step
  return Math.max(min, result)
}

function readValue(input: HTMLInputElement): number {
  return normalize(Number(input.value), boundsOf(input))
}

// The only writes this element makes: `disabled` on the two buttons.
function syncButtons(root: Element): void {
  const input = inputOf(root)
  if (!input) return
  const { min, max } = boundsOf(input)
  const value = readValue(input)
  const off = input.disabled
  root
    .querySelector('[data-rp-part="decrement"]')
    ?.toggleAttribute("disabled", off || value <= min)
  root
    .querySelector('[data-rp-part="increment"]')
    ?.toggleAttribute("disabled", off || value >= max)
}

function nameOf(input: HTMLInputElement): string {
  return (
    input.getAttribute("aria-label") ??
    input.labels?.[0]?.textContent?.trim() ??
    ""
  )
}

const rpQuantity = definePrimitive({
  name: "rp-quantity",
  options: { defaultValue: "number", onValueChange: "callback" },
  state: (options: QuantityOptions) => ({ value: options.defaultValue ?? 1 }),
  api: (context) => {
    const change = createChange(context)
    const root = () => context.element("root")

    // Moves state to `next`. Returns false when a listener canceled the change.
    const commit = (
      next: number,
      reason: QuantityChangeDetails["reason"],
      event?: Event
    ): boolean => {
      const input = inputOf(root())
      if (!input) return false
      const value = normalize(next, boundsOf(input))
      const previous = context.store.get().value
      const accepted = value === previous || change("value", value, { reason, event })
      // The input always shows the state: the new value, or the old one after a veto.
      const shown = String(context.store.get().value)
      if (input.value !== shown) input.value = shown
      syncButtons(root()!)
      if (accepted && value !== previous) {
        announce(`${nameOf(input)} ${value}`.trim(), { from: input })
      }
      return accepted
    }

    // Adopts what the DOM shows, without an event: the server-rendered value at
    // upgrade, and the value of an input that a refresh replaced.
    const adopt = () => {
      const el = root()
      const input = inputOf(el)
      if (!el || !input) return
      context.store.set({ value: readValue(input) })
      syncButtons(el)
    }

    const step = (direction: 1 | -1, event?: Event): boolean => {
      const input = inputOf(root())
      if (!input || input.disabled) return false
      adopt()
      const before = context.store.get().value
      const accepted = commit(
        readValue(input) + direction * boundsOf(input).step,
        direction === 1 ? "increment-press" : "decrement-press",
        event
      )
      // Forms and commerce elements listen for the native events of the input.
      if (accepted && context.store.get().value !== before) {
        input.dispatchEvent(new Event("input", { bubbles: true }))
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
      return accepted
    }

    return {
      getValue: () => context.store.get().value,
      setValue: (value: number, event?: Event) => commit(Number(value), "imperative", event),
      increment: (event?: Event) => step(1, event),
      decrement: (event?: Event) => step(-1, event),
      // Internal: adopt what the user typed (the input's own `change` event).
      commitInput: (event: Event) => {
        const input = inputOf(root())
        if (input) commit(Number(input.value), "input-commit", event)
      },
      // Internal.
      adopt,
    }
  },
  agent: { actions: ["setValue", "increment", "decrement"] },
  slots: (slot) => ({
    root: slot({
      // One delegated listener set on the root (D-019 item 3).
      on: {
        click: (event, { el, api }) => {
          const target = event.target instanceof Element ? event.target : null
          const button = target?.closest("[data-rp-part]")
          if (!el || !button || !el.contains(button)) return
          const part = button.getAttribute("data-rp-part")
          if (part === "increment") api.increment(event)
          else if (part === "decrement") api.decrement(event)
        },
        // Focus entering the element: the input may have been replaced since the last event.
        focusin: (_event, { api }) => api.adopt(),
        change: (event, { api }) => {
          const target = event.target instanceof Element ? event.target : null
          // Ignore the synthetic `change` this element dispatches after a step.
          if (target?.matches(INPUT) && event.isTrusted) api.commitInput(event)
        },
      },
      bind: (_el, part) => {
        part.api.adopt()
      },
    }),
  }),
})

try {
  createParts(rpQuantity, {
    root: {
      tag: "rp-quantity",
      display: "block",
      api: ["getValue", "setValue", "increment", "decrement"],
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value: number) => {
            api.setValue(value)
          },
        },
      },
    },
  })
} catch (error) {
  console.error("[ripple] rp-quantity failed to define", error)
}

export { rpQuantity }
