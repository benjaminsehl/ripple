# Blueprint: `contact`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

A contact page: the page's title and body, then a form with name, email and message. The form works as a plain POST.

### Regions

None.

### Components used

`banner`, `button`, `container`, `heading`, `input`, `label`, `rich-text`, `stack`, `textarea`.

Field (`09-components-foundation.md`) is not used: Label, Input and Textarea in a Stack give the same markup with fewer parts for an agent to get wrong, and this form has no per-field error text.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Stack as="header" gap="2":  Heading level 1 (page title); RichText (page body, when not empty)
   └─ form#contact-form  method="post"
      └─ Stack gap="4"
         ├─ Banner tone="success"       after a successful post
         ├─ Banner tone="destructive"   after a failed post
         ├─ Stack gap="2":  Label for contact-name;    Input id="contact-name"    autocomplete name
         ├─ Stack gap="2":  Label for contact-email;   Input id="contact-email"   type email, required, autocomplete email
         ├─ Stack gap="2":  Label for contact-message; Textarea id="contact-message" required, rows 6
         └─ Button type="submit"
```

Field names per backend:

| Field | hydrogen backend (POST `/api/contact`) | liquid backend (`{% form 'contact' %}`) |
|---|---|---|
| Name | `name` | `contact[name]` |
| Email | `email` | `contact[email]` |
| Message | `message` | `contact[body]` |

Masks for BT-3: `{ "select": "#contact-form", "op": "attr", "name": "action" }`, `{ "select": "#contact-form", "op": "drop-attr", "name": "accept-charset" }`, `{ "select": "#contact-form", "op": "drop-attr", "name": "class" }`, `{ "select": "#contact-form > input[type=\"hidden\"]", "op": "remove" }`, `{ "select": "#contact-form .rp-input, #contact-form .rp-textarea", "op": "attr", "name": "name" }`.

**React** (`blueprints/contact/react/contact.tsx`, complete):

```tsx
import { Banner } from "@components/banner";
import { Button } from "@components/button";
import { Container } from "@components/container";
import { Heading } from "@components/heading";
import { Input } from "@components/input";
import { Label } from "@components/label";
import { RichText } from "@components/rich-text";
import { Stack } from "@components/stack";
import { Textarea } from "@components/textarea";

export interface ContactPageProps {
  page: { title: string; bodyHtml: string };
  /** From contactStatus(request) (lib/contact-route.ts). */
  status: "idle" | "success" | "error";
  action?: string;
}

