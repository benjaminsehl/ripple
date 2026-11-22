import type { Handle } from 'remix/component'

import type { Cart } from '../../data/types.ts'
import { Box, CartEmpty, CartLines, CartSummary, Container, Heading, Section, Split, Stack, Text } from '../../ripple/index.ts'
import type { ThemeName } from '../../ripple/theme.tsx'
import { FREE_SHIPPING, PageShell } from '../../ui/layout.tsx'

export function CartPage(handle: Handle<{ cart: Cart | null; theme: ThemeName; inspect: boolean; dataMode: string }>) {
  return () => {
    let { cart, theme, inspect, dataMode } = handle.props
    let count = cart?.totalQuantity ?? 0
    return (
      <PageShell title="Cart" theme={theme} cart={cart} inspect={inspect} dataMode={dataMode}>
        <Container size="lg">
          <Section py={{ base: 8, lg: 12 }}>
            <Stack gap={8}>
              <Stack gap={2}>
                <Heading level={1} size="4xl">Your cart</Heading>
                {count ? <Text tone="muted">{count} {count === 1 ? 'item' : 'items'}</Text> : null}
              </Stack>
              {count ? (
                <Split ratio="3:2" gap={{ base: 8, lg: 12 }} align="start">
                  <CartLines cart={cart} />
                  <Box tone="surface" border radius="lg" pad={6} class="lg:sticky lg:top-24">
                    <CartSummary cart={cart} freeShippingThreshold={FREE_SHIPPING} />
                  </Box>
                </Split>
              ) : (
                <CartEmpty />
              )}
            </Stack>
          </Section>
        </Container>
      </PageShell>
    )
  }
}
