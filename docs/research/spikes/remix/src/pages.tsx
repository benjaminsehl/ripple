import type { Handle, RemixNode } from 'remix/component'
import { renderToString } from 'remix/component/server'
import { Button } from './button.tsx'
import { Stack } from './stack.tsx'
import { Dialog } from './dialog.tsx'
import { Tabs } from './tabs.tsx'
import { AddToCart } from './add-to-cart.tsx'

type Mode = 'none' | 'attrs' | 'dom'
interface Opts { doc: boolean; closeOnNav: boolean; mode: Mode; keyed: boolean; norp: boolean; nojsrun: boolean; htmlPreserve: boolean; count: number; n: number }

function Document(handle: Handle<{ title: string; opts: Opts; children?: RemixNode }>) {
  return () => {
    let { opts } = handle.props
    let q = `mode=${opts.mode}&keyed=${opts.keyed ? 1 : 0}${opts.norp ? '&norp=1' : ''}${opts.htmlPreserve ? '&hp=1' : ''}${opts.doc ? '&doc=1' : ''}${opts.closeOnNav ? '&con=1' : ''}`
    return (
      <html lang="en" data-rmx-preserve-attrs={opts.htmlPreserve ? 'style' : undefined}>
        <head>
          <meta charSet="utf-8" />
          <title>{handle.props.title}</title>
          <style>{`[hidden]{display:none!important} .rp-dialog{position:fixed;inset:20% 20%;background:#fff;border:1px solid}`}</style>
          <script type="module" src={`/entry.js?x=1${opts.norp ? '&norp=1' : ''}${opts.closeOnNav ? '&con=1' : ''}`}></script>
        </head>
        <body>
          <nav>
            <a id="to-a" href={`/a?${q}`}>A</a> <a id="to-b" href={`/b?${q}`}>B</a>
          </nav>
          <Dialog id="nav" trigger="Menu" title="Menu" preserve={opts.mode}><a id="nav-to-b" href={`/b?${q}`}>B from menu</a></Dialog>
          <p id="count">cart:{String(opts.count)}</p>
          <p id="render-n">render:{String(opts.n)}</p>
          <main>{handle.props.children}</main>
        </body>
      </html>
    )
  }
}

export function pageA(opts: Opts) {
  return renderToString(
    <Document title="A" opts={opts}>
      <Stack gap={{ base: 2, md: 6 }}>
        <Dialog id="dlg" trigger="Open" title="Dialog A" description={`server render ${opts.n}`} preserve={opts.mode} keyed={opts.keyed}>
          <a id="in-dialog-link" href={`/b?mode=${opts.mode}&keyed=${opts.keyed ? 1 : 0}`}>go B</a>
        </Dialog>
        <Tabs id="tabs" label="Info" preserve={opts.mode} items={[
          { value: 'one', label: 'One', content: `panel one ${opts.n}` },
          { value: 'two', label: 'Two', content: `panel two ${opts.n}` },
        ]} />
        <rp-probe id="probe" data-n={String(opts.n)}>probe</rp-probe>
        <AddToCart variantId="gid://shopify/ProductVariant/1" documentNav={opts.doc} />
        <Button href="/b">Plain link button</Button>
      </Stack>
    </Document>,
  )
}

export function pageB(opts: Opts) {
  return renderToString(
    <Document title="B" opts={opts}>
      <Stack gap={4}>
        <Dialog id="other" trigger="Open other" title="Dialog B" description="b" preserve={opts.mode} keyed={opts.keyed} />
        <p id="b-only">B page</p>
      </Stack>
    </Document>,
  )
}
