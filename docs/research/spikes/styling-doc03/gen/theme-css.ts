// Generates css/theme.css (a Tailwind v4 `@theme reference` block) from the text of tokens.css.
import { readStaticDeclarations } from "./tokens-source.ts"

const TAILWIND_NAMESPACE =
  /^--(color|spacing|radius|text|font|font-weight|shadow|ease|container|breakpoint)(-|$)/

/** Ripple tokens with no Tailwind namespace of their own, exposed under a Tailwind theme key. */
const ALIASES: [string, string][] = [
  ["--z-index-raised", "--rp-z-raised"],
  ["--z-index-sticky", "--rp-z-sticky"],
  ["--z-index-overlay", "--rp-z-overlay"],
  ["--z-index-toast", "--rp-z-toast"],
  ["--transition-duration-fast", "--rp-duration-fast"],
  ["--transition-duration-base", "--rp-duration-base"],
  ["--transition-duration-slow", "--rp-duration-slow"],
]

export function generateThemeCss(tokensCss: string): string {
  const seen = new Set<string>()
  const lines: string[] = []
  for (const { name, value } of readStaticDeclarations(tokensCss)) {
    if (!TAILWIND_NAMESPACE.test(name) || seen.has(name)) continue
    if (value === "initial") throw new Error(`tokens.css: ${name} must not be "initial"`)
    seen.add(name)
    lines.push(`  ${name}: ${value};`)
  }
  for (const [alias, source] of ALIASES) lines.push(`  ${alias}: var(${source});`)
  return (
    "/* theme.css. GENERATED from tokens.css by src/gen/theme-css.ts. Tailwind only. */\n" +
    "@theme reference {\n" +
    lines.join("\n") +
    "\n}\n"
  )
}
