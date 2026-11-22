// Ripple behaviors: tiny light-DOM custom elements that enhance server-rendered HTML.
// Framework-agnostic on purpose (the same file would ship in a Liquid theme).
// Everything they enhance already works without this file.

const CART_CHANGED = 'rp:cart-changed'

// <rp-gallery>: thumbnails scroll the track instead of jumping the page; tracks the active slide.
class RpGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.rp-gallery-track')
    this.thumbs = [...this.querySelectorAll('.rp-gallery-thumb')]
    this.index = this.querySelector('[data-rp-gallery-index]')
    this.thumbs.forEach((thumb, i) =>
      thumb.addEventListener('click', (e) => {
        e.preventDefault()
        this.track.scrollTo({ left: i * this.track.clientWidth, behavior: 'smooth' })
      }),
    )
    this.track?.addEventListener('scroll', () => this.sync(), { passive: true })
    this.track?.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      this.track.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * this.track.clientWidth, behavior: 'smooth' })
    })
  }
  sync() {
    let i = Math.round(this.track.scrollLeft / this.track.clientWidth)
    this.thumbs.forEach((t, j) => t.setAttribute('aria-current', String(i === j)))
    if (this.index) this.index.textContent = String(i + 1)
    this.thumbs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

// <rp-quantity>: +/- buttons for a quantity input (hidden until this element is defined).
class RpQuantity extends HTMLElement {
  connectedCallback() {
    let input = this.querySelector('input')
    this.addEventListener('click', (e) => {
      let step = e.target.closest('[data-step]')
      if (!step || !input) return
      let min = Number(input.dataset.min ?? 1)
      input.value = String(Math.max(min, (Number(input.value) || min) + Number(step.dataset.step)))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
}

// <rp-product-form>: option changes apply immediately; add to cart posts in the background.
class RpProductForm extends HTMLElement {
  connectedCallback() {
    let form = this.querySelector('form')
    if (!form) return
    form.addEventListener('change', (e) => {
      if (e.target.type !== 'radio') return
      // Same request the no-JS "Update selection" button makes. Remix turns it into a
      // client navigation that reconciles the page in place.
      form.requestSubmit(form.querySelector('.rp-picker-update'))
    })
    form.addEventListener('submit', async (e) => {
      let submitter = e.submitter
      if (!submitter?.hasAttribute('data-rp-add')) return
      e.preventDefault()
      let status = form.querySelector('[data-rp-add-status]')
      submitter.setAttribute('data-pending', '')
      submitter.setAttribute('aria-disabled', 'true')
      try {
        let body = new FormData(form, submitter)
        let res = await fetch(form.action, { method: 'POST', body, redirect: 'manual' })
        if (!res.ok && res.type !== 'opaqueredirect') throw new Error(String(res.status))
        if (status) status.textContent = 'Added to cart'
        document.dispatchEvent(new CustomEvent(CART_CHANGED, { detail: { open: true } }))
      } catch {
        if (status) status.textContent = 'Could not add to cart. Try again.'
        form.submit() // fall back to the plain form post
      } finally {
        submitter.removeAttribute('data-pending')
        submitter.removeAttribute('aria-disabled')
      }
    })
  }
}

// <rp-cart-drawer>: wraps a <dialog>. Refreshes its panel from data-src after cart changes.
class RpCartDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog')
    this.onChanged = (e) => this.refresh(e.detail?.open)
    document.addEventListener(CART_CHANGED, this.onChanged)
    this.onOpenClick = (e) => {
      let link = e.target.closest?.('[data-rp-cart-open]')
      if (!link || e.metaKey || e.ctrlKey) return
      e.preventDefault()
      this.open()
    }
    document.addEventListener('click', this.onOpenClick)
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog || e.target.closest('[data-rp-drawer-close]')) this.dialog.close()
    })
    // Line forms inside the drawer post in the background, then refresh.
    this.dialog.addEventListener('submit', async (e) => {
      let form = e.target.closest('form[data-rp-cart-form]')
      if (!form) return
      e.preventDefault()
      form.setAttribute('aria-busy', 'true')
      await fetch(form.action, { method: 'POST', body: new FormData(form, e.submitter), redirect: 'manual' })
      document.dispatchEvent(new CustomEvent(CART_CHANGED))
    })
    this.dialog.addEventListener('change', (e) => {
      if (e.target.name === 'quantity') e.target.form?.requestSubmit()
    })
  }
  disconnectedCallback() {
    document.removeEventListener(CART_CHANGED, this.onChanged)
    document.removeEventListener('click', this.onOpenClick)
  }
  open() {
    if (!this.dialog.open) this.dialog.showModal()
  }
  async refresh(open) {
    let res = await fetch(this.dataset.src, { headers: { accept: 'text/html' } })
    let html = await res.text()
    let tpl = document.createElement('template')
    tpl.innerHTML = html
    let panel = tpl.content.querySelector('[data-rp-cart-panel]')
    if (panel) {
      this.dialog.querySelector('[data-rp-cart-panel]')?.replaceWith(panel)
      let count = panel.dataset.count ?? '0'
      document.querySelectorAll('[data-rp-cart-count]').forEach((el) => {
        el.textContent = count === '0' ? '' : count
        el.dataset.count = count
        el.closest('[data-rp-cart-open]')?.setAttribute('aria-label', `Cart, ${count} items`)
      })
    }
    if (open) this.open()
  }
}

for (let [name, el] of [
  ['rp-gallery', RpGallery],
  ['rp-quantity', RpQuantity],
  ['rp-product-form', RpProductForm],
  ['rp-cart-drawer', RpCartDrawer],
]) {
  if (!customElements.get(name)) customElements.define(name, el)
}
