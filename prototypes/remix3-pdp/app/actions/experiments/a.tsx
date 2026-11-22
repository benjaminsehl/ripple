import type { Handle } from 'remix/component'

import {
  Badge, Button, Container, Disclosure, Grid, Heading, Icon, Inline, Media, Price, ProductCard, ProductForm, Section, Split, Stack, Status, Text, VariantPicker, QuantityInput, AddToCartButton,
  type IconName,
} from '../../ripple/index.ts'

import { dataMode, getCartFor, getProduct, getProducts, selectVariant } from '../../data/storefront.ts'
import type { Cart, Product, ProductVariant } from '../../data/types.ts'
import type { ThemeName } from '../../ripple/theme.tsx'
import { PageShell } from '../../ui/layout.tsx'
import { resolveTheme, withCookie } from '../../ui/theme.ts'

// Data loading is done for you. Build the page in DropPage below.
export async function handler(context: any) {
  let request: Request = context.request
  let url = new URL(request.url)
  let product = (await getProduct(request, 'loop-crewneck'))!
  let variant = selectVariant(product, url)
  let [cart, all] = await Promise.all([getCartFor(request), getProducts(request, 5)])
  let related = all.filter((p) => p.handle !== product.handle).slice(0, 3)
  let { theme, setCookie } = resolveTheme(request)
  let page = <DropPage product={product} variant={variant} related={related} cart={cart} theme={theme} inspect={url.searchParams.has('inspect')} dataMode={dataMode} />
  return withCookie(await context.render(page), setCookie)
}

interface Props {
  product: Product
  variant: ProductVariant | null
  related: Product[]
  cart: Cart | null
  theme: ThemeName
  inspect: boolean
  dataMode: string
}

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'leaf', title: 'Heavyweight loopback cotton', body: '480gsm organic cotton, brushed soft inside and built to hold its shape wash after wash.' },
  { icon: 'check', title: 'Relaxed, considered fit', body: 'A boxy cut with a dropped shoulder and ribbed trims that sit cleanly at the cuff and hem.' },
  { icon: 'truck', title: 'Made in Portugal', body: 'Cut and sewn in a family-run mill near Guimarães, then numbered by hand.' },
]

const SIZES = [
  ['XS', '34-36', '66', '70'],
  ['S', '36-38', '68', '72'],
  ['M', '38-40', '70', '74'],
  ['L', '40-42', '72', '76'],
  ['XL', '42-45', '74', '78'],
]

const FAQ = [
  ['How limited is the drop?', 'Only 40 pieces were made. Once they are gone, the Loop Crewneck will not be restocked in this colorway.'],
  ['How does it fit?', 'It is cut relaxed. Take your usual size for a boxy fit, or size down for a closer one. See the size guide above.'],
  ['How should I care for it?', 'Machine wash cold with like colors, hang to dry. Avoid tumble drying to protect the loopback texture.'],
  ['What is the return policy?', 'Unworn pieces can be returned within 30 days. Limited-edition items are final sale once the drop sells out.'],
]

