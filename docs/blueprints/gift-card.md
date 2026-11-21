# Blueprint: `gift-card`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The page a buyer opens from a gift card email: the balance, the code, its state, and a link to start shopping.

Scope per backend: on Liquid this is the platform's `gift_card` template. The Storefront API does not expose a gift card by URL, so on the hydrogen backend the blueprint is a presentational page whose data the project supplies (D-107 item 2, Q22).

V1 has no copy-to-clipboard button, no tilt effect and no QR code (D-107 item 6, Q19). The base theme implements both with theme JavaScript (`ripple/theme/blocks/gift-card.liquid`, command `--copy-code`); neither has a Ripple element (ledger section 8.6 maps the block to this blueprint only). The code is printed as selectable text.

### Regions

None.

### Components used

`banner`, `button`, `card`, `container`, `heading`, `link`, `stack`, `text`.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack gap="8 md:12" align="center" textAlign="center"
   ├─ Heading level 1
   ├─ Banner tone="warning"                    when the card is expired or disabled
   ├─ Card p="4 md:8"
   │  └─ Stack gap="2"
   │     ├─ Text variant="overline" tone="muted"     "Balance"
   │     ├─ Text size="3xl" weight="semibold"        formatted balance
   │     ├─ Text variant="overline" tone="muted"     "Code"
   │     ├─ Text size="xl" weight="semibold"         the code
   │     └─ Text tone="muted" size="sm"              expiry date (when the card expires)
   ├─ Button href (home)
   └─ Link href (wallet pass)                   when a pass URL exists
```

**React** (`blueprints/gift-card/react/gift-card.tsx`, complete):

```tsx
import { Banner } from "@components/banner";
import { Button } from "@components/button";
import { Card } from "@components/card";
import { Container } from "@components/container";
import { Heading } from "@components/heading";
import { Link } from "@components/link";
import { Stack } from "@components/stack";
import { Text } from "@components/text";

export interface GiftCardPageProps {
  /** Balance already formatted as money, for example "$25.00". */
  balance: string;
  code: string;
  state: "active" | "expired" | "disabled";
  /** Expiry date already formatted, or null when the card does not expire. */
  expiresLabel: string | null;
  /** Apple Wallet pass URL, or null. */
  passUrl: string | null;
  homeUrl: string;
}

export function GiftCardPage(props: GiftCardPageProps) {
  const { balance, code, state, expiresLabel, passUrl, homeUrl } = props;
  return (
    <Container width="prose" py="12 md:20">
      <Stack gap="8 md:12" align="center" textAlign="center">
        <Heading level={1}>Your gift card</Heading>
        {state === "expired" ? <Banner tone="warning">This gift card has expired.</Banner> : null}
        {state === "disabled" ? <Banner tone="warning">This gift card is disabled.</Banner> : null}
        <Card p="4 md:8">
          <Stack gap="2">
            <Text variant="overline" tone="muted">Balance</Text>
            <Text size="3xl" weight="semibold">{balance}</Text>
            <Text variant="overline" tone="muted">Code</Text>
            <Text size="xl" weight="semibold">{code}</Text>
            {expiresLabel !== null ? <Text tone="muted" size="sm">{`Expires ${expiresLabel}`}</Text> : null}
          </Stack>
        </Card>
        <Button href={homeUrl}>Start shopping</Button>
        {passUrl !== null ? <Link href={passUrl}>Add to Apple Wallet</Link> : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/gift-card/liquid/templates/gift_card.liquid`, complete):

```liquid
{%- liquid
  assign expires_on = gift_card.expires_on | date: format: 'date'
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12', align: 'center', text_align: 'center' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.gift-card.title' | t }}{% endblock %}
    {%- if gift_card.expired -%}
      {% block 'banner', tone: 'warning' %}{{ 'ripple.blueprints.gift-card.expired' | t }}{% endblock %}
    {%- elsif gift_card.enabled == false -%}
      {% block 'banner', tone: 'warning' %}{{ 'ripple.blueprints.gift-card.disabled' | t }}{% endblock %}
    {%- endif -%}
    {% block 'card', p: '4 md:8' %}
      {% block 'stack', gap: '2' %}
        {% block 'text', variant: 'overline', tone: 'muted' %}{{ 'ripple.blueprints.gift-card.balance' | t }}{% endblock %}
        {% block 'text', size: '3xl', weight: 'semibold' %}{{ gift_card.balance | money }}{% endblock %}
        {% block 'text', variant: 'overline', tone: 'muted' %}{{ 'ripple.blueprints.gift-card.code' | t }}{% endblock %}
        {% block 'text', size: 'xl', weight: 'semibold' %}{{ gift_card.code | escape }}{% endblock %}
        {%- if gift_card.expires_on -%}
          {% block 'text', tone: 'muted', size: 'sm' %}{{ 'ripple.blueprints.gift-card.expires' | t: date: expires_on }}{% endblock %}
        {%- endif -%}
      {% endblock %}
    {% endblock %}
    {% block 'button', href: routes.root_url %}{{ 'ripple.blueprints.gift-card.cta' | t }}{% endblock %}
    {%- if gift_card.pass_url -%}
      {% block 'link', href: gift_card.pass_url %}{{ 'ripple.blueprints.gift-card.wallet' | t }}{% endblock %}
    {%- endif -%}
  {% endblock %}
{% endblock %}
```

The template renders in `layout/theme.liquid` (header and footer present), so the buyer can continue to the store.

Locale keys (`ripple.blueprints.gift-card.*`): `title` "Your gift card"; `expired` "This gift card has expired."; `disabled` "This gift card is disabled."; `balance` "Balance"; `code` "Code"; `expires` "Expires {{ date }}"; `cta` "Start shopping"; `wallet` "Add to Apple Wallet".

Masks for BT-3: `{ "select": ".rp-card .rp-text", "op": "text" }` (money and date formatting are host-owned). Evidence: `ripple/theme/blocks/gift-card.liquid` (`gift_card.balance`, `gift_card.code`, `gift_card.expired`, `gift_card.enabled`, `gift_card.expires_on | date: format: 'date'`, `gift_card.pass_url`), `ripple/theme/templates/gift_card.liquid`.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Gift card | none in the Storefront API; project-supplied props | the global `gift_card` |
| Money text | `formatMoney(money, { locale }).localizedString` (`05-commerce.md` section 11.2) | `gift_card.balance \| money` |

### No-JS behaviour

1. The page is static text and two links. The code is selectable text.

### Acceptance tests

BT-1 to BT-9, plus:

- **GC-1** (tier 2) `state: "expired"` prints exactly one `.rp-banner[data-tone="warning"]`; `state: "active"` prints none.
- **GC-2** (tier 2) With `passUrl: null` and `expiresLabel: null`: no `.rp-link` in `main`, and four `.rp-text` elements inside `.rp-card`.

---
