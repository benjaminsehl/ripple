import type { Handle } from 'remix/component'

import type { Cart, Product, ProductVariant } from '../../data/types.ts'
import {
  Badge,
  Breadcrumbs,
  Container,
  Disclosure,
  Grid,
  Heading,
  Icon,
  Inline,
  Price,
  ProductCard,
  ProductForm,
  ProductGallery,
  Section,
  Split,
  Stack,
  Status,
  Text,
} from '../../ripple/index.ts'
import type { ThemeName } from '../../ripple/theme.tsx'
import { PageShell } from '../../ui/layout.tsx'

export interface ProductPageProps {
  product: Product
  variant: ProductVariant | null
  related: Product[]
  cart: Cart | null
  theme: ThemeName
  inspect: boolean
  dataMode: string
}

export function ProductPage(handle: Handle<ProductPageProps>) {
  return () => {
    let { product, variant, related, cart, theme, inspect, dataMode } = handle.props
    let price = variant?.price ?? product.priceRange.minVariantPrice
    let compareAt = variant?.compareAtPrice
    let savings = compareAt ? Math.round((1 - Number(price.amount) / Number(compareAt.amount)) * 100) : 0

    return (
      <PageShell title={product.title} theme={theme} cart={cart} inspect={inspect} dataMode={dataMode}>
        <Container>
          <Section py={{ base: 6, lg: 10 }}>
            <Split ratio="7:5" gap={{ base: 8, lg: 16 }}>
              {/* Escape hatch #1: a Tailwind position override on a Ripple component's child. */}
              <div class="relative">
                <ProductGallery product={product} variant={variant} />
                <Badge tone="highlight" class="absolute left-4 top-4 lg:left-[6.25rem]" data-escape='class="absolute left-4 top-4"'>
                  New colours
                </Badge>
              </div>

              <Stack gap={8} class="lg:sticky lg:top-24 lg:self-start" data-escape='class="lg:sticky lg:top-24"'>
                <Stack gap={4}>
                  <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: product.productType, href: '/' }, { label: product.title }]} />
                  <Text variant="eyebrow">{product.vendor}</Text>
                  <Heading level={1} size="4xl">{product.title}</Heading>
                  <Inline gap={3} align="center">
                    <Price money={price} compareAt={compareAt} size="xl" />
                    {savings > 0 ? <Badge tone="highlight">Save {savings}%</Badge> : null}
                  </Inline>
                  {/* Escape hatch #2: custom HTML. Ripple has no Rating component yet, so the page hand-rolls one with theme utilities. */}
                  <a href="#reviews" class="flex items-center gap-2 text-sm text-muted no-underline hover:text-fg" data-escape="custom HTML">
                    <span class="flex text-highlight" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map(() => <Icon name="star" class="size-4 fill-current" />)}
                    </span>
                    <span>4.9 · 1,284 reviews</span>
                  </a>
                </Stack>

                <Text variant="prose" size="sm" html={product.descriptionHtml} />

                <ProductForm product={product} variant={variant} />

                {variant?.availableForSale ? <Status tone="success">In stock, ships in 1–2 business days</Status> : <Status tone="warning">This size is sold out in this colour</Status>}

                <Grid columns={2} gap={3}>
                  <Perk icon="truck" title="Free shipping" body="On orders over $100" />
                  <Perk icon="return" title="Free returns" body="Within 30 days" />
                </Grid>

                <div>
                  <Disclosure summary="Details" open>
                    Relaxed fit with dropped shoulders. 420gsm loopback cotton, garment-dyed. Model is 6′1″ wearing size L.
                  </Disclosure>
                  <Disclosure summary="Materials & care">100% organic cotton. Machine wash cold, hang dry. Will soften with every wash.</Disclosure>
                  <Disclosure summary="Shipping & returns">Free standard shipping over $100. Free returns within 30 days of delivery.</Disclosure>
                </div>
              </Stack>
            </Split>
          </Section>
        </Container>

        <Section tone="subtle">
          <Container>
            {/* Escape hatch #3: a whole custom band. Pure HTML + Tailwind, but on Ripple tokens (font-display, bg-accent, rounded-rp-lg). */}
            <div class="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]" data-escape="custom HTML + Tailwind">
              <div class="relative overflow-hidden rounded-rp-lg bg-accent p-10 text-accent-fg md:p-14">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">The fabric</p>
                <p class="mt-4 font-display text-4xl leading-[1.05] md:text-5xl">420 grams of loopback cotton.</p>
                <span class="absolute -right-10 -bottom-16 font-display text-[12rem] leading-none opacity-10" aria-hidden="true">420</span>
              </div>
              <dl class="grid grid-cols-2 gap-6">
                {[
                  ['Weight', '420 gsm'],
                  ['Fibre', '100% organic cotton'],
                  ['Dye', 'Garment-dyed'],
                  ['Made in', 'Portugal'],
                ].map(([k, v]) => (
                  <div class="border-t border-border pt-4">
                    <dt class="text-xs uppercase tracking-widest text-muted">{k}</dt>
                    <dd class="mt-1 font-display text-xl">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Container>
        </Section>

        {related.length ? (
          <Section>
            <Container>
              <Stack gap={8}>
                <Inline justify="between" align="end">
                  <Heading level={2} size="3xl">Pairs well with</Heading>
                  <a class="rp-link text-sm" href="/">Shop all</a>
                </Inline>
                <Grid columns={{ base: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
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

function Perk(handle: Handle<{ icon: 'truck' | 'return'; title: string; body: string }>) {
  return () => (
    <Inline gap={3} align="start" nowrap>
      <Icon name={handle.props.icon} class="mt-0.5 size-5" />
      <Stack gap={0}>
        <Text size="sm" weight="semibold">{handle.props.title}</Text>
        <Text size="sm" tone="muted">{handle.props.body}</Text>
      </Stack>
    </Inline>
  )
}
