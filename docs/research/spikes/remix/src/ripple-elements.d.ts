// Custom element typings for the Remix 3 JSX runtime (jsxImportSource: "remix/component").
// The runtime declares a GLOBAL `JSX` namespace (remix/packages/component/src/runtime/core/vnode.ts),
// so tags are added by augmenting `JSX.IntrinsicElements` globally.
import type {} from 'remix/component'

type El = JSX.IntrinsicElements['span'] // HTMLProps<HTMLSpanElement>: class, id, hidden, role, aria-*, mix, children, ...

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ui-dialog': El & { open?: boolean; modal?: 'false'; dismissible?: 'false' }
      'ui-dialog-trigger': El & { for?: string }
      'ui-dialog-backdrop': El & { for?: string }
      'ui-dialog-content': El & { for?: string }
      'ui-dialog-title': El & { for?: string }
      'ui-dialog-description': El & { for?: string }
      'ui-dialog-close': El & { for?: string; value?: string }
      'ui-tabs': El
      'ui-tabs-list': El
      'ui-tabs-tab': El & { value: string }
      'ui-tabs-panel': El & { value: string }
      'rp-cart-form': El
      'rp-probe': El
    }
  }
}

// Event typing for `mix={on('openchange', handler)}`. Remix's on() reads the host's event map
// (same pattern as remix/docs/site/app/actions/guides/chapters/05-interactivity.md, "custom event mixin").
declare global {
  interface HTMLElementEventMap {
    openchange: CustomEvent<{ value: boolean; reason: string }>
    valuechange: CustomEvent<{ value: string; reason: string }>
  }
}
