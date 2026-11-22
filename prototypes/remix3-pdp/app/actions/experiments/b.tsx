import type { Handle } from 'remix/component'

import { dataMode, getCartFor, getProduct, getProducts, selectVariant } from '../../data/storefront.ts'
import type { Cart, Product, ProductVariant } from '../../data/types.ts'
import type { ThemeName } from '../../ripple/theme.tsx'
import { Badge, Button, Container, Disclosure, Grid, Heading, Icon, Price, ProductCard, ProductForm, Section, Split, Stack, Status, Text, type IconName } from '../../ripple/index.ts'
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
  { icon: 'leaf', title: 'Fabric', body: '420gsm organic loopback cotton, garment-dyed and brushed for a soft, heavy hand.' },
  { icon: 'check', title: 'Fit', body: 'Relaxed through the body with a dropped shoulder. Take your usual size.' },
  { icon: 'truck', title: 'Made in Portugal', body: 'Cut and sewn in a family-run mill outside Guimarães, in a single run of 40.' },
]

const SIZES = [
  ['S', '38', '27', '24.5'],
  ['M', '40', '28', '25'],
  ['L', '42', '29', '25.5'],
  ['XL', '44', '30', '26'],
]

const FAQ = [
  ['Will it restock?', 'No. Once all 40 are gone, the Loop Crewneck is retired.'],
  ['How does it fit?', 'Relaxed, with a dropped shoulder. Between sizes, size down for a closer fit.'],
  ['How do I care for it?', 'Machine wash cold, hang dry. The loopback softens with every wash.'],
  ['What is the returns policy?', 'Free returns within 30 days of delivery, if unworn and unwashed.'],
]

function DropPage(handle: Handle<Props>) {
  return () => {
    let { product, variant, related, cart, theme, inspect, dataMode } = handle.props
    let price = variant?.price ?? product.priceRange.minVariantPrice
    let hero = product.featuredImage ?? product.images.nodes[0] ?? null
    return (
      <PageShell title={product.title} theme={theme} cart={cart} inspect={inspect} dataMode={dataMode}>
        {/* Custom: no Hero component in Ripple. Full-bleed image with overlaid title. */}
        <section class="relative isolate flex min-h-[80vh] items-end overflow-hidden bg-accent text-accent-fg" data-escape="custom HTML + Tailwind hero">
          {hero ? <img src={hero.url} alt={hero.altText ?? product.title} class="absolute inset-0 -z-10 size-full object-cover" loading="eager" /> : null}
          <div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
          <Container>
            <div class="pb-10 text-white md:pb-16">
              <Badge tone="highlight">Limited edition · Only 40 made</Badge>
              <h1 class="rp-heading mt-4 text-[clamp(3rem,10vw,8rem)] leading-[0.95]">{product.title}</h1>
              <div class="mt-6 flex flex-wrap items-center gap-4">
                <Button href="#buy" size="lg" iconEnd="arrow">Shop the drop</Button>
                <Price money={price} size="xl" />
              </div>
            </div>
          </Container>
        </section>

        <Section id="buy" py={{ base: 10, lg: 16 }}>
          <Container size="lg">
            <Split ratio="1:1" gap={{ base: 8, lg: 16 }} align="center">
              <Stack gap={4}>
                <Text variant="eyebrow">Drop 01 · {product.vendor}</Text>
                <Heading level={2} size="4xl">Forty of them. Then gone.</Heading>
                <Text variant="prose" html={product.descriptionHtml} />
                <Status tone="warning">Only 40 made. When they are gone, they are gone.</Status>
              </Stack>
              <Stack gap={5}>
                <Price money={price} size="2xl" />
                <ProductForm product={product} variant={variant} />
                <Text size="sm" tone="muted">Free shipping over $100. Free 30-day returns.</Text>
              </Stack>
            </Split>
          </Container>
        </Section>

        <Section tone="subtle" py={{ base: 10, lg: 16 }}>
          <Container>
            <Grid columns={{ base: 1, md: 3 }} gap={{ base: 8, lg: 12 }}>
              {FEATURES.map((f) => (
                <Stack gap={3}>
                  <Icon name={f.icon} class="size-8" />
                  <Heading level={3} size="xl">{f.title}</Heading>
                  <Text tone="muted">{f.body}</Text>
                </Stack>
              ))}
            </Grid>
          </Container>
        </Section>

        <Section py={{ base: 10, lg: 16 }}>
          <Container size="md">
            <Stack gap={10}>
              <Stack gap={4}>
                <Heading level={2} size="3xl">Size guide</Heading>
                {/* Custom: Ripple has no Table component. */}
                <div class="overflow-x-auto" data-escape="custom HTML table">
                  <table class="w-full border-collapse text-left text-sm">
                    <caption class="rp-visually-hidden">Loop Crewneck measurements in inches</caption>
                    <thead>
                      <tr class="border-b border-border text-xs uppercase tracking-widest text-muted">
                        <th scope="col" class="py-3 pr-4 font-medium">Size</th>
                        <th scope="col" class="py-3 pr-4 font-medium">Chest</th>
                        <th scope="col" class="py-3 pr-4 font-medium">Length</th>
                        <th scope="col" class="py-3 font-medium">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZES.map(([s, c, l, sl]) => (
                        <tr class="border-b border-border">
                          <th scope="row" class="py-3 pr-4 font-semibold">{s}</th>
                          <td class="py-3 pr-4">{c}"</td>
                          <td class="py-3 pr-4">{l}"</td>
                          <td class="py-3">{sl}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Stack>
              <Stack gap={4}>
                <Heading level={2} size="3xl">Questions</Heading>
                <div>{FAQ.map(([q, a]) => <Disclosure summary={q}>{a}</Disclosure>)}</div>
              </Stack>
            </Stack>
          </Container>
        </Section>

        {related.length ? (
          <Section tone="subtle" py={{ base: 10, lg: 16 }}>
            <Container>
              <Stack gap={8}>
                <Heading level={2} size="3xl">Complete the look</Heading>
                <Grid columns={{ base: 2, lg: 3 }} gap={{ base: 4, lg: 6 }}>
                  {related.map((p) => <ProductCard product={p} />)}
                </Grid>
              </Stack>
            </Container>
          </Section>
        ) : null}
      </PageShell>
    )
  }
}
