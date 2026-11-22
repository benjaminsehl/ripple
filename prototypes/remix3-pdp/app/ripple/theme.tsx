import type { Handle } from 'remix/component'

export const THEMES = {
  linen: { label: 'Linen', fonts: 'family=Fraunces:opsz,wght@9..144,300..600&family=Inter:wght@400;500;600;700' },
  mono: { label: 'Mono', fonts: 'family=Archivo:wght@500;700;800&family=Space+Grotesk:wght@400;500;600;700' },
  bloom: { label: 'Bloom', fonts: 'family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=DM+Sans:opsz,wght@9..40,400..700' },
} as const
export type ThemeName = keyof typeof THEMES

export function isTheme(value: unknown): value is ThemeName {
  return typeof value === 'string' && value in THEMES
}

/** <head> tags for a theme: font stylesheet. The tokens themselves live in tokens.css. */
export function ThemeHead(handle: Handle<{ theme: ThemeName }>) {
  return () => (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${THEMES[handle.props.theme].fonts}&display=swap`} />
    </>
  )
}
