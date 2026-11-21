import type { Handle, RemixNode } from 'remix/component'
import { cx } from './props.ts'

// Attributes the ui-sdk element owns after upgrade. Listed in data-rmx-preserve-attrs so Remix
// frame reloads / navigations do not overwrite live state (remix/packages/component/src/runtime/diff-dom.ts).
const TRIGGER_OWNED = 'aria-controls aria-expanded data-open data-closed'
const POPUP_OWNED =
  'hidden role id tabindex aria-modal aria-labelledby aria-describedby data-open data-closed data-presentation popover style'
const BACKDROP_OWNED = 'hidden role data-open data-closed popover style'

export interface DialogProps {
  /** Required. Root id; part ids derive from it. */
  id: string
  trigger: RemixNode
  title: RemixNode
  description?: RemixNode
  closeLabel?: string
  size?: 'sm' | 'md' | 'lg'
  /** spike only: which Remix preservation strategy to print */
  preserve?: 'none' | 'attrs' | 'dom'
  keyed?: boolean
  class?: string
  children?: RemixNode
}

export function Dialog(handle: Handle<DialogProps>) {
  return () => {
    let { id, trigger, title, description, closeLabel = 'Close', size = 'md', preserve = 'attrs', keyed = true, children } = handle.props
    let attrs = preserve === 'attrs'
    return (
      <ui-dialog id={id} class={cx('rp-dialog-root', handle.props.class)} data-rmx-key={keyed ? id : undefined} data-rmx-preserve-dom={preserve === 'dom' ? true : undefined}>
        <ui-dialog-trigger>
          <button type="button" class="rp-button" data-variant="secondary" data-size="md" id={`${id}-trigger`} aria-haspopup="dialog" data-closed="" data-slot="dialog-trigger" data-rmx-preserve-attrs={attrs ? TRIGGER_OWNED : undefined}>
            {trigger}
          </button>
        </ui-dialog-trigger>
        <ui-dialog-backdrop class="rp-dialog-backdrop" hidden data-slot="dialog-backdrop" data-rmx-preserve-attrs={attrs ? BACKDROP_OWNED : undefined}></ui-dialog-backdrop>
        <ui-dialog-content class="rp-dialog" data-size={size} hidden data-slot="dialog-content" data-rmx-preserve-attrs={attrs ? POPUP_OWNED : undefined}>
          <ui-dialog-title class="rp-dialog-title" id={`${id}-title`} role="heading" aria-level={2} data-slot="dialog-title">
            {title}
          </ui-dialog-title>
          {description != null && (
            <ui-dialog-description class="rp-dialog-description" id={`${id}-description`} role="paragraph" data-slot="dialog-description">
              {description}
            </ui-dialog-description>
          )}
          {children}
          <ui-dialog-close>
            <button type="button" class="rp-button" data-variant="ghost" data-size="md" data-slot="dialog-close">
              {closeLabel}
            </button>
          </ui-dialog-close>
        </ui-dialog-content>
      </ui-dialog>
    )
  }
}