export function ContactPage(props: ContactPageProps) {
  const { page, status, action = "/api/contact" } = props;
  return (
    <Container width="prose" py="12 md:20">
      <Stack gap="8 md:12">
        <Stack as="header" gap="2">
          <Heading level={1}>{page.title}</Heading>
          {page.bodyHtml !== "" ? <RichText html={page.bodyHtml} /> : null}
        </Stack>
        <form id="contact-form" method="post" action={action}>
          <Stack gap="4">
            {status === "success" ? <Banner tone="success">Thanks. We will reply by email.</Banner> : null}
            {status === "error" ? <Banner tone="destructive">The message was not sent. Check the fields and try again.</Banner> : null}
            <Stack gap="2">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" name="name" autoComplete="name" />
            </Stack>
            <Stack gap="2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" name="email" autoComplete="email" required />
            </Stack>
            <Stack gap="2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea id="contact-message" name="message" rows={6} required />
            </Stack>
            <Button type="submit">Send</Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
```

The page data uses `PAGE_QUERY` of the `page` blueprint with the handle `contact`; when the page does not exist the route code passes `{ title: "Contact", bodyHtml: "" }` instead of answering 404.

`blueprints/contact/react/lib/contact-route.ts` (complete; the remix file is identical):

```ts
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactMessage { name: string; email: string; message: string }

function text(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Handles POST /api/contact. `send` is supplied by the project (an email service or a helpdesk API)
 * and MUST throw when the message was not accepted.
 * Answers 303 to `<returnPath>?contact=success#contact-form` or `?contact=error#contact-form`.
 */
export async function handleContactPost(
  request: Request,
  send: (message: ContactMessage) => Promise<void>,
  returnPath = "/pages/contact",
): Promise<Response> {
  const form = await request.formData();
  const message: ContactMessage = {
    name: text(form, "name", 200),
    email: text(form, "email", 254),
    message: text(form, "message", 5000),
  };
  let status: "success" | "error" = "error";
  if (EMAIL.test(message.email) && message.message !== "") {
    try {
      await send(message);
      status = "success";
    } catch {
      status = "error";
    }
  }
  return new Response(null, {
    status: 303,
    headers: { location: `${returnPath}?contact=${status}#contact-form` },
  });
}

/** Reads the status for <ContactPage status={...}> from the request URL. */
export function contactStatus(request: Request): "idle" | "success" | "error" {
  const value = new URL(request.url).searchParams.get("contact");
  return value === "success" || value === "error" ? value : "idle";
}
```

`returnPath` is a constant chosen by the project (with its locale prefix), never a value from the request. After an error the fields are empty; values are not echoed through the URL.

**Remix**: rules R-1 to R-4; the `<form>` additionally carries the bare attribute `data-rmx-document` so that the Remix router does not intercept the POST. **html**: rule H-1 with `status: "idle"`.

**Liquid** (`blueprints/contact/liquid/templates/page.contact.liquid`, complete):

```liquid
{%- liquid
  assign name_label = 'ripple.blueprints.contact.name' | t
  assign email_label = 'ripple.blueprints.contact.email' | t
  assign message_label = 'ripple.blueprints.contact.message' | t
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'stack', as: 'header', gap: '2' %}
      {% block 'heading', level: 1 %}{{ page.title | escape }}{% endblock %}
      {%- if page.content != blank -%}
        {% block 'rich-text', html: page.content %}{% endblock %}
      {%- endif -%}
    {% endblock %}
    {% form 'contact', id: 'contact-form' %}
      {% block 'stack', gap: '4' %}
        {%- if form.posted_successfully? -%}
          {% block 'banner', tone: 'success' %}{{ 'ripple.blueprints.contact.success' | t }}{% endblock %}
        {%- endif -%}
        {%- if form.errors -%}
          {% block 'banner', tone: 'destructive' %}{{ 'ripple.blueprints.contact.error' | t }}{% endblock %}
        {%- endif -%}
        {% block 'stack', gap: '2' %}
          {% block 'label', html_for: 'contact-name' %}{{ name_label }}{% endblock %}
          {% block 'input', id: 'contact-name', name: 'contact[name]', auto_complete: 'name', default_value: form.name %}{% endblock %}
        {% endblock %}
        {% block 'stack', gap: '2' %}
          {% block 'label', html_for: 'contact-email' %}{{ email_label }}{% endblock %}
          {% block 'input', id: 'contact-email', type: 'email', name: 'contact[email]', auto_complete: 'email', required: true, default_value: form.email %}{% endblock %}
        {% endblock %}
        {% block 'stack', gap: '2' %}
          {% block 'label', html_for: 'contact-message' %}{{ message_label }}{% endblock %}
          {% block 'textarea', id: 'contact-message', name: 'contact[body]', rows: 6, required: true, default_value: form.body %}{% endblock %}
        {% endblock %}
        {% block 'button', type: 'submit' %}{{ 'ripple.blueprints.contact.send' | t }}{% endblock %}
      {% endblock %}
    {% endform %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.contact.*`): `name` "Name"; `email` "Email"; `message` "Message"; `send` "Send"; `success` "Thanks. We will reply by email."; `error` "The message was not sent. Check the fields and try again.".

On Liquid the platform refills fields after an error (`form.name`, `form.email`, `form.body`); on the hydrogen backend they are empty. The fixture comparison of BT-3 uses `status: "idle"`, where both are empty. Evidence: `ripple/theme/templates/page.contact.liquid` exists in the base theme (not re-read line by line in this session); `{% form %}` output shape verified for `localization` only (LocaleSelector, Evidence). UNVERIFIED: the field names `contact[name]`, `contact[email]`, `contact[body]` and the refill properties `form.name`, `form.email`, `form.body` (standard theme practice); whether the platform shows a captcha challenge page after the POST.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Page | `page(handle: "contact")` (`PAGE_QUERY`) | `page` |
| Post result | `contactStatus(request)` | `form.posted_successfully?`, `form.errors` |
| Delivery | project function `send` | the platform emails the store |

### No-JS behaviour

1. The form posts; the browser validates `required` and `type="email"` first.
2. The page reloads at `#contact-form` with a success or error Banner.
3. Nothing on this page needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **CT-1** (tier 2) Each of the three controls has exactly one `label[for]` naming it; the email input and the textarea have `required`.
- **CT-2** (tier 2) `status: "success"` prints one `.rp-banner[data-tone="success"]`; `status: "error"` prints one `.rp-banner[data-tone="destructive"]`; `idle` prints no Banner.
- **CT-3** (tier 1) `handleContactPost`: a valid post calls `send` once with trimmed values and answers 303 to `/pages/contact?contact=success#contact-form`; an invalid email or an empty message does not call `send` and answers `?contact=error#contact-form`; a `send` that throws answers `error`.
- **CT-4** (tier 6) With JavaScript disabled, a valid post ends on a page that shows the success Banner.

---
