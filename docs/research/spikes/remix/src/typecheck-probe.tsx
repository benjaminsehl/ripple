import { clientEntry, on, ref, type Handle, type Props, type RemixNode } from 'remix/component'
import { Dialog } from './dialog.tsx'

// 1. Hyphenated attributes are never type-checked by TypeScript JSX; plain names are.
export function P(handle: Handle<{ children?: RemixNode } & Pick<Props<'button'>, 'class' | 'id'>>) {
  return () => (
    <>
      <button commandfor="x" command="show-modal">a</button>
      <ui-dialog id="x" default-open="" data-anything="1" mix={on('openchange', (event) => console.log(event.detail.value))}></ui-dialog>
      {/* @ts-expect-error unknown custom tag */}
      <ui-nope></ui-nope>
      {/* @ts-expect-error unknown non-hyphenated attribute on custom element */}
      <ui-dialog nope="1"></ui-dialog>
    </>
  )
}

// 2. Listening to element events from a client entry: wrap the binding, listen with a capture
//    listener on an ancestor (ui-sdk events do not bubble) or use ref() to reach the element.
export const SizeGuide = clientEntry(import.meta.url, function SizeGuide(handle: Handle<{ label: string }>) {
  let opened = 0
  return () => (
    <div mix={on('openchange', (event) => { if (event.detail.value) { opened++; handle.update() } }, true)}>
      <Dialog id="size-guide" trigger={handle.props.label} title="Size guide" description={`Opened ${opened} times`} />
      <button type="button" mix={on('click', () => { (document.getElementById('size-guide') as HTMLElement & { open: boolean }).open = true })}>Open from code</button>
      <span mix={ref((node, signal) => { signal.addEventListener('abort', () => console.log('removed', node)) })}></span>
    </div>
  )
})
