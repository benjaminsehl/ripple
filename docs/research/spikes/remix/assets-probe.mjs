import { createAssetServer } from 'remix/assets'
const assets = createAssetServer({ basePath: '/assets', rootDir: process.cwd(), allowFiles: ['app/**/public/**'], allowPackages: ['remix', '@ui-sdk/web', '@ui-sdk/core', '@shopify/hydrogen'], watch: false })
try {
  let entry = await assets.getScriptEntry('app/public/entry.ts')
  console.log('href', entry.href, 'preloads', entry.preloads.length)
  console.log('importMap', JSON.stringify(entry.importMap).slice(0, 700)); console.log('ui-sdk modules', entry.preloads.filter((p) => /ui-sdk/.test(p)).length, 'hydrogen', entry.preloads.filter((p) => /hydrogen/.test(p)).length, 'remix', entry.preloads.filter((p) => /remix-run/.test(p)).length)
  console.log(entry.preloads.filter((p) => /ui-sdk|hydrogen/.test(p)).slice(0, 8))
  let res = await assets.fetch(new Request('http://x' + entry.href))
  console.log('entry status', res?.status, (await res?.text())?.slice(0, 400))
} catch (e) { console.log('ERR', e?.code, String(e).slice(0, 600)) }
await assets.close?.()
