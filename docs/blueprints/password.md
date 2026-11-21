# Blueprint: `password`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The page a visitor sees when the storefront is password protected: the shop name, a message, and a password form.

Scope per backend: on Liquid this is the platform's password page (`templates/password.liquid` with its own layout). The hydrogen backend has no storefront-password feature; there the blueprint is a presentational page for projects that gate a storefront themselves, and the route that checks the password is project code that this document does not specify (D-107 item 2, Q22).

### Regions

None.

### Components used

`button`, `container`, `form-message`, `heading`, `input`, `label`, `skip-link`, `stack`, `text`.

### Structure

This blueprint does NOT render inside `layout`: no header, footer or overlays. It prints its own `<main>` (the one exception to rule BP-2); tests BT-4 and LT-1 do not require a header or footer here.

```text
SkipLink href="#main"
main#main[tabindex=-1]
└─ Container width="prose" py="12 md:20"
   └─ Stack gap="8 md:12" align="center" textAlign="center"
      ├─ Heading level 1                 shop name
      ├─ Text variant="lead"             message (when present)
      └─ form#password-form  method="post"
         └─ Stack gap="2" align="stretch" textAlign="start"
            ├─ Label for password-input
            ├─ Input id="password-input" type="password" name="password" required autocomplete="off"
            ├─ FormMessage id="password-error"     after a wrong password; the input then has invalid + describedBy
            └─ Button type="submit"
```

**React** (`blueprints/password/react/password.tsx`, complete):

```tsx
import { Button } from "@components/button";
import { Container } from "@components/container";
import { FormMessage } from "@components/form-message";
import { Heading } from "@components/heading";
import { Input } from "@components/input";
import { Label } from "@components/label";
import { SkipLink } from "@components/skip-link";
import { Stack } from "@components/stack";
import { Text } from "@components/text";

export interface PasswordPageProps {
  shopName: string;
  /** Message from the merchant, or "". */
  message: string;
  /** URL the form posts to. Project route. */
  action: string;
  /** True after a wrong password. */
  error: boolean;
}

export function PasswordPage(props: PasswordPageProps) {
  const { shopName, message, action, error } = props;
  return (
    <>
      <SkipLink>Skip to content</SkipLink>
      <main id="main" tabIndex={-1}>
        <Container width="prose" py="12 md:20">
          <Stack gap="8 md:12" align="center" textAlign="center">
            <Heading level={1}>{shopName}</Heading>
            {message !== "" ? <Text variant="lead">{message}</Text> : null}
            <form id="password-form" method="post" action={action}>
              <Stack gap="2" align="stretch" textAlign="start">
                <Label htmlFor="password-input">Password</Label>
                <Input
                  id="password-input"
                  type="password"
                  name="password"
                  autoComplete="off"
                  required
                  invalid={error}
                  describedBy={error ? "password-error" : undefined}
                />
                {error ? <FormMessage id="password-error">Wrong password. Try again.</FormMessage> : null}
                <Button type="submit">Enter</Button>
              </Stack>
            </form>
          </Stack>
        </Container>
      </main>
    </>
  );
}
```

The document is produced with `renderDocument` (2.6) with `body` set to this component's markup, `commerce: { host, analytics: false }`.

**Remix**: rules R-1 to R-4; the `<form>` carries `data-rmx-document`. **html**: rule H-1 with `error: false`.

**Liquid**, two files. This document owns the complete text of both (D-099). `blueprints/password/liquid/layout/password.liquid` (complete):

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}" dir="{{ request.locale.direction | default: 'ltr' }}">
  <head>
    {% render 'import-map' %}
    {% render 'meta-tags' %}
    {% render 'rp-head' %}
    {{ 'styles.min.css' | asset_url | stylesheet_tag }}
    {{ content_for_header }}
  </head>
  <body>
    {% block 'skip-link' %}{{ 'ripple.blueprints.layout.skip' | t }}{% endblock %}
    <main id="main" tabindex="-1" data-template="{{ request.page_type }}">
      {{ content_for_layout }}
    </main>
  </body>
</html>
```

The head has the same five lines in the same order as `layout/theme.liquid` (`layout`, normative point 1). The file prints no Header, no Footer, no MobileNav, no search Dialog, no CartDrawer and no Toast. It renders the snippets `import-map` and `meta-tags` of the `layout` blueprint and the key `ripple.blueprints.layout.skip`, so the `layout` blueprint MUST be installed in the same theme (a project installs `layout` before any page blueprint; test PW-3 runs with both installed).

`blueprints/password/liquid/templates/password.liquid` (complete):

```liquid
{% layout 'password' %}
{%- liquid
  assign password_label = 'ripple.blueprints.password.label' | t
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12', align: 'center', text_align: 'center' %}
    {% block 'heading', level: 1 %}{{ shop.name | escape }}{% endblock %}
    {%- if shop.password_message != blank -%}
      {% block 'text', variant: 'lead' %}{{ shop.password_message | escape }}{% endblock %}
    {%- endif -%}
    {% form 'storefront_password', id: 'password-form' %}
      {% block 'stack', gap: '2', align: 'stretch', text_align: 'start' %}
        {% block 'label', html_for: 'password-input' %}{{ password_label }}{% endblock %}
        {%- if form.errors -%}
          {% block 'input', id: 'password-input', type: 'password', name: 'password', auto_complete: 'off', required: true, invalid: true, described_by: 'password-error' %}{% endblock %}
          {% block 'form-message', id: 'password-error' %}{{ 'ripple.blueprints.password.error' | t }}{% endblock %}
        {%- else -%}
          {% block 'input', id: 'password-input', type: 'password', name: 'password', auto_complete: 'off', required: true %}{% endblock %}
        {%- endif -%}
        {% block 'button', type: 'submit' %}{{ 'ripple.blueprints.password.submit' | t }}{% endblock %}
      {% endblock %}
    {% endform %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.password.*`): `label` "Password"; `error` "Wrong password. Try again."; `submit` "Enter".

Masks for BT-3: the form masks of `contact` with `#password-form`. Evidence: `ripple/theme/templates/password.liquid` (`{% layout 'password' %}`, `shop.password_message`), `ripple/theme/layout/password.liquid` (`content_for_header`, `content_for_layout`). UNVERIFIED: the form type name `storefront_password` and its field name `password` (standard theme practice; not re-read in docs in this session).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Shop name | `shop.name` | `shop.name` |
| Message | project-defined; `""` for none | `shop.password_message` |
| Post result | project route; passes `error` | `form.errors` |

### No-JS behaviour

1. The form posts; a wrong password reloads the page with the error message linked to the input by `aria-describedby`.
2. Nothing on this page needs script.

### Acceptance tests

BT-1 to BT-3, BT-6 to BT-9, plus:

- **PW-1** (tier 2) The document has one `main#main`, one `h1`, no `header.rp-header`, no `footer.rp-footer`, no `dialog`.
- **PW-2** (tier 2) With `error: true`: the input has `aria-invalid="true"` and `aria-describedby="password-error"`, and `#password-error` exists with `role="alert"`.
- **PW-3** (tier 2, Liquid) `templates/password.liquid` starts with `{% layout 'password' %}`; `layout/password.liquid` contains `content_for_layout` exactly once, contains the five head lines of `layout/theme.liquid` in the same order, and contains none of the strings `'header'`, `'footer'`, `'cart-drawer'`, `'mobile-nav'`.

---
