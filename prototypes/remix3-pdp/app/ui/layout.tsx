import type { Handle, RemixNode } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { scriptEntry } from '../assets.ts'
import type { Cart } from '../data/types.ts'
import { Announcement, CartDrawer, StoreFooter, StoreHeader } from '../ripple/index.ts'
import { THEMES, ThemeHead, type ThemeName } from '../ripple/theme.tsx'

export const SHOP_NAME = 'Fieldnote'
export const NAV = [
  { label: 'New', href: '/' },
  { label: 'Sweats', href: '/' },
  { label: 'Tees', href: '/' },
  { label: 'Accessories', href: '/' },
]
export const FREE_SHIPPING = 100

export interface PageShellProps {
  title: string
  theme: ThemeName
  cart: Cart | null
  inspect?: boolean
  dataMode?: string
  children?: RemixNode
}

/** App-owned document + store chrome. Pages render inside it. */
export function PageShell(handle: Handle<PageShellProps>) {
  return () => {
    let { title, theme, cart, inspect, dataMode, children } = handle.props
    let { href, importMap, preloads } = scriptEntry
    return (
      <html lang="en" data-theme={theme} data-inspect={inspect ? '' : undefined}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{`${title} · ${SHOP_NAME}`}</title>
          <ThemeHead theme={theme} />
          <link rel="stylesheet" href="/app.css" />
          <script type="module" src="/ripple/ripple.js"></script>
          <ImportMap value={importMap} />
          {preloads.map((p) => <link rel="modulepreload" href={p} />)}
          <script type="module" src={href}></script>
        </head>
        <body class="rp-root">
          <a class="rp-skip" href="#main">Skip to content</a>
          <Announcement>Free shipping on orders over ${FREE_SHIPPING} · Free 30-day returns</Announcement>
          <StoreHeader shopName={SHOP_NAME} nav={NAV} cart={cart} />
          <main id="main">{children}</main>
          <StoreFooter shopName={SHOP_NAME}>
            <span>Data: {dataMode === 'live' ? 'mock.shop (live)' : 'fixtures (mock.shop unreachable)'}</span>
          </StoreFooter>
          <CartDrawer cart={cart} freeShippingThreshold={FREE_SHIPPING} />
          <ThemeBar theme={theme} />
        </body>
      </html>
    )
  }
}

/** Prototype-only: switch token sets. Plain links, so it works without JS. Escape-hatch markup on purpose. */
function ThemeBar(handle: Handle<{ theme: ThemeName }>) {
  return () => (
    <nav
      data-escape="custom HTML + Tailwind"
      aria-label="Theme"
      class="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-surface/90 p-1 text-xs shadow-lg backdrop-blur"
    >
      {Object.entries(THEMES).map(([name, t]) => (
        <a
          href={`?theme=${name}`}
          data-rmx-document=""
          aria-current={handle.props.theme === name ? 'true' : undefined}
          class="rounded-full px-3 py-1.5 font-semibold text-muted no-underline aria-[current]:bg-fg aria-[current]:text-bg"
        >
          {t.label}
        </a>
      ))}
    </nav>
  )
}
