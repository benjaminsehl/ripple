import * as React from "react"
const { useState, useEffect } = React
const log = (...a) => { if (typeof window !== "undefined") (window.__log ||= []).push(a.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" ")) }

// --- Variant "min": author markup only, no ARIA. Uncontrolled.
function TabsMin({ label, extra, text }) {
  return (
    <ui-tabs id="tabs" default-value="account" onvaluechange={(e) => log("valuechange", e.detail.value, e.detail.reason)} onValueChange={(e) => log("CamelValueChange", e.detail.value)}>
      <ui-tabs-list aria-label={label}>
        <ui-tabs-tab value="account"><button type="button">Account</button></ui-tabs-tab>
        <ui-tabs-tab value="password"><button type="button">Password</button></ui-tabs-tab>
        {extra ? <ui-tabs-tab value="extra"><button type="button">Extra</button></ui-tabs-tab> : null}
      </ui-tabs-list>
      <ui-tabs-panel value="account">Account panel {text}</ui-tabs-panel>
      <ui-tabs-panel value="password">Password panel {text}</ui-tabs-panel>
      {extra ? <ui-tabs-panel value="extra">Extra panel</ui-tabs-panel> : null}
    </ui-tabs>
  )
}

// --- Variant "static": binding prints the full contract HTML for the INITIAL state (uncontrolled), then never re-derives it.
function Tab({ v, sel, children, cls }) {
  return (
    <ui-tabs-tab value={v} role="none">
      <button type="button" className={cls} data-slot="tabs-tab" role="tab" id={`t-tab-${v}`} tabIndex={sel ? 0 : -1} aria-selected={sel ? "true" : "false"} data-selected={sel ? "" : undefined} data-orientation="horizontal" data-activation-direction="none" aria-controls={sel ? `t-panel-${v}` : undefined}>{children}</button>
    </ui-tabs-tab>
  )
}
function Panel({ v, sel, children }) {
  return sel
    ? <ui-tabs-panel value={v} data-slot="tabs-panel" role="tabpanel" id={`t-panel-${v}`} aria-labelledby={`t-tab-${v}`} data-selected="" data-orientation="horizontal" data-activation-direction="none" tabIndex={0}>{children}</ui-tabs-panel>
    : <ui-tabs-panel value={v} hidden data-slot="tabs-panel">{children}</ui-tabs-panel>
}
function TabsStatic({ label, extra, text, cls, controlled, tab, setTab }) {
  const cur = controlled ? tab : "account"
  const rootProps = controlled ? { value: tab } : { "default-value": "account" }
  return (
    <ui-tabs id="tabs" {...rootProps} data-slot="tabs" data-orientation="horizontal" data-activation-direction="none"
      onvaluechange={(e) => { log("valuechange", e.detail.value, e.detail.reason); if (controlled) setTab(e.detail.value) }}>
      <ui-tabs-list aria-label={label} data-slot="tabs-list" role="tablist" data-orientation="horizontal" data-activation-direction="none">
        <Tab v="account" sel={cur === "account"} cls={cls}>Account</Tab>
        <Tab v="password" sel={cur === "password"} cls={cls}>Password</Tab>
        {extra ? <Tab v="extra" sel={cur === "extra"} cls={cls}>Extra</Tab> : null}
      </ui-tabs-list>
      <Panel v="account" sel={cur === "account"}>Account panel {text}</Panel>
      <Panel v="password" sel={cur === "password"}>Password panel {text}</Panel>
      {extra ? <Panel v="extra" sel={cur === "extra"}>Extra panel</Panel> : null}
    </ui-tabs>
  )
}

function AccordionMin({ value, text }) {
  // value as array prop (object) to see SSR/client handling; default-value as string attr.
  return (
    <ui-accordion id="acc" default-value="shipping" value={value} onvaluechange={(e) => log("acc.valuechange", e.detail.value)}>
      <ui-accordion-item value="shipping" onopenchange={(e) => log("item.openchange", e.detail.value)}>
        <ui-accordion-header><h3><ui-accordion-trigger><button type="button">Shipping</button></ui-accordion-trigger></h3></ui-accordion-header>
        <ui-accordion-panel>Ships in 2 days {text}</ui-accordion-panel>
      </ui-accordion-item>
      <ui-accordion-item value="returns">
        <ui-accordion-header><h3><ui-accordion-trigger><button type="button">Returns</button></ui-accordion-trigger></h3></ui-accordion-header>
        <ui-accordion-panel>30 days {text}</ui-accordion-panel>
      </ui-accordion-item>
    </ui-accordion>
  )
}

function DialogMin({ open, setOpen, text, full }) {
  const props = open === undefined ? {} : { open }
  const hid = full ? { hidden: true } : {}
  return (
    <ui-dialog id="dlg" {...props} onopenchange={(e) => { log("openchange", e.detail.value, e.detail.reason); setOpen && setOpen(e.detail.value) }}>
      <ui-dialog-trigger><button type="button" id="dlg-trigger">Edit</button></ui-dialog-trigger>
      <ui-dialog-backdrop {...hid}></ui-dialog-backdrop>
      <ui-dialog-content {...hid}>
        <ui-dialog-title>Profile</ui-dialog-title>
        <ui-dialog-description>Make changes. {text}</ui-dialog-description>
        <ui-dialog-close><button type="button" id="dlg-close">Close</button></ui-dialog-close>
      </ui-dialog-content>
    </ui-dialog>
  )
}

export function App({ variant }) {
  const [s, set] = useState({ label: "Settings", extra: false, text: "v1", cls: "a", tab: "account", open: variant.includes("ctl") ? false : undefined, acc: undefined, tick: 0 })
  useEffect(() => { window.__set = (patch) => set((p) => ({ ...p, ...patch })); window.__hydrated = true }, [])
  const setTab = (tab) => set((p) => ({ ...p, tab }))
  const setOpen = variant.includes("ctl") ? (open) => set((p) => ({ ...p, open })) : undefined
  return (
    <div data-tick={s.tick}>
      {variant.startsWith("min") ? <TabsMin {...s} /> : <TabsStatic {...s} controlled={variant.includes("ctl")} setTab={setTab} />}
      <AccordionMin value={s.acc} text={s.text} />
      <DialogMin open={s.open} setOpen={setOpen} text={s.text} full={!variant.startsWith("min")} />
    </div>
  )
}
