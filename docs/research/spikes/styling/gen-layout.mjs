// Generates the layout-prop CSS for design A (attribute tokens) and design B (inline custom
// properties), writes them to out/, and prints raw / minified / gzip / brotli sizes.
// Usage: node gen-layout.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'
import { transform } from 'lightningcss'

export const BREAKPOINTS = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem', '2xl': '96rem' }
export const SPACE = ['0', '0.5', '1', '1.5', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32']
const sp = (v) => (v === '0' ? '0' : `calc(var(--spacing) * ${v})`)

// prop name -> { values: { token: declarations } }. Order of keys is the cascade order inside
// one breakpoint (shorthand before longhand, exactly like Tailwind's property sort).
const spacingProp = (decl) => Object.fromEntries(SPACE.map((v) => [v, decl(sp(v))]))
export const PROPS = {
  // --- core
  gap: spacingProp((v) => `gap:${v}`),
  'gap-x': spacingProp((v) => `column-gap:${v}`),
  'gap-y': spacingProp((v) => `row-gap:${v}`),
  p: spacingProp((v) => `padding:${v}`),
  px: spacingProp((v) => `padding-inline:${v}`),
  py: spacingProp((v) => `padding-block:${v}`),
  pt: spacingProp((v) => `padding-block-start:${v}`),
  pb: spacingProp((v) => `padding-block-end:${v}`),
  direction: { row: 'flex-direction:row', column: 'flex-direction:column' },
  wrap: { wrap: 'flex-wrap:wrap', nowrap: 'flex-wrap:nowrap' },
  align: {
    start: 'align-items:flex-start', center: 'align-items:center', end: 'align-items:flex-end',
    stretch: 'align-items:stretch', baseline: 'align-items:baseline',
  },
  justify: {
    start: 'justify-content:flex-start', center: 'justify-content:center', end: 'justify-content:flex-end',
    between: 'justify-content:space-between',
  },
  columns: Object.fromEntries(
    ['1', '2', '3', '4', '5', '6', '12'].map((n) => [n, `grid-template-columns:repeat(${n},minmax(0,1fr))`]),
  ),
  span: {
    ...Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((n) => [n, `grid-column:span ${n}/span ${n}`])),
    full: 'grid-column:1/-1',
  },
  hidden: { true: 'display:none', false: 'display:revert-layer' },
}
// Props that only make sense on a layout primitive are scoped to it. This also avoids the
// collision with UI SDK, which writes data-align="start|center|end" on positioned popup content
// (uisdk/packages/core/src/foundation/platform/position.ts). :where() keeps specificity at (0,1,0).
const FLEX = ':where(.rp-stack,.rp-inline,.rp-grid)'
export const SCOPE = { direction: ':where(.rp-stack,.rp-inline)', wrap: ':where(.rp-stack,.rp-inline)', align: FLEX, justify: FLEX, columns: ':where(.rp-grid)' }
const CORE = ['gap', 'p', 'px', 'py', 'direction', 'wrap', 'align', 'justify', 'columns', 'span', 'hidden']

export function designA(propNames = Object.keys(PROPS)) {
  const block = (prefix) =>
    propNames
      .flatMap((name) =>
        Object.entries(PROPS[name]).map(([tok, decl]) => `${SCOPE[name] ?? ''}[data-${name}~="${prefix}${tok}"]{${decl}}`),
      )
      .join('\n')
  let css = `@layer rp.props{\n${block('')}\n`
  for (const [bp, min] of Object.entries(BREAKPOINTS)) css += `@media (min-width:${min}){\n${block(bp + ':')}\n}\n`
  return css + '}\n'
}

// Design B: values travel as inline custom properties (style="--gap:2;--gap-md:6"), a presence
// attribute (data-gap) opts the element in. One rule per prop per breakpoint.
const B_PROPS = {
  gap: ['gap', 'calc(var(--spacing) * VAL)'], 'gap-x': ['column-gap', 'calc(var(--spacing) * VAL)'],
  'gap-y': ['row-gap', 'calc(var(--spacing) * VAL)'], p: ['padding', 'calc(var(--spacing) * VAL)'],
  px: ['padding-inline', 'calc(var(--spacing) * VAL)'], py: ['padding-block', 'calc(var(--spacing) * VAL)'],
  pt: ['padding-block-start', 'calc(var(--spacing) * VAL)'], pb: ['padding-block-end', 'calc(var(--spacing) * VAL)'],
  direction: ['flex-direction', 'VAL'], wrap: ['flex-wrap', 'VAL'], align: ['align-items', 'VAL'],
  justify: ['justify-content', 'VAL'], columns: ['grid-template-columns', 'repeat(VAL,minmax(0,1fr))'],
  span: ['grid-column', 'span VAL/span VAL'], hidden: ['display', 'VAL'],
}
export function designB(propNames = Object.keys(B_PROPS)) {
  const bps = Object.keys(BREAKPOINTS)
  let css = '@layer rp.props{\n'
  // Stop inline values leaking into nested layout elements (custom properties inherit).
  css += propNames.map((n) => `@property --_${n}{syntax:"*";inherits:false}`).join('\n') + '\n'
  for (const n of propNames) {
    const [prop, tpl] = B_PROPS[n]
    css += `[data-${n}]{--_${n}:var(--${n});${prop}:${tpl.replaceAll('VAL', `var(--_${n})`)}}\n`
  }
  bps.forEach((bp, i) => {
    css += `@media (min-width:${BREAKPOINTS[bp]}){\n`
    for (const n of propNames) {
      // nearest smaller breakpoint that is set wins: var(--gap-md, var(--gap-sm, var(--gap)))
      const chain = [...bps.slice(0, i + 1)].reverse().reduceRight((inner, b) => `var(--${n}-${b},${inner})`, `var(--${n})`)
      css += `[data-${n}]{--_${n}:${chain}}\n`
    }
    css += '}\n'
  })
  return css + '}\n'
}

export function sizes(css) {
  const min = transform({ filename: 'x.css', code: Buffer.from(css), minify: true }).code
  return {
    rules: (css.match(/\{[^{}]*\}/g) || []).length,
    raw: Buffer.byteLength(css),
    min: min.length,
    gzip: gzipSync(min, { level: 9 }).length,
    brotli: brotliCompressSync(min, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    minified: min.toString(),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(new URL('./out/', import.meta.url), { recursive: true })
  const rows = {
    'A full (15 props)': designA(),
    'A core (11 props: no gap-x/gap-y/pt/pb)': designA(CORE),
    'A spacing only (gap,p,px,py)': designA(['gap', 'p', 'px', 'py']),
    'B full (15 props)': designB(),
  }
  const table = {}
  for (const [k, css] of Object.entries(rows)) {
    const s = sizes(css)
    table[k] = { rules: s.rules, raw: s.raw, min: s.min, gzip: s.gzip, brotli: s.brotli }
    if (k.startsWith('A full')) { writeFileSync(new URL('./out/layout-a.css', import.meta.url), css); writeFileSync(new URL('./out/layout-a.min.css', import.meta.url), s.minified) }
    if (k.startsWith('B full')) { writeFileSync(new URL('./out/layout-b.css', import.meta.url), css); writeFileSync(new URL('./out/layout-b.min.css', import.meta.url), s.minified) }
  }
  console.table(table)
  // What does the minifier do to the quoted ~= values?
  const m = sizes(designA(['gap'])).minified
  console.log('minifier sample:', m.slice(0, 120), '...', m.match(/@media[^}]*\}/)[0])
}
