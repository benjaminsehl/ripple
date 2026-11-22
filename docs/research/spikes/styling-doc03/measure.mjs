import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { transform, Features } from 'lightningcss'
const targets = { chrome: 111 << 16, safari: (16 << 16) | (4 << 8), ios_saf: (16 << 16) | (4 << 8), firefox: 128 << 16 }
const r = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const m = (name, css) => { const min = transform({ filename: name, code: Buffer.from(css), minify: true, targets, exclude: Features.LightDark }).code; console.log(name.padEnd(22), 'raw', Buffer.byteLength(css), 'min', min.length, 'gzip', gzipSync(min, { level: 9 }).length, 'br', brotliCompressSync(min).length); return min.toString() }
m('tokens', r('css/tokens.css')); m('base', r('css/base.css'))
const tb = m('tokens+base', r('css/tokens.css') + r('css/base.css'))
m('props', r('css/props.css')); m('button', r('css/components/button.css'))
const all = m('all', ['css/layers.css','css/tokens.css','css/base.css','css/props.css','css/layout-min.css','css/components/button.css'].map(r).join('\n'))
writeFileSync(new URL('out/ripple.min.css', import.meta.url), all)
console.log(tb)
