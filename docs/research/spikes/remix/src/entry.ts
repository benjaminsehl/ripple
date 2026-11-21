import { run } from 'remix/component'
import '@ui-sdk/web/dialog'
import '@ui-sdk/web/tabs'
import { Island } from './island.tsx'

let log: string[] = ((window as any).__log = [])
class Probe extends HTMLElement {
  static observedAttributes = ['data-n']
  connectedCallback() { log.push('probe:connected') }
  disconnectedCallback() { log.push('probe:disconnected') }
  attributeChangedCallback(n: string, o: string | null, v: string | null) { log.push(`probe:attr ${n} ${o}->${v}`) }
}
customElements.define('rp-probe', Probe)

if (!new URL(import.meta.url).searchParams.has('norp')) {
  // Stand-in for Ripple's commerce element: owns the submit, would call cartStore.handleFormSubmit(event).
  customElements.define('rp-cart-form', class extends HTMLElement {
    connectedCallback() {
      log.push('cart-form:connected')
      this.addEventListener('submit', (event) => {
        event.preventDefault()
        log.push('cart-form:submit intent=' + ((event as SubmitEvent).submitter as HTMLButtonElement)?.value)
      })
    }
    disconnectedCallback() { log.push('cart-form:disconnected') }
  })
}
for (let tag of ['ui-dialog', 'ui-tabs']) {
  let C = customElements.get(tag)!
  let dc = C.prototype.disconnectedCallback, cc = C.prototype.connectedCallback
  C.prototype.disconnectedCallback = function () { log.push(`${tag}#${this.id}:disconnected`); return dc?.call(this) }
  C.prototype.connectedCallback = function () { log.push(`${tag}#${this.id}:connected`); return cc?.call(this) }
}

if (new URL(import.meta.url).searchParams.has('con')) {
  // Candidate Ripple rule: close modal overlays when a same-document navigation starts.
  ;(window as any).navigation?.addEventListener('navigate', () => {
    for (let el of document.querySelectorAll<HTMLElement & { open: boolean }>('ui-dialog, ui-drawer')) if (el.open) el.open = false
  })
}
if (new URL(import.meta.url).searchParams.has('pre')) {
  // Simulate a visitor opening the dialog after elements upgraded but before Remix hydrates.
  ;(document.querySelector('#idlg') as any).open = true
  await new Promise((r) => setTimeout(r, 100))
  ;(window as any).__pre = document.querySelector('#idlg ui-dialog-content')!.outerHTML.split('>')[0]
}
let app = run({ async loadModule(_url, name) { if (name === 'Island') return Island; throw new Error('unknown ' + name) } })
app.addEventListener('error', (e: any) => log.push('app-error:' + e.error))
;(window as any).__app = app
await app.ready()
;(window as any).__ready = true
