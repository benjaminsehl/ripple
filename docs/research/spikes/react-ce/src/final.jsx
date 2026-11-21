// Candidate React binding pattern (approach A). Bindings print the contract HTML and hand behavior to the ui-* element.
import * as React from "react"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
const { useRef, useEffect, useLayoutEffect, useState } = React
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/** Attach DOM listeners and assign live properties on a custom element. React 19 does neither during hydration. */
export function useElement(ref, { props = {}, events = {} }) {
  const latest = useRef(events)
  latest.current = events
  // 1. listeners: attached once per event name, always call the latest handler.
  const names = Object.keys(events).sort().join(",")
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const off = names.split(",").filter(Boolean).map((name) => {
      const fn = (e) => latest.current[name]?.(e)
      el.addEventListener(name, fn)
      return () => el.removeEventListener(name, fn)
    })
    return () => off.forEach((f) => f())
  }, [ref, names])
  // 2. live properties: only defined (controlled) values, only after the element class is defined.
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let live = true
    const assign = () => { if (live) for (const [k, v] of Object.entries(props)) if (v !== undefined && el[k] !== v) el[k] = v }
    if (customElements.get(el.localName)) assign()
    else customElements.whenDefined(el.localName).then(assign)
    return () => { live = false }
  })
}

/** Tabs. `value` controlled, `defaultValue` uncontrolled. State attributes are printed from the INITIAL value only. */
export function Tabs({ id, value, defaultValue, onValueChange, label, items }) {
  const ref = useRef(null)
  const controlled = value !== undefined
  const [initial] = useState(() => value ?? defaultValue ?? items[0].value)
  useElement(ref, {
    props: { value },
    events: {
      valuechange: (e) => {
        if (controlled) e.preventDefault() // the element stays put until the `value` prop changes
        onValueChange?.(e.detail.value, e.detail)
      },
    },
  })
  return (
    <ui-tabs ref={ref} id={id} class="rp-tabs" default-value={initial} data-slot="tabs" data-orientation="horizontal" data-activation-direction="none" suppressHydrationWarning>
      <ui-tabs-list aria-label={label} class="rp-tabs-list" data-slot="tabs-list" role="tablist" data-orientation="horizontal" data-activation-direction="none" suppressHydrationWarning>
        {items.map((it) => {
          const sel = it.value === initial
          return (
            <ui-tabs-tab key={it.value} value={it.value} role="none" suppressHydrationWarning>
              <button type="button" className="rp-tabs-tab" data-slot="tabs-tab" role="tab" id={`${id}-tab-${it.value}`} tabIndex={sel ? 0 : -1} aria-selected={sel ? "true" : "false"} data-selected={sel ? "" : null} data-orientation="horizontal" data-activation-direction="none" aria-controls={sel ? `${id}-panel-${it.value}` : null} suppressHydrationWarning>{it.label}</button>
            </ui-tabs-tab>
          )
        })}
      </ui-tabs-list>
      {items.map((it) => it.value === initial
        ? <ui-tabs-panel key={it.value} value={it.value} class="rp-tabs-panel" data-slot="tabs-panel" role="tabpanel" id={`${id}-panel-${it.value}`} aria-labelledby={`${id}-tab-${it.value}`} data-selected="" data-orientation="horizontal" data-activation-direction="none" tabindex="0" suppressHydrationWarning>{it.content}</ui-tabs-panel>
        : <ui-tabs-panel key={it.value} value={it.value} class="rp-tabs-panel" hidden="" data-slot="tabs-panel" suppressHydrationWarning>{it.content}</ui-tabs-panel>)}
    </ui-tabs>
  )
}

/** Dialog. `open` controlled, `defaultOpen` uncontrolled. Closed-state contract HTML. */
export function Dialog({ id, open, defaultOpen, onOpenChange, trigger, title, description, children }) {
  const ref = useRef(null)
  const controlled = open !== undefined
  useElement(ref, {
    props: { open },
    events: { openchange: (e) => { if (controlled) e.preventDefault(); onOpenChange?.(e.detail.value, e.detail) } },
  })
  return (
    <ui-dialog ref={ref} id={id} default-open={defaultOpen ? "" : null} suppressHydrationWarning>
      <ui-dialog-trigger suppressHydrationWarning><button type="button" className="rp-button" data-slot="dialog-trigger" id={`${id}-trigger`} aria-haspopup="dialog" data-closed="" suppressHydrationWarning>{trigger}</button></ui-dialog-trigger>
      <ui-dialog-backdrop class="rp-dialog-backdrop" hidden="" data-slot="dialog-backdrop" suppressHydrationWarning></ui-dialog-backdrop>
      <ui-dialog-content class="rp-dialog" hidden="" data-slot="dialog-content" suppressHydrationWarning>
        <ui-dialog-title role="heading" aria-level="2" data-slot="dialog-title" id={`${id}-title`} suppressHydrationWarning>{title}</ui-dialog-title>
        <ui-dialog-description role="paragraph" data-slot="dialog-description" id={`${id}-description`} suppressHydrationWarning>{description}</ui-dialog-description>
        {children}
        <ui-dialog-close suppressHydrationWarning><button type="button" className="rp-button" data-slot="dialog-close" suppressHydrationWarning>Close</button></ui-dialog-close>
      </ui-dialog-content>
    </ui-dialog>
  )
}

const ITEMS = [{ value: "account", label: "Account", content: "Account panel" }, { value: "password", label: "Password", content: "Password panel" }]
function App({ mode }) {
  const [tab, setTab] = useState("account")
  const [open, setOpen] = useState(false)
  const [reject, setReject] = useState(false)
  const [n, setN] = useState(0)
  useEffect(() => { window.__app = { setTab, setOpen, setReject, setN }; window.__hydrated = true }, [])
  const log = (s) => (window.__log ||= []).push(s)
  const items = n ? [...ITEMS, { value: "extra", label: "Extra", content: `Extra panel ${n}` }] : ITEMS
  return mode === "controlled" ? (
    <React.StrictMode><div data-n={n}>
      <Tabs id="tabs" label="Settings" items={items} value={tab} onValueChange={(v) => { log("tabs->" + v); if (!reject) setTab(v) }} />
      <Dialog id="dlg" trigger="Edit" title="Profile" description={`Make changes ${n}`} open={open} onOpenChange={(v) => { log("dlg->" + v); if (!reject) setOpen(v) }} />
    </div></React.StrictMode>
  ) : (
    <React.StrictMode><div data-n={n}>
      <Tabs id="tabs" label="Settings" items={items} defaultValue="account" onValueChange={(v) => log("tabs->" + v)} />
      <Dialog id="dlg" trigger="Edit" title="Profile" description={`Make changes ${n}`} onOpenChange={(v) => log("dlg->" + v)} />
    </div></React.StrictMode>
  )
}
export const ssr = (mode) => renderToString(<App mode={mode} />)
if (typeof window !== "undefined") window.__hydrateF = (mode) => hydrateRoot(document.getElementById("root"), <App mode={mode} />, { onRecoverableError: (e) => console.error("RECOVERABLE " + e.message.slice(0, 200)) })
