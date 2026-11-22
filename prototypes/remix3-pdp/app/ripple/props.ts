// Shared prop scales. Every spacing/size prop in Ripple takes a value from these scales,
// optionally per breakpoint: gap={4} or gap={{ base: 4, md: 8 }}.

export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
export type Breakpoint = 'base' | 'sm' | 'md' | 'lg'
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>

/** Any extra HTML attribute (class, id, aria-*, data-*, style) passes through to the root element. */
export type Passthrough = { class?: string; style?: Record<string, string | number | undefined>; [attr: string]: any }

export function cx(...parts: unknown[]): string | undefined {
  let s = parts.filter((p) => typeof p === 'string' && p.length > 0).join(' ')
  return s || undefined
}

/** Turns gap={{ base: 2, md: 6 }} into { '--gap': 'var(--rp-space-2)', '--gap-md': 'var(--rp-space-6)' }. */
export function vars<T>(name: string, value: Responsive<T> | undefined, toCss: (v: T) => string) {
  let out: Record<string, string> = {}
  if (value === undefined) return out
  if (typeof value === 'object' && value !== null) {
    for (let [bp, v] of Object.entries(value as Record<string, T>)) {
      if (v === undefined) continue
      out[bp === 'base' ? `--${name}` : `--${name}-${bp}`] = toCss(v)
    }
  } else out[`--${name}`] = toCss(value as T)
  return out
}

export const space = (v: Space) => `var(--rp-space-${v})`
export const text = (v: TextSize) => `var(--rp-text-${v})`

export function style(...objs: (Record<string, any> | undefined)[]) {
  let merged = Object.assign({}, ...objs.filter(Boolean))
  return Object.keys(merged).length ? merged : undefined
}
