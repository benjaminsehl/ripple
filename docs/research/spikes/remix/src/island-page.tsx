import { renderToStream } from 'remix/component/server'
import { Island } from './island.tsx'
export function islandPage(pre = false) {
  return renderToStream(
    <html lang="en"><head><meta charSet="utf-8" /><title>I</title><style>{`[hidden]{display:none!important}`}</style><script type="module" src={pre ? "/entry.js?pre=1" : "/entry.js?x=1"}></script></head>
      <body><main><Island label="count" /></main></body></html>,
    { resolveClientEntry: (_id, _c) => ({ href: '/entry.js', exportName: 'Island', preloads: [] }) },
  )
}
