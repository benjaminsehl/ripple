import * as React from "react"
import { renderToString } from "react-dom/server"
import { hydrateRoot, createRoot } from "react-dom/client"
export function P({ step }) {
  const on = step === 0
  return (
    <div>
      <x-probe id={on ? "a" : undefined} str="s" num={3} t={true} f={false} obj={{ a: 1 }} arr={["x", "y"]} fn={() => 1}
        className="c1" htmlFor="hf" tabIndex={on ? 0 : undefined} hidden={on} title={on ? "T" : undefined} role={on ? "group" : undefined}
        data-x={on ? "1" : undefined} aria-label={on ? "L" : null} live={on ? "v0" : "v1"} liveObj={{ step }} gone={on ? "here" : undefined} goneNull={on ? "here" : null}
        style={{ color: "red", "--v": 1 }}
        onfoo={() => window.__ev.push("onfoo")} onFoo={() => window.__ev.push("onFoo")} onfooCapture={() => window.__ev.push("onfooCapture")} on-foo={() => window.__ev.push("on-foo")} onClick={() => window.__ev.push("onClick")}>
        text
      </x-probe>
    </div>
  )
}
export const ssr = () => renderToString(<P step={0} />)
if (typeof window !== "undefined") {
  window.__ev = []
  window.__defineProbe = () => {
    class Probe extends HTMLElement {
      set live(v) { (this.__sets ||= []).push("live=" + v) } get live() { return 1 }
      set liveObj(v) { (this.__sets ||= []).push("liveObj=" + JSON.stringify(v)) } get liveObj() { return 1 }
      set obj(v) { (this.__sets ||= []).push("obj=" + JSON.stringify(v)) } get obj() { return 1 }
      set arr(v) { (this.__sets ||= []).push("arr=" + JSON.stringify(v)) } get arr() { return 1 }
      set gone(v) { (this.__sets ||= []).push("gone=" + String(v)) } get gone() { return 1 }
      set goneNull(v) { (this.__sets ||= []).push("goneNull=" + String(v)) } get goneNull() { return 1 }
    }
    customElements.define("x-probe", Probe)
  }
  let root
  window.__hydrateP = () => { root = hydrateRoot(document.getElementById("root"), <P step={0} />) }
  window.__mountP = () => { root = createRoot(document.getElementById("root")); root.render(<P step={0} />) }
  window.__step = (n) => root.render(<P step={n} />)
}
