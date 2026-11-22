// Generates the two marker regions of css/base.css from the list of custom elements.

export interface ElementDisplay {
  /** Custom element tag, for example "rp-dialog" or "ui-tabs-panel". */
  tag: string
  /** Static display value. Only these two values are allowed. */
  display: "block" | "contents"
}

const INDENT = "  "

function rule(selector: string, declaration: string): string {
  return `${INDENT}${selector} {\n${INDENT}${INDENT}${declaration};\n${INDENT}}`
}

/** Body of the `display` region: one rule per display value, tags sorted by name. */
export function generateDisplayRegion(elements: ElementDisplay[]): string {
  const rules: string[] = []
  for (const display of ["contents", "block"] as const) {
    const tags = elements
      .filter((element) => element.display === display)
      .map((element) => element.tag)
      .sort()
    if (tags.length > 0) rules.push(rule(`:where(${tags.join(", ")})`, `display: ${display}`))
  }
  return rules.join("\n")
}

/** Body of the `script-state` region: three rules that name every rp-* tag, sorted by name. */
export function generateScriptStateRegion(elements: ElementDisplay[]): string {
  const tags = elements
    .map((element) => element.tag)
    .filter((tag) => tag.startsWith("rp-"))
    .sort()
  if (tags.length === 0) return ""
  const owners = `:where(${tags.join(", ")})`
  return [
    rule(`${owners}:not(:defined) [data-rp-js="inflow"]`, "visibility: hidden"),
    rule(`${owners}:not(:defined) [data-rp-js="overlay"]`, "display: none"),
    rule(`${owners}:defined [data-rp-js="fallback"]`, "display: none"),
  ].join("\n")
}

/** Replaces the text between the start and end markers of a region. Throws when a marker is missing. */
export function replaceRegion(css: string, name: string, body: string): string {
  const start = `${INDENT}/* ripple:start ${name} */\n`
  const end = `${INDENT}/* ripple:end ${name} */`
  const from = css.indexOf(start)
  const to = css.indexOf(end)
  if (from === -1 || to === -1 || to < from) throw new Error(`base.css: region "${name}" not found`)
  return css.slice(0, from + start.length) + (body === "" ? "" : body + "\n") + css.slice(to)
}

export function generateBaseCss(baseCss: string, elements: ElementDisplay[]): string {
  const withDisplay = replaceRegion(baseCss, "display", generateDisplayRegion(elements))
  return replaceRegion(withDisplay, "script-state", generateScriptStateRegion(elements))
}
