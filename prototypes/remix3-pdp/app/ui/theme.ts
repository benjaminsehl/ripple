import { isTheme, type ThemeName } from '../ripple/theme.tsx'

const COOKIE = 'rp_theme'

/** ?theme=mono wins and is remembered in a cookie; otherwise the cookie; otherwise linen. */
export function resolveTheme(request: Request): { theme: ThemeName; setCookie?: string } {
  let param = new URL(request.url).searchParams.get('theme')
  if (isTheme(param)) return { theme: param, setCookie: `${COOKIE}=${param}; Path=/; SameSite=Lax; Max-Age=31536000` }
  let cookie = request.headers.get('cookie')?.match(/rp_theme=(\w+)/)?.[1]
  return { theme: isTheme(cookie) ? cookie : 'linen' }
}

export function withCookie(response: Response, setCookie?: string) {
  if (setCookie) response.headers.append('set-cookie', setCookie)
  return response
}
