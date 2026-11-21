import { renderToString } from 'remix/component/server'
import { Button } from './button.tsx'
import { Stack } from './stack.tsx'
import { Dialog } from './dialog.tsx'
import { AddToCart } from './add-to-cart.tsx'

async function show(name: string, node: JSX.Element) {
  console.log(`--- ${name}\n${await renderToString(node)}\n`)
}
await show('Button', <Button variant="secondary" size="lg">Shop now</Button>)
await show('Button href', <Button href="/collections/all" class="extra">Shop {'all'} now</Button>)
await show('Button disabled', <Button disabled type="submit">Go</Button>)
await show('Stack', <Stack gap={{ base: 2, md: 6 }} p="4 lg:8" align="center" as="section"><p>a</p><p>b</p></Stack>)
await show('Dialog', <Dialog id="size-guide" trigger="Size guide" title="Size guide" description="Measurements in cm."><p>Body</p></Dialog>)
await show('AddToCart', <AddToCart variantId="gid://shopify/ProductVariant/43695710371862" />)
await show('AddToCart sold out', <AddToCart variantId="gid://shopify/ProductVariant/1" available={false} />)
await show('attr edge cases', <div className="a" class="b" hidden data-x={true} data-y="" data-z={false} aria-hidden={true} tabIndex={-1} draggable={true} {...{ onclick: 'alert(1)', defaultValue: 'q', 'default-open': true, open: true, fooBar: 'Baz' }}>{'a'}{1}{'<b>'}{null}{false}</div>)
await show('custom el edge', <ui-dialog open default-open="" modal="false"></ui-dialog>)
