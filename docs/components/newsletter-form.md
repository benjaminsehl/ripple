# NewsletterForm

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `newsletter-form` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `form` `.rp-newsletter-form` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `input`, `button`, `form-message` |
| Milestone | M4 |

### Purpose

An email sign-up form: one email field and a submit button, with a server-rendered success or error message after the post.

- Use when: collecting marketing sign-ups in the Footer, the home page or the password page.
- Do not use when: building a contact form (compose Label, Input, Textarea, Button; see blueprint `contact`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `NewsletterForm` | `blocks/newsletter-form.liquid` | `form` | `rp-newsletter-form` | none | yes | `<id>` |
| row | none (printed by root) | same file | `div` | `rp-newsletter-form-row` | none | yes | none |
| input | none (default body) | same file | `input` (Input) | `rp-input` | none | yes | none |
| submit | none (default body) | same file | `button` (Button) | `rp-button` | none | yes | none |
| message | none (printed by root) | same file | `p` (FormMessage) | `rp-form-message` | none | when `status` is `success` or `error` | `<id>-error` when `status` is `error`; none when `success` |

Nesting rules: root contains `row`, then `message` when printed. `row` contains `input` then `submit` (or the children that replace them). NewsletterForm MUST NOT be inside another `<form>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on root; `<id>-error` on the error message |
| `action` | none (`{% form 'customer' %}`) | url | any URL | none | yes in TSX | no | `action` on root |
| `status` | none (derived from the `form` object) | enum | `idle`, `success`, `error` | `idle` | no | no | which `message` is printed; no attribute |
| `defaultValue` | none (reads `form.email`) | string | an email address | none | no | no | `value` on `input` |
| `strings` | none | object | keys `email`, `submit`, `success`, `error` | `"Email address"`, `"Subscribe"`, `"Thanks for subscribing."`, `"Enter a valid email address."` | no | no | TSX hosts only |

`action`, `status`, `defaultValue` have `hosts: ["html", "react", "remix"]`. The `status` enum `idle`, `success`, `error` is fixed by D-085.

### Content model

`flow`, restricted - the default body of `row` is `input` and `submit`. Children, when supplied, replace the content of `row` and MUST contain one email field with the host's field name (table below) and one submit Button.

### HTML contract

Fixture `default` (`id: "newsletter"`, `action: "/api/newsletter"`):

```html
<form class="rp-newsletter-form" id="newsletter" method="post" action="/api/newsletter">
  <div class="rp-newsletter-form-row">
    <input class="rp-input" type="email" name="email" required autocomplete="email" placeholder="Email address" aria-label="Email address" data-size="md">
    <button class="rp-button" type="submit" data-variant="primary" data-size="md">Subscribe</button>
  </div>
</form>
```

Fixture `success` (`status: "success"`): after `row`:

```html
<p class="rp-form-message" data-tone="success" role="status">Thanks for subscribing.</p>
```

Fixture `error` (`status: "error"`, `defaultValue: "not-an-email"`): the input additionally has `value="not-an-email" aria-invalid="true" aria-describedby="newsletter-error"`; after `row`:

```html
<p class="rp-form-message" id="newsletter-error" data-tone="destructive" role="alert">Enter a valid email address.</p>
```

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-newsletter-form custom-a custom-b`.

Host-owned regions and masks:

```json
[
  { "select": "form.rp-newsletter-form", "op": "attr", "name": "action" },
  { "select": "form.rp-newsletter-form", "op": "drop-attr", "name": "accept-charset" },
  { "select": "form.rp-newsletter-form", "op": "drop-attr", "name": "enctype" },
  { "select": "form.rp-newsletter-form > input[type=\"hidden\"]", "op": "remove" },
  { "select": "input.rp-input", "op": "attr", "name": "name" }
]
```

| | hydrogen backend | liquid backend |
|---|---|---|
| Form | `<form method="post" action="<action>">` | `{% form 'customer', id: id, class: 'rp-newsletter-form' %}`; platform hidden inputs `form_type`, `utf8` |
| Email field name | `email` | `contact[email]` |
| Tag | none | `<input type="hidden" name="contact[tags]" value="newsletter">` as the first child of the form |
| `status` | passed by the server that handled the post (section 2.7) | `success` when `form.posted_successfully?`; `error` when `form.errors`; otherwise `idle` |
| Refill | `defaultValue` | `form.email` |

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-invalid="true"` | `input` | server | `status` is `error` | `true` or absent |
| `aria-describedby` | `input` | server | `status` is `error` | `<id>-error` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of Ripple's. Native validation (`required`, `type="email"`) blocks an empty or malformed submit. The form posts; the response page shows the `message`.

### Behaviour without JavaScript

Identical (D-005 requires `full`). The outcome is a server-rendered FormMessage (`02-html-contract.md` rule PE-11); no Toast is used.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native form; `checkPattern`: none.
- Accessible name: the input by `aria-label` (`ripple.newsletter-form.email`); the button by its text (`ripple.newsletter-form.submit`).
- Focus: after the post the server redirects to `<page>#<id>`, so the form is scrolled into view; no script moves focus.
- Announcements: the success message has `role="status"`, the error message `role="alert"`; both are in the server response.

| Key | Action |
|---|---|
| Enter in the field | Submit |

### Styling

- File: `components/newsletter-form/newsletter-form.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-newsletter-form-max-width` | `28rem` | Maximum inline size of the form |
| `--rp-newsletter-form-gap` | `calc(var(--spacing) * 2)` | Gap between field and button, and between row and message |

| Modifier selector | Sets |
|---|---|
| none | none |

Required rules: root `display: flex; flex-direction: column; gap: var(--rp-newsletter-form-gap); max-inline-size: var(--rp-newsletter-form-max-width); inline-size: 100%`; `row` `display: flex; flex-wrap: wrap; gap: var(--rp-newsletter-form-gap)`; `.rp-newsletter-form-row > .rp-input` `flex: 1 1 12rem; min-inline-size: 0`.

### Host notes

- Binding paths (D-139): `static` that the template language of `07-manifest-registry-cli.md` 2.3 cannot express (D-072 row 2): no `template`; every fixture is `generated: "hand"`; `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: copy the fixture; the server needs the route of section 2.7.
- React: `export function NewsletterForm(props: NewsletterFormProps): JSX.Element`. No hook; the form is uncontrolled (`defaultValue`).
- Remix: no `data-rmx-document` (Remix may submit it as a frame navigation; the route answers with a redirect to the page).
- Liquid: block `newsletter-form`. No schema settings. Locale keys: `ripple.newsletter-form.name`, `.email` ("Email address"), `.submit` ("Subscribe"), `.success` ("Thanks for subscribing."), `.error` ("Enter a valid email address."). The root is printed by `{% form %}` and takes only `id` and `class` (D-091 item 6). Block name `t:ripple.newsletter-form.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<NewsletterForm id="newsletter" action="/api/newsletter" status={newsletterStatus} />
```

```liquid
{% block 'newsletter-form', id: 'newsletter' %}{% endblock %}
```

Body of `components/newsletter-form/liquid/blocks/newsletter-form.liquid` between `{% doc %}` and `{% schema %}` (complete):

```liquid
{%- liquid
  assign email_label = 'ripple.newsletter-form.email' | t
  assign submit_label = 'ripple.newsletter-form.submit' | t
  assign success_text = 'ripple.newsletter-form.success' | t
  assign error_text = 'ripple.newsletter-form.error' | t
  assign error_id = id | append: '-error'
  assign form_class = 'rp-newsletter-form ' | append: class | strip
-%}
{%- form 'customer', id: id, class: form_class -%}
  <input type="hidden" name="contact[tags]" value="newsletter">
  <div class="rp-newsletter-form-row">
    {%- if content != blank -%}
      {{ content }}
    {%- else -%}
      {%- if form.errors -%}
        {% render 'rp-input', type: 'email', name: 'contact[email]', required: true, auto_complete: 'email', placeholder: email_label, aria_label: email_label, default_value: form.email, invalid: true, described_by: error_id %}
      {%- else -%}
        {% render 'rp-input', type: 'email', name: 'contact[email]', required: true, auto_complete: 'email', placeholder: email_label, aria_label: email_label %}
      {%- endif -%}
      {% render 'rp-button', type: 'submit', content: submit_label %}
    {%- endif -%}
  </div>
  {%- if form.posted_successfully? -%}
    <p class="rp-form-message" data-tone="success" role="status">{{ success_text | escape }}</p>
  {%- elsif form.errors -%}
    <p class="rp-form-message" id="{{ error_id | escape }}" data-tone="destructive" role="alert">{{ error_text | escape }}</p>
  {%- endif -%}
{%- endform -%}
```

Notes: the root element is printed by the `{% form %}` tag, so `attributes`, `span` and `hidden` cannot be printed on it; this block accepts only `id` and `class` (D-091 item 6), and the `{% doc %}` MUST say so. The two FormMessage elements are written inline, following FormMessage's contract exactly (`09-components-foundation.md` `## FormMessage`). The Input param names (`default_value`, `invalid`, `described_by`, `aria_label`, `auto_complete`) follow ledger 6.4 and are owned by `09-components-foundation.md`.

### Commerce

None. NewsletterForm does not touch the cart store or the commerce adapter.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none. (An email address is not marked `data-agent-secret`.)

### Checker rules

- RP301 / lint `pe-2`: the form has `action` and `method`; the button is a submit button. RP202 / lint `a-8`: the input has `aria-label`. RP305 does not apply (not a cart form).
- RP113 structure rule `newsletter-form-not-in-form`: `.rp-newsletter-form` MUST NOT have a `form` ancestor.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `success`, `error`, `class` conform in all four hosts with the masks above.
- **AT-2** Tier 3: zero mutations when `ripple.js` loads.
- **AT-3** Tier 6 (hydrogen backend, JavaScript disabled): submit `shopper@example.com`; the response page (after the redirect) contains `.rp-newsletter-form .rp-form-message[data-tone="success"][role="status"]` and the URL ends with `#newsletter`.
- **AT-4** Tier 6: submit with the route forced to fail; the response contains the `error` markup, the input has `aria-invalid="true"`, and `aria-describedby` resolves.
- **AT-5** Tier 6: pressing the button with an empty field sends no request (native validation).
- **AT-6** Tier 8 (Liquid live): the same success flow through `{% form 'customer' %}`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/password.liquid` lines 93 and 187 (`{% form 'customer' %}` used for email sign-up); Shopify docs (`https://shopify.dev/docs/api/liquid/objects/form`: `posted_successfully?`); ledger D-005 (NewsletterForm MUST be `full`), `02-html-contract.md` PE-11.
- UNVERIFIED: the Liquid field names `contact[email]` and `contact[tags]` and the `form.email` refill (standard theme practice; not re-read in docs in this session); the shim's `form 'customer'` output (section 3, X-5); the hydrogen-backend sign-up mutation (section 2.7). Tier 8 confirms the Liquid items.

### Fallback (SPIKE-nn)

None.

---
