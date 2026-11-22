// Invoker Commands fallback (00-decisions D-008 item 3). Ported from
// ripple/theme/snippets/command-polyfill.liquid.
type CommandEventLike = Event & { command: string; source: Element }

declare global {
  interface Window {
    rpCommandsPolyfill?: boolean
  }
}

function runCommand(target: HTMLElement, command: string): void {
  if (command === "show-modal") {
    if (target instanceof HTMLDialogElement && !target.open) target.showModal()
  } else if (command === "close") {
    if (target instanceof HTMLDialogElement && target.open) target.close()
  } else if (command === "show-popover") {
    if (target.popover && !target.matches(":popover-open")) target.showPopover()
  } else if (command === "hide-popover") {
    if (target.popover && target.matches(":popover-open")) target.hidePopover()
  } else if (command === "toggle-popover") {
    if (target.popover) target.togglePopover()
  }
}

function installCommandsPolyfill(): void {
  if (typeof document === "undefined") return
  if ("commandForElement" in HTMLButtonElement.prototype) return
  if (window.rpCommandsPolyfill) return
  window.rpCommandsPolyfill = true
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return
    const origin = event.target instanceof Element ? event.target : null
    const button = origin?.closest<HTMLButtonElement>("button[commandfor]")
    if (!button || button.disabled) return
    const target = document.getElementById(button.getAttribute("commandfor") ?? "")
    if (!target) return
    const command = button.getAttribute("command") ?? ""
    const commandEvent = Object.assign(new Event("command", { bubbles: false, cancelable: true }), {
      command,
      source: button,
    }) as CommandEventLike
    if (!target.dispatchEvent(commandEvent)) return
    if (!command.startsWith("--")) runCommand(target, command)
  })
}

export { installCommandsPolyfill }
