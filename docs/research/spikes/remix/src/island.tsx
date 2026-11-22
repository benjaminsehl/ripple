import { clientEntry, on, type Handle } from 'remix/component'
import { Dialog } from './dialog.tsx'
import { Tabs } from './tabs.tsx'

// A Remix client entry that renders Ripple bindings inside it and re-renders around them.
export const Island = clientEntry('/entry.js#Island', function Island(handle: Handle<{ label: string }>) {
  let count = 0
  let showExtra = false
  return () => (
    <div id="island">
      <button id="inc" type="button" mix={on('click', () => { count++; handle.update() })}>
        {handle.props.label} {String(count)}
      </button>
      <button id="toggle" type="button" mix={on('click', () => { showExtra = !showExtra; handle.update() })}>toggle</button>
      <Dialog id="idlg" trigger="Open island dialog" title="Island" description={`count ${count}`} preserve="attrs" />
      {showExtra && <Tabs id="itabs" label="client rendered" items={[{ value: 'a', label: 'A', content: 'pa' }, { value: 'b', label: 'B', content: 'pb' }]} />}
      {showExtra && <Dialog id="cdlg" trigger="client dialog" title="Client" description="made on client" />}
    </div>
  )
})