function DropPage(handle: Handle<Props>) {
  return () => {
    let { product, variant, related, cart, theme, inspect, dataMode } = handle.props
    let hero = product.featuredImage ?? product.images.nodes[0] ?? null
    let price = variant?.price ?? product.priceRange.minVariantPrice
    return (
      <PageShell title={product.title} theme={theme} cart={cart} inspect={inspect} dataMode={dataMode}>
        <div data-escape="editorial full-bleed hero: image with overlaid title, no Ripple equivalent" class="relative isolate overflow-hidden bg-accent text-accent-fg">
          <Media image={hero} ratio="16/9" loading="eager" class="absolute inset-0 -z-10 h-full w-full" style={{ minHeight: '32rem' }} />
          <div class="absolute inset-0 -z-10 bg-accent opacity-50" />
          <Container>
            <Stack gap={5} justify="end" style={{ minHeight: 'min(80vh, 44rem)' }} class="py-12">
              <Badge tone="highlight">Only 40 made</Badge>
              <Text variant="eyebrow" class="text-accent-fg">Limited edition drop</Text>
              <Heading level={1} size="5xl" class="text-accent-fg">{product.title}</Heading>
              <Inline gap={4}>
                <Button href="#buy" size="lg" variant="secondary" iconEnd="arrow">Shop the drop</Button>
                <Price money={price} size="xl" />
              </Inline>
            </Stack>
          </Container>
        </div>

        <Section py={{ base: 10, lg: 16 }} id="buy">
          <Container size="lg">
            <Split ratio="1:1" align="center">
              <Media image={product.images.nodes[1] ?? hero} ratio="4/5" />
              <Stack gap={6}>
                <Stack gap={3}>
                  <Badge tone="outline">Limited edition, 40 pieces</Badge>
                  <Heading level={2} size="3xl">Choose your Loop</Heading>
                  <Text tone="muted">Numbered, never restocked. Pick a color and size, then add it to your bag.</Text>
                  <Price money={price} compareAt={variant?.compareAtPrice} size="2xl" />
                  <Status tone={variant?.availableForSale === false ? 'neutral' : 'warning'}>
                    {variant?.availableForSale === false ? 'Sold out in this option' : 'Limited run: only 40 made'}
                  </Status>
                </Stack>
                <ProductForm product={product} variant={variant}>
                  <VariantPicker />
                  <Inline gap={3} nowrap>
                    <QuantityInput />
                    <AddToCartButton class="flex-1">Add to bag</AddToCartButton>
                  </Inline>
                </ProductForm>
              </Stack>
            </Split>
          </Container>
        </Section>

        <Section tone="subtle" py={{ base: 10, lg: 16 }}>
          <Container size="lg">
            <Grid columns={{ base: 1, md: 3 }} gap={{ base: 8, lg: 12 }}>
              {FEATURES.map((f) => (
                <Stack gap={3}>
                  <Icon name={f.icon} class="text-2xl" />
                  <Heading level={3} size="xl">{f.title}</Heading>
                  <Text tone="muted">{f.body}</Text>
                </Stack>
              ))}
            </Grid>
          </Container>
        </Section>

        <Section py={{ base: 10, lg: 16 }}>
          <Container size="md">
            <Stack gap={6}>
              <Heading level={2} size="3xl">Size guide</Heading>
              <div data-escape="size guide table: Ripple has no table component" class="overflow-x-auto">
                <table class="w-full text-left">
                  <caption class="sr-only">Loop Crewneck measurements</caption>
                  <thead>
                    <tr class="border-b border-border">
                      <th scope="col" class="py-3 pr-4">Size</th>
                      <th scope="col" class="py-3 pr-4">Chest (in)</th>
                      <th scope="col" class="py-3 pr-4">Length (cm)</th>
                      <th scope="col" class="py-3">Sleeve (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZES.map((r) => (
                      <tr class="border-b border-border">
                        <th scope="row" class="py-3 pr-4 font-semibold">{r[0]}</th>
                        <td class="py-3 pr-4 text-muted">{r[1]}</td>
                        <td class="py-3 pr-4 text-muted">{r[2]}</td>
                        <td class="py-3 text-muted">{r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Stack>
          </Container>
        </Section>

        <Section tone="subtle" py={{ base: 10, lg: 16 }}>
          <Container size="md">
            <Stack gap={6}>
              <Heading level={2} size="3xl">Questions</Heading>
              <Stack gap={0}>
                {FAQ.map(([q, a], i) => (
                  <Disclosure summary={q} open={i === 0}>
                    <Text tone="muted">{a}</Text>
                  </Disclosure>
                ))}
              </Stack>
            </Stack>
          </Container>
        </Section>

        <Section py={{ base: 10, lg: 16 }}>
          <Container>
            <Stack gap={8}>
              <Stack gap={2}>
                <Text variant="eyebrow">Pairs well with</Text>
                <Heading level={2} size="3xl">Complete the look</Heading>
              </Stack>
              <Grid columns={{ base: 2, md: 3 }} gap={{ base: 4, lg: 8 }}>
                {related.map((p) => <ProductCard product={p} />)}
              </Grid>
            </Stack>
          </Container>
        </Section>
      </PageShell>
    )
  }
}
