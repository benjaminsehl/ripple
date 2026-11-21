// SPIKE-04 fallback: base class for rp-* elements without the UI SDK kernel.
// Not used on the default path. Typechecked only; never run.
type ChangeDetail<T> = { value: T; reason: string; source: string; event?: Event }

function sourceOf(event?: Event): string {
  if (!event) return "programmatic"
  if (event instanceof KeyboardEvent) return "keyboard"
  const pointerType = (event as PointerEvent).pointerType
  if (pointerType === "touch" || pointerType === "pen") return pointerType
  return event instanceof MouseEvent ? "mouse" : "programmatic"
}

abstract class RippleElement extends HTMLElement {
  // Public methods. Same names as the `api` list the element has on the default path.
  api: Record<string, (...args: any[]) => unknown> = {}
  #cleanup: Array<() => void> = []

  // Runs on every connect. Sets `this.api` and adds listeners with `this.listen`.
  protected abstract start(): void

  connectedCallback(): void {
    try {
      this.start()
    } catch (error) {
      console.error(`[ripple] ${this.localName} failed to start`, error)
    }
  }

  disconnectedCallback(): void {
    for (const stop of this.#cleanup.splice(0)) stop()
  }

  // Adds a listener on the root that is removed on disconnect.
  protected listen(type: string, handler: (event: Event) => void, capture = false): void {
    this.addEventListener(type, handler, capture)
    this.#cleanup.push(() => this.removeEventListener(type, handler, capture))
  }

  protected onDestroy(stop: () => void): void {
    this.#cleanup.push(stop)
  }

  // Dispatches `<key>change` on the root. Returns false when a listener canceled it.
  protected change<T>(key: string, value: T, details: { reason: string; event?: Event }): boolean {
    const detail: ChangeDetail<T> = {
      value,
      reason: details.reason,
      source: sourceOf(details.event),
      event: details.event,
    }
    return this.dispatchEvent(new CustomEvent(`${key}change`, { detail, bubbles: false, cancelable: true }))
  }
}

function defineElement(tag: string, ctor: CustomElementConstructor): void {
  try {
    if (!customElements.get(tag)) customElements.define(tag, ctor)
  } catch (error) {
    console.error(`[ripple] ${tag} failed to define`, error)
  }
}

export { RippleElement, defineElement, type ChangeDetail }
