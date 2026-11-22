// Reads scale inputs from the text of tokens.css. No dependencies.

export interface Scales {
  /** Breakpoint name to min-width, ascending by width. Example: { sm: "40rem" }. */
  breakpoints: Record<string, string>
  /** Space steps as written in --rp-space-steps. Example: ["0", "0.5", "1"]. */
  spaceSteps: string[]
}

export interface Declaration {
  name: string
  value: string
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

function toRem(length: string): number {
  const match = /^([0-9.]+)(rem|px)$/.exec(length)
  if (!match) throw new Error(`tokens.css: breakpoint value "${length}" must be in rem or px`)
  return match[2] === "rem" ? Number(match[1]) : Number(match[1]) / 16
}

export function readScales(tokensCss: string): Scales {
  const css = stripComments(tokensCss)
  const found: [string, string][] = []
  for (const match of css.matchAll(/--breakpoint-([a-z0-9]+)\s*:\s*([^;]+);/g)) {
    found.push([match[1], match[2].trim()])
  }
  if (found.length === 0) throw new Error("tokens.css: no --breakpoint-* declaration found")
  found.sort((a, b) => toRem(a[1]) - toRem(b[1]))
  const steps = /--rp-space-steps\s*:\s*([^;]+);/.exec(css)
  if (!steps) throw new Error("tokens.css: --rp-space-steps not found")
  const spaceSteps = steps[1].trim().split(/\s+/)
  for (const step of spaceSteps) {
    if (!/^[0-9]+(\.[0-9]+)?$/.test(step)) throw new Error(`tokens.css: invalid space step "${step}"`)
  }
  return { breakpoints: Object.fromEntries(found), spaceSteps }
}

/**
 * Returns the declarations of every style rule inside `@layer rp.tokens` that is NOT inside
 * `@supports` or `@media`, in source order.
 */
export function readStaticDeclarations(tokensCss: string): Declaration[] {
  const css = stripComments(tokensCss)
  const out: Declaration[] = []
  const stack: string[] = []
  let prelude = ""
  let body = ""
  for (const char of css) {
    if (char === "{") {
      stack.push(prelude.trim())
      prelude = ""
      body = ""
    } else if (char === "}") {
      const own = stack.pop() ?? ""
      const conditional = stack.some((p) => p.startsWith("@supports") || p.startsWith("@media"))
      if (!own.startsWith("@") && !conditional) {
        for (const match of body.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)) {
          out.push({ name: match[1], value: match[2].replace(/\s+/g, " ").trim() })
        }
      }
      prelude = ""
      body = ""
    } else {
      prelude += char
      body += char
    }
  }
  return out
}
