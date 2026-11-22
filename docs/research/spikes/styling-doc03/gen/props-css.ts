// Generates css/props.css from the text of tokens.css. No dependencies.
import { readScales } from "./tokens-source.ts"

/** Ordered list of [token, declaration]. */
type ValueMap = [string, string][]

interface PropRule {
  /** Attribute name without the data- prefix. */
  attr: string
  /** Selector prefix, or "" for unscoped props. Always a :where() so specificity stays (0,1,0). */
  scope: string
  /** Token to declaration. */
  values: ValueMap
}

const STACK_INLINE = ":where(.rp-stack, .rp-inline)"
const STACK_INLINE_GRID = ":where(.rp-stack, .rp-inline, .rp-grid)"
const GRID = ":where(.rp-grid)"
const TEXT = ":where(.rp-heading, .rp-text, .rp-stack)"

function space(steps: string[], property: string): ValueMap {
  return steps.map((step) => [
    step,
    step === "0" ? `${property}: 0` : `${property}: calc(var(--spacing) * ${step})`,
  ])
}

function numbered(values: string[], declaration: (n: string) => string): ValueMap {
  return values.map((value) => [value, declaration(value)])
}

/** The order of this array is the cascade order inside one breakpoint block. Do not reorder. */
export function propRules(spaceSteps: string[]): PropRule[] {
  return [
    { attr: "gap", scope: "", values: space(spaceSteps, "gap") },
    { attr: "gap-x", scope: "", values: space(spaceSteps, "column-gap") },
    { attr: "gap-y", scope: "", values: space(spaceSteps, "row-gap") },
    { attr: "p", scope: "", values: space(spaceSteps, "padding") },
    { attr: "px", scope: "", values: space(spaceSteps, "padding-inline") },
    { attr: "py", scope: "", values: space(spaceSteps, "padding-block") },
    { attr: "pt", scope: "", values: space(spaceSteps, "padding-block-start") },
    { attr: "pb", scope: "", values: space(spaceSteps, "padding-block-end") },
    {
      attr: "direction",
      scope: STACK_INLINE,
      values: [
        ["row", "flex-direction: row"],
        ["column", "flex-direction: column"],
      ],
    },
    {
      attr: "wrap",
      scope: STACK_INLINE,
      values: [
        ["wrap", "flex-wrap: wrap"],
        ["nowrap", "flex-wrap: nowrap"],
      ],
    },
    {
      attr: "align",
      scope: STACK_INLINE_GRID,
      values: [
        ["start", "align-items: flex-start"],
        ["center", "align-items: center"],
        ["end", "align-items: flex-end"],
        ["stretch", "align-items: stretch"],
        ["baseline", "align-items: baseline"],
      ],
    },
    {
      attr: "justify",
      scope: STACK_INLINE_GRID,
      values: [
        ["start", "justify-content: flex-start"],
        ["center", "justify-content: center"],
        ["end", "justify-content: flex-end"],
        ["between", "justify-content: space-between"],
      ],
    },
    {
      attr: "columns",
      scope: GRID,
      values: numbered(
        ["1", "2", "3", "4", "5", "6", "12"],
        (n) => `grid-template-columns: repeat(${n}, minmax(0, 1fr))`,
      ),
    },
    {
      attr: "text-align",
      scope: TEXT,
      values: [
        ["start", "text-align: start"],
        ["center", "text-align: center"],
        ["end", "text-align: end"],
      ],
    },
    {
      attr: "span",
      scope: "",
      values: [
        ...numbered(["1", "2", "3", "4", "5", "6"], (n) => `grid-column: span ${n} / span ${n}`),
        ["full", "grid-column: 1 / -1"],
      ],
    },
    {
      attr: "hidden",
      scope: "",
      values: [
        ["true", "display: none"],
        ["false", "display: revert-layer"],
      ],
    },
  ]
}

function block(rules: PropRule[], prefix: string, indent: string): string {
  const lines: string[] = []
  for (const rule of rules) {
    for (const [token, declaration] of rule.values) {
      lines.push(`${indent}${rule.scope}[data-${rule.attr}~="${prefix}${token}"] { ${declaration}; }`)
    }
  }
  return lines.join("\n")
}

export function generatePropsCss(tokensCss: string): string {
  const { breakpoints, spaceSteps } = readScales(tokensCss)
  const rules = propRules(spaceSteps)
  let css = "/* props.css. GENERATED from tokens.css by src/gen/props-css.ts. */\n"
  css += "@layer rp.props {\n"
  css += block(rules, "", "  ") + "\n"
  for (const [name, minWidth] of Object.entries(breakpoints)) {
    css += `  @media (min-width: ${minWidth}) {\n`
    css += block(rules, `${name}:`, "    ") + "\n"
    css += "  }\n"
  }
  css += "}\n"
  return css
}
