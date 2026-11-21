import type { Handle, RemixNode } from 'remix/component'

export interface TabsProps {
  id: string
  label: string
  defaultValue?: string
  items: Array<{ value: string; label: RemixNode; content: RemixNode }>
  preserve?: 'none' | 'attrs' | 'dom'
}
const TAB_OWNED = 'tabindex aria-selected aria-controls data-selected'
const PANEL_OWNED = 'hidden role id aria-labelledby data-selected data-orientation data-activation-direction tabindex'

export function Tabs(handle: Handle<TabsProps>) {
  return () => {
    let { id, label, items, preserve = 'attrs' } = handle.props
    let initial = handle.props.defaultValue ?? items[0].value
    let attrs = preserve === 'attrs'
    return (
      <ui-tabs id={id} class="rp-tabs" default-value={initial} data-slot="tabs" data-orientation="horizontal" data-activation-direction="none" data-rmx-key={id} data-rmx-preserve-dom={preserve === 'dom' ? true : undefined} data-rmx-preserve-attrs={attrs ? 'data-activation-direction' : undefined}>
        <ui-tabs-list class="rp-tabs-list" aria-label={label} role="tablist" data-slot="tabs-list" data-orientation="horizontal" data-activation-direction="none" data-rmx-preserve-attrs={attrs ? 'data-activation-direction' : undefined}>
          {items.map((it) => {
            let sel = it.value === initial
            return (
              <ui-tabs-tab key={it.value} value={it.value} role="none">
                <button type="button" class="rp-tabs-tab" data-slot="tabs-tab" role="tab" id={`${id}-tab-${it.value}`} tabIndex={sel ? 0 : -1} aria-selected={sel ? 'true' : 'false'} data-selected={sel ? '' : undefined} data-orientation="horizontal" data-activation-direction="none" aria-controls={sel ? `${id}-panel-${it.value}` : undefined} data-rmx-preserve-attrs={attrs ? TAB_OWNED + ' data-activation-direction' : undefined}>
                  {it.label}
                </button>
              </ui-tabs-tab>
            )
          })}
        </ui-tabs-list>
        {items.map((it) =>
          it.value === initial ? (
            <ui-tabs-panel key={it.value} value={it.value} class="rp-tabs-panel" data-slot="tabs-panel" role="tabpanel" id={`${id}-panel-${it.value}`} aria-labelledby={`${id}-tab-${it.value}`} data-selected="" data-orientation="horizontal" data-activation-direction="none" tabIndex={0} data-rmx-preserve-attrs={attrs ? PANEL_OWNED : undefined}>
              {it.content}
            </ui-tabs-panel>
          ) : (
            <ui-tabs-panel key={it.value} value={it.value} class="rp-tabs-panel" hidden data-slot="tabs-panel" data-rmx-preserve-attrs={attrs ? PANEL_OWNED : undefined}>
              {it.content}
            </ui-tabs-panel>
          ),
        )}
      </ui-tabs>
    )
  }
}
