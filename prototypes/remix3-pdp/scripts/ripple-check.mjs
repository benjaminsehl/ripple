#!/usr/bin/env node
// Flags hand-rolled markup that has a Ripple equivalent, and off-token styling.
// usage: node scripts/ripple-check.mjs app/actions/**/*.tsx
import { readFileSync } from 'node:fs'

const RULES = [
  [/<button\b/g, 'raw <button>: use <Button>'],
  [/<h[1-6]\b/g, 'raw heading: use <Heading level size>'],
  [/<img\b/g, 'raw <img>: use <Media> / <ProductGallery> / <ProductCard>'],
  [/<details\b/g, 'raw <details>: use <Disclosure>'],
  [/<hr\b/g, 'raw <hr>: use <Divider>'],
  [/type=["']radio["']/g, 'radio input: use <VariantPicker>'],
  [/action=["'{][^>]*\/api\/cart/g, 'hand-rolled cart form: use <ProductForm> / <CartLines>'],
  [/toFixed\(|Intl\.NumberFormat|\$\$\{|`\$\{[^}]*(price|amount)/gi, 'money formatting: use <Price money>'],
  [/#[0-9a-fA-F]{3,8}\b(?![^<]*<\/)/g, 'hex color: use a token utility (bg-accent, text-muted, …)'],
  [/\b(?:bg|text|border|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?\b/g, 'palette color: use a token utility'],
  [/\bfont-(?:serif|sans|mono)\b/g, 'font family utility: use font-display / font-body'],
  [/\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g, 'radius utility: use rounded-rp / rounded-rp-lg'],
  [/style=\{\{[^}]*(?:color|background|font)/g, 'inline color/font style: use a token utility'],
]

let files = process.argv.slice(2)
let total = 0
for (let file of files) {
  let src = readFileSync(file, 'utf8')
  let lines = src.split('\n')
  let findings = []
  for (let [re, msg] of RULES) {
    for (let m of src.matchAll(re)) {
      let line = src.slice(0, m.index).split('\n').length
      if (/ripple-check-ignore/.test(lines[line - 1])) continue
      findings.push({ line, msg, text: lines[line - 1].trim().slice(0, 90) })
    }
  }
  let escapes = [...src.matchAll(/data-escape=(?:"([^"]*)"|'([^']*)'|\{[^}]*\})/g)].map((m) => m[1] ?? m[2] ?? 'expr')
  let rippleImports = (src.match(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*ripple/s)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  findings.sort((a, b) => a.line - b.line)
  console.log(`\n${file}`)
  console.log(`  Ripple components imported: ${rippleImports.length} (${rippleImports.join(', ')})`)
  console.log(`  Marked escape hatches: ${escapes.length}${escapes.length ? ` (${escapes.join('; ')})` : ''}`)
  console.log(`  Findings: ${findings.length}`)
  for (let f of findings) console.log(`   ${String(f.line).padStart(4)}  ${f.msg}\n         ${f.text}`)
  total += findings.length
}
process.exitCode = total ? 1 : 0
