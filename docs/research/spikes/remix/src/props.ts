// Shared prop helpers. Pure functions, no host imports: identical file for React and Remix bindings.
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type Responsive<T extends string | number> = T | `${T}` | string | ({ base?: T } & { [K in Breakpoint]?: T })

/** 2 -> "2"; "2 md:6" -> "2 md:6"; { base: 2, md: 6 } -> "2 md:6"; undefined -> undefined */
export function rv(value: Responsive<string | number> | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object') return String(value)
  let out: string[] = []
  if (value.base !== undefined) out.push(String(value.base))
  for (let bp of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
    if (value[bp] !== undefined) out.push(`${bp}:${value[bp]}`)
  }
  return out.length ? out.join(' ') : undefined
}

/** Joins class names, dropping empty values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
