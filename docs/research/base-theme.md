# The Shopify base theme: findings for Ripple

Scope: the theme at `ripple/theme` (158 files), read against the current Ripple proposal. Paths below are relative to `ripple/theme` unless they start with `uisdk/`, `hydrogen/` or `ripple/docs/`.

The owner's framing: this theme is the reference for how Liquid themes are structured now. It is the host Ripple must fit. It is not a model to copy. Ripple should make it simpler and better, especially UI composition.

## 0. What was read and what was verified

| Item | Status |
|---|---|
| `AGENTS.md`, `DESIGN.md` | Read completely. |
| All 22 files in `blocks/` | Read completely, except `gift-card.liquid` lines 61–149 (inline `{% style %}` artwork CSS, skimmed). |
| All 22 files in `snippets/` | Read. `meta-tags.liquid` skimmed (SEO, JSON-LD, hreflang). |
| All 13 files in `templates/` | `product`, `collection`, `cart`, `index`, `page`, `gift_card`, `404`, `list-collections`, `blog` read completely. `search`, `article`, `page.contact`, `password` read by structure (every block, render, partial, form, dialog and script line) plus selected regions. |
| `layout/theme.liquid`, `layout/password.liquid`, `config/*` | Read completely. |
| `assets/*.js` (22 files, 3,570 lines, 32.6 kB gzip together) | `s-cart`, `s-live-form`, `s-variant-picker`, `s-product-form`, `s-dialog`, `standard-actions-override` and the 7 small modules read completely. The other 9 read by header comment, imports and listeners. |
| `assets/styles.min.css` | Generated (Tailwind v4.3.0, 86.4 kB raw, 15.9 kB gzip). Header only. |
| `assets/icon-*.svg` (14 files) | Listed, not read. |
| `locales/` | `en.default.json` and `en.default.schema.json` key structure only. 31 storefront locales and 20 schema locales exist. |
| `uisdk/packages/web/src`, `uisdk/packages/core/src` | Searched for Invoker Commands and native `<dialog>` use (section 4.4). Nothing was run. |
| `hydrogen/packages/hydrogen/src/core/cart/cart.ts`, `vendor/standard-actions.d.ts`, `core/cart/form.ts`, `package.json`, `skills/` | Read the Standard Actions integration and types. Nothing was run by this investigation. `ripple/docs/research/spikes/hydrogen-core/result*.txt` (another agent's run) was read. |
| Rendering the theme, Theme Check, a browser | **Not run.** Every statement about runtime behaviour is from reading source. |

Anything marked **UNVERIFIED** is not established by the code in these folders.

---

## 1. How the base theme works

### 1.1 Composition model

There are no `sections/`, no JSON templates, no `{% section %}`, no schema `presets`, no `{% javascript %}`, no `{% stylesheet %}` (`AGENTS.md` "Non-negotiables"). Templates are `.liquid` files that compose the page directly.

The stated order (`AGENTS.md` "Composition model"):

```text
template → container block body → composed blocks/snippets/inline markup → optional partial regions → template-loaded JS
layout → shell block body → composed blocks/snippets/inline markup
block file → own markup/snippets + content when compositional (never another block)
```

A block is a file in `blocks/` invoked with a paired tag and keyword arguments. The body between the tags is available inside the block as `content`:

```liquid
{% block 'container', class: 'w-full max-w-page mx-auto px-margin' %}
  {% block 'heading', tag: 'h1', variant: 'lg', class: 'mb-8' %}{{ page.title | escape }}{% endblock %}
{% endblock %}
```
(`templates/page.liquid`)

Rules that shape everything else:

- **Template-owned composition.** "Executable `{% block %}` calls never live in `blocks/**/*.liquid` or `snippets/**/*.liquid`". The reason given: a child call inside a shared file "is one shared authored usage. Changing that child's settings or arguments there affects every use of the parent." Moving the calls into a snippet "is not a valid migration". "Existing violations are migration debt, not precedent."
- **`content` is rendered in the caller's scope, before the block runs.** "Moving calls into a body does not expose the callee's settings, local assignments, or `block.id`." A parent block cannot pass anything to blocks in its body. `blocks/card.liquid` repeats this: "The body renders in caller scope before the shell's settings are available."
- **Container-owned layout.** "every generic page region gets its own `container` block… Callers pass all layout classes". Default tag `<section>`. A "bespoke region block" (only `featured-collection` today) owns its own `<section>` and is not wrapped.
- **Every block** has a `{% doc %}` header with typed `@param` lines and a `{% schema %}` tag, and accepts `class` ("Tailwind utilities for the top-level element") and `attributes` ("raw attribute passthrough").
- **Self-contained blocks** have no body outlet: "Intentionally self-contained blocks (e.g. `variant-picker`, which generates option values) omit the outlet; their callers still use `{% block %}{% endblock %}` with an empty body. Bodyless blocks must not hide otherwise editable children."
- **No content params.** "Don't give blocks content params such as `title`, `body`, `heading`, or `subheading`… Put the copy in `text` blocks at the template call site instead. Exception: `richtext` exposes a schema-backed `text` setting because Shopify dynamic sources can only connect through settings."
- **Block vs snippet vs inline.** "Merchant-editable visual storefront element → block. Internal utility → snippet." "Structural or decorative markup → write it directly in the template." Snippets receive body content only as captured strings: "Pass body content with `{% capture %}` and a named `content:` param."
- **Flat hierarchy** preferred: `template > container > block`.

`{% doc %}` format as used (from `blocks/container.liquid`): free-text description, `@param {type} [name] - text` (brackets mean optional, `@required` suffix for required), then `@category`, `@renders`, optional `@context`, and one or more `@example` blocks. Schema-setting ids are deliberately absent from `@param` ("keep its ID out of `{% doc %}` params").

`{% schema %}` as used: `"name": "t:blocks.<key>"` plus a `settings` array. Three blocks have no settings (`pagination`, `predictive-search`) or an empty array (`gift-card`). `visible_if` expressions may read variables the block file assigns (`"visible_if": "{{ effective_fill == 'color' }}"` in `container`; `"{{ inert != true }}"` in `button`, with the comment "`visible_if` only resolves names this file binds").

Templates may also declare a layout: `{% layout 'password' %}` (`templates/password.liquid`) and `{% layout none %}` (`templates/gift_card.liquid`, which prints its own `<html>`).

### 1.2 Settings and the kwarg mechanism

One identifier serves three roles (`AGENTS.md` "Merchant settings"):

- "Each schema setting has one API: bare `<id>`. Read it inside the block using the bare name".
- "Callers override a schema setting with bare kwargs: `variant: 'sm'`. The dotted `block.settings.*` form is no longer allowed." (`blocks/button.liquid` names the check: "fails `validate:block-settings`".)
- Resource settings take the object, not a handle: `product: product`, `collection: collection`.

So a call site writes `{% block 'heading', tag: 'h1', variant: 'lg', class: 'mb-8' %}` where `tag` and `class` are doc params and `variant` is a schema setting. The syntax is the same.

A third kind of kwarg exists: `block.name: 't:blocks.product_card'` renames the block in the editor for that usage (`templates/collection.liquid:56`, 9 call sites). Its semantics are not documented in the theme. **UNVERIFIED** beyond that usage.

Limits stated: "Aim for 3 or fewer styling settings per block schema by default", with an exception that requires "a short Liquid comment immediately before the schema documenting why" (`main-menu`, `variant-picker`, `video`, `container` carry such comments). "The cap does not apply to content settings."

`block.shopify_attributes` does not appear anywhere in the theme. How the editor finds a block's root element is not visible in this code. **UNVERIFIED**; presumably the platform handles it for `{% block %}` tags. `block.id` is used three times, only to build element ids (`quantity-selector`, `video`, `gift-card`). `request.design_mode` is used once (`button`: disabled buttons keep pointer events in the editor).

Editor values are literal Tailwind class names in most schemas:

```json
{ "value": "py-16", "label": "t:blocks.container_settings.padding_medium" }
```
(`container`; likewise `rounded-card`, `text-start`, `aspect-square`, `button-primary`, `swatch-md`, `w-24`). `heading` and `text` are the exception: semantic values (`2xl`…`sm`) mapped by a `case` to complete utility strings.

### 1.3 Styling

- **Tailwind v4 utilities in markup are the default.** "no BEM or component CSS files", "Do not create custom component class names to recover component boundaries", "Do not add component CSS files."
- **One authored stylesheet:** `config/styles.css`, which starts

  ```css
  @import "tailwindcss" source(none);
  @source "../assets/*.js";
  @source "../blocks/**/*.liquid";
  @source "../snippets/**/*.liquid";
  @source "../templates/**/*.liquid";
  @source "../layout/**/*.liquid";
  ```
- **Compilation is done by the platform tooling, not the theme.** "Canvas/Sidekick compiles that source and persists generated `assets/styles.min.css` after theme changes; never edit the generated asset or add alternate CSS entrypoints." "Classic Edit Code alone does not invoke the compiler." `DESIGN.md`: "A Tailwind JIT compile runs on change". The layout loads only the generated file: `{{ 'styles.min.css' | asset_url | stylesheet_tag: preload: true }}`.
- **Static visibility rule.** "Literal utility strings inside blocks are discovered by Tailwind; do not construct class names from fragments." "Keep class names complete and statically visible in scanned files, or safelist a finite set with `@source inline("...")`; never assemble utility names dynamically." `DESIGN.md` adds that candidates may sit in "scanned markup, schema values, literal mappings, or embedded LiquidDoc examples".
- **Escape hatches, in order:** `@theme` tokens; `@layer base` element defaults; `@utility` only for "single-concern, component-agnostic" primitives; `@layer components` classes; one inline `{% style %}` per block for CSS utilities cannot express, only for blocks that "render at most once per page" (`gift-card` is the one user).
- **Despite the rule, 27 component classes exist** in `@layer components` (`DESIGN.md` index): `button-primary|secondary|outline|ghost|surface`, `quantity-selector-outlined|filled`, `swatch-sm|md|lg`, `richtext`, `overlay-panel`, `placeholder-texture`, `stagger-fade-in`, `remove-icon-top|bottom`, and 11 `nav-*` classes (about 350 lines of nav dropdown CSS). The file's own comment explains the layer choice: "Defined in @layer components so that Tailwind utility classes passed via the `class` parameter can reliably override variant styles. Cascade priority: base < components < utilities."
- **Element-selector base styles** style all text inputs, `textarea`, `select`, `[popover]`, `[role="option"]`, unclassed `ul/ol/p/a`, and set `display: block` for 8 custom-element tags.

Tokens (`config/styles.css` `@theme`), exact values:

| Group | Tokens |
|---|---|
| Surfaces | `--color-surface: #ffffff`, `--color-surface-secondary: #f5f5f5`, `--color-on-surface: #171717`, `--color-on-surface-secondary: #61697a`, `--color-border: #e5e7eb` |
| Accent, interactive | `--color-accent: #2563eb`, `--color-interactive: #171717`, `--color-interactive-text: #ffffff` |
| Buttons | `--color-button-primary: var(--color-interactive)`, `-primary-text: var(--color-interactive-text)`, `-secondary: var(--color-border)`, `-secondary-text: var(--color-on-surface)`, `-outline-border` and `-outline-text: var(--color-interactive)` |
| Commerce, status | `--color-sale: #dc2626`, `--color-compare: #6b7280`, `--color-success: #059669`, `--color-warning: #d97706`, `--color-warning-text: #171717`, `--color-critical: #dc2626`, `--color-info: #2563eb` |
| Overlay | `--color-overlay: rgb(0 0 0 / 0.95)`, `-strong: … / 0.7`, `-subtle: … / 0.5` |
| Radius | `--radius-sm: 0.25rem`, `--radius: 0.5rem`, `--radius-lg: 0.75rem`, `--radius-button: 0.5rem`, `--radius-card: 0`, `--radius-input: 0.5rem` |
| Fonts | `--font-body`, `--font-heading`: `system-ui, -apple-system, sans-serif` (replaced at runtime) |
| Easing | `--ease-ui: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, `--default-transition-timing-function: var(--ease-ui)` |
| Layout | `--spacing-page: 80rem`, `--spacing-margin: max(1rem, var(--safe-area-inset-inline))` (2.5rem from 48rem up), `--spacing-touch-target: 2.75rem`, `--spacing-dialog-max-height: 85dvh`, `--spacing-hero: 60dvh`, `--spacing-drawer-width: 480px`, `--spacing-notification-width: min(400px, …)` |
| Shadows | `--shadow`, `--shadow-lg`, `--shadow-xl` (Tailwind-like values, re-declared) |
| Other | `--aspect-landscape: 16/9`; seven `--safe-area-inset-*` variables on `:root` |

Scales encoded in blocks:

| Block | Value → classes |
|---|---|
| `heading` | `2xl` `text-7xl`, `xl` `text-6xl`, `lg` `text-5xl` (default), `md` `text-4xl`, `sm` `text-3xl`; all `font-heading text-pretty`, regular weight |
| `text` | `lg` `text-lg`, `md` `text-base` (default), `sm` `text-sm`; all `font-body text-pretty` |
| `overline` | `font-body text-xs font-medium uppercase tracking-wider text-pretty` |
| `price`, `main-menu` | a different nine-step scale: `display` (`text-5xl font-light`), `heading-xl` (`text-4xl font-light`), `heading-lg`, `heading-md`, `heading-sm`, `body-lg`, `body`, `body-sm`, `overline` |
| `container`, `header`, `footer` padding | none, `py-8`, `py-16`, `py-24`, `py-32` |
| Button default size | `padding: 0.375rem 0.75rem; font-size: 0.875rem` (zero specificity); call sites usually pass `h-11 px-4 text-sm rounded-button` |
| `image` aspect ratio | `aspect-auto`, `aspect-square`, `aspect-video`, `aspect-[3/4]`; srcset widths `375,550,750,1100,1500` |

Design language (`DESIGN.md`): "intentionally brandless"; "Achromatic ink-on-white"; one accent "as punctuation"; "Flat cards (no radius), softly rounded buttons and inputs"; "Manrope body, Inter headings, with regular-weight headings so hierarchy comes from scale"; motion "~300ms entrances / ~200ms exits"; "No ornament… Shadows are reserved for overlays and dialogs." Hard constraints include contrast "4.5:1 for body text, 3:1 for large text, and 3:1 for visual cues", motion gated behind `motion-safe:`, press feedback `active:scale-[0.97]`, a 44px touch target, and logical properties for RTL (`ms-`, `ps-`, `start-`, `text-start`; `<bdi>` around prices and codes).

Theme settings (`config/settings_schema.json`) are four flat groups: `theme_info`; one `color_palette` setting with five slots (`surface`, `on_surface`, `surface_2`, `accent`, `interactive`); two `font_picker`s (`type_primary_font` default `manrope_n4`, `type_heading_font` default `inter_n4`); three radius selects (`border_radius_buttons|cards|forms`, values `sharp|rounded|pill`). `config/settings_data.json` is `{"current": {}}`.

The bridge is `snippets/theme-styles.liquid`, rendered in `<head>` after the stylesheet. It prints `@font-face` and a `:root { … }` block that re-declares the settings-backed variables (`--font-body`, `--font-heading`, `--radius-button|card|input` as `0`, `0.5rem` or `9999px`, the five palette colors, and derived `--color-interactive-text` chosen by `color_brightness > 128`). `DESIGN.md` calls this the "Token API": public tokens change through Theme Settings; private tokens change in `config/styles.css`; "Keep the schema default and the CSS initial value identical; in the theme repository, `spec:audit` fails when they diverge."

### 1.4 JavaScript

- "one custom element per JS file, registered with `customElements.define()`"; no frameworks, "base component classes, refs systems, or declarative event frameworks". All elements are light DOM and prefixed `s-`.
- **Loading.** Each call site prints its own module tag: `<script type="module" src="{{ 's-quantity-selector.js' | asset_url }}"></script>` (inside the block, so once per instance; the browser dedupes modules). Four global modules load from `snippets/theme-scripts.liquid`.
- **Import map** (`snippets/import-map.liquid`, first thing in `<head>`):

  ```html
  <script type="importmap">
  { "imports": {
      "@shopify/standard-events": "https://cdn.shopify.com/storefront/standard-events.js",
      "@theme/cart-feedback": "{{ 'cart-feedback.js' | asset_url }}",
      … five more @theme/* entries …
  } }
  </script>
  ```
  "Never use relative `./` or `../` imports between `assets/*.js` modules; relative resolution drops the importing asset's `?v=` cache key."
- **`@shopify/partial-rendering` is imported by three modules but is not in this import map.** Where that specifier resolves is not visible in the theme (probably injected through `content_for_header`). **UNVERIFIED.**
- **Invoker Commands** for every button action: "no `data-action`, no inline `onclick`; use `commandfor`/`command`." Built-in commands open and close native dialogs:

  ```liquid
  {% block 'button', commandfor: 'cart-drawer', command: 'show-modal', … %}
  ```
  Custom commands start with `--` and are handled by the target element's `command` listener:

  ```js
  this.addEventListener('command', (e) => {
    const lineKey = e.source.dataset.lineKey;
    if (e.command === '--update-quantity') { … }
    if (e.command === '--remove') { … }
  ```
  (`assets/s-cart.js`). Custom commands in use: `--update-quantity`, `--remove`, `--apply-discount` (`s-cart`); `--step-up`, `--step-down` (`s-quantity-selector`); `--play` (`s-video`); `--pop` (`s-mobile-nav`); `--toggle` (`s-localization-dropdown`); `--copy-code` (`s-gift-card`); `--toggle-password` (`s-dialog`).
- **Polyfill:** `snippets/command-polyfill.liquid` is an inline classic script that no-ops when `HTMLButtonElement.prototype.hasOwnProperty('commandForElement')` and otherwise handles `show-modal`, `close`, `show-popover`, `hide-popover` and `--custom` with one delegated click listener.
- **Native elements first:** `<dialog>` (cart drawer, mobile nav, filter drawer, predictive search, image zoom, two password dialogs), `<details>` (filter groups, discount code, cart note, mobile localization). The native `popover` attribute has base CSS in `config/styles.css` but no markup uses it; only `s-notification.js` sets `popover="manual"` on its portal.
- **Partial rendering.** In Liquid, a named inline region:

  ```liquid
  {% partial 'cart-count' %}
    … button with the item-count badge …
  {% endpartial %}
  ```
  In JS, exactly two calls:

  ```js
  import { partials } from '@shopify/partial-rendering';
  html = await partials.fetch(...partialNames, { signal });           // s-cart.js
  const html = await partials.fetch(...names, { url: url.toString(), signal });   // s-live-form.js
  const html = await partials.fetch('product-form', 'product-title', { url: url.toString(), signal: controller.signal }); // s-variant-picker.js
  …
  partials.apply(html);
  ```
  `apply` is wrapped in `document.startViewTransition` through `@theme/view-transition`. Partials "do not map to files", can sit "anywhere in templates/layouts, including captured snippet content", and "can span template/layout boundaries". Names are a contract with JS. Names in use: `cart-items`, `cart-count`, `cart-drawer`, `cart-drawer-count`, `cart-drawer-footer`, `product-title`, `product-form`, `collection-count`, `collection-chips`, `collection-filters`, `collection-grid`, `search-content`, `search-toolbar`, `search-chips`, `search-filters`, `predictive-results`, `predictive-meta`. A comment in `s-cart.js` notes "partials.apply() preserves form control state".
- **Events.** Theme events: `s-live-form:updated`, `s-quantity:change`, `s-video:play`, `s-cart:opened`, `s-notification:add` (dispatched on `document` to raise a toast). Platform analytics: `@shopify/standard-events` (`PageViewEvent`, `ProductSelectEvent`, `CollectionUpdateEvent`, `SearchUpdateEvent`, `createViewEventElement()` which backs `<s-view-event>`), fed by the Liquid filter `standard_event_data`.
- **Strings for JS** come from `data-*` attributes written by Liquid (`data-updated-message="{{ 'cart.updated' | t }}"` on `#sr-announcer`).

### 1.5 Feature mechanics

**Cart.** Mutations go through Standard Actions, not the AJAX cart API:

```js
const result = await window.Shopify.actions.updateCart(
  { lines: [{ id: lineKey, quantity }] },
  { event: { context: 'cart' }, signal }
);
```
(`s-cart.js`; also `{ discountCodes: [code] }` and `{ note }`). No `/cart/add.js`, `/cart/change.js` or `routes.cart_*` URL appears in any file. `snippets/standard-actions-config.liquid`, rendered before `content_for_header`, configures two actions:

```js
actions.openCart.configure({ async handler() { … return handleOpenCart(); } });
actions.updateCart.configure({
  eventTarget: (meta) => { … return cartEventTarget(); },
  async handler(defaultHandler, payload, options) { … return handleUpdateCart(defaultHandler, payload, options); },
});
```
`assets/standard-actions-override.js` `handleUpdateCart` awaits `defaultHandler()`, then calls `customElements.get('s-cart').refreshMountedCarts()`, which fetches the union of every mounted `<s-cart data-partials="…">` and applies it, then announces. `handleOpenCart` calls `showModal()` on `#cart-drawer`. The cart is rendered three times from server HTML (header count, drawer, cart page); there is no client cart state. Without JS, `{% form 'cart', cart %}` with a `name="checkout"` submit button still works; quantity buttons and remove do not.

**Product form and variant picker.** `templates/product.liquid` wraps `{% form 'product', product %}` in `<s-product-form>` inside `{% partial 'product-form' %}`. On submit, `s-product-form.js` builds a line from the form data (`id`, `quantity`, `selling_plan`, `properties[...]`), calls `Shopify.actions.updateCart({ lines: [line] }, { event: { context: 'product', … } })`, then `Shopify.actions.openCart?.()`. "If Standard Actions are unavailable, leave the Shopify product form native." The hidden `<input type="hidden" name="id">` is the single source of the selected variant. `s-variant-picker.js` listens for `change`, sets `?variant=` with `history.replaceState`, fetches `product-form` and `product-title` partials for that URL, and applies them. Options render as native radios (pills or swatches) or a native `<select>`. Without JS, changing an option does not change the hidden `id` (the first available variant is added).

**Filters, sort, search, predictive search.** One element, `<s-live-form partial="a,b,c" debounce="300">`, wraps a native `<form method="get">`. Any `input`/`change` serialises the form into the URL, `history.replaceState`s, fetches the listed partials for that URL and applies them. Predictive search reuses it against `routes.search_url` with `data-no-url-sync` (not `/search/suggest`). `<s-predictive-search>` adds the ARIA combobox behaviour on top. Without JS the forms submit natively; `<noscript>` submit buttons exist in `snippets/filters.liquid`.

**Pagination.** Plain links from the `paginate` object (`blocks/pagination.liquid`). No JS.

**Localization.** `snippets/localization-form.liquid` renders `{% form 'localization' %}` with one submit button per country (`name="country_code"`) and a language `<select>` plus submit button, inside `<s-live-form native-submit>`. On desktop the panel is a `hidden` div toggled by `<s-localization-dropdown>` (`command="--toggle"`); on mobile it is a `<details>`.

**Header and menus.** `layout/theme.liquid` composes the header inline inside `{% block 'header' %}`: menu button, `logo` block, `main-menu` block, localization, search button, `<shopify-account>` (a platform web component styled through about 20 `--shopify-account-*` variables), and the cart button inside `{% partial 'cart-count' %}`. `main-menu` prints a four-level desktop nav (hover in CSS, `s-nav-dropdown` for buttons and Escape) and then renders `snippets/mobile-nav-drawer.liquid`, a `<dialog>` drawer with JS-driven push panels (`s-mobile-nav`).

**Customer accounts.** No `templates/customers/*`. The theme relies on `<shopify-account>` and hosted accounts.

**Routes.** Only three route values are used anywhere: `routes.root_url` (8), `routes.all_products_collection_url` (5), `routes.search_url` (5). There is no link to the cart page in the header or drawer.

**Translations.** Every string is `{{ 'namespace.key' | t }}`. `locales/en.default.json` has 19 namespaces (`general`, `accessibility`, `cart`, `product`, `products`, `collections`, `filters`, `forms`, `search`, `localization`, `header`, `footer`, `blog`, `contact`, `page`, `password`, `gift_card`, `home`, `404`). Schema labels use `t:` keys from `en.default.schema.json` (`general`, `direction`, `settings`, `variants`, `blocks`, `typography`). Block tag arguments cannot contain filters ("Assign a filtered value immediately before the call"). Rich text uses `_html` sibling keys.

### 1.6 Performance, accessibility and checks

- LCP: `snippets/lcp-preload.liquid` emits a per-template image preload whose `imagesizes` "must stay byte-identical to the `sizes` of the template's first rendered image". Templates hand-compute `sizes` strings and eager/lazy/`fetchpriority` per loop index.
- The footer uses `[content-visibility:auto]`; grids use `contain-paint`; a one-shot `stagger-fade-in` skips the first row.
- Accessibility conventions: skip link, `#sr-announcer` live region, `sr-only` price labels, `aria-current="page"`, `aria-disabled` instead of `disabled` on buttons, focus restore after partial swaps (large parts of `s-cart.js` and `s-variant-picker.js`), `role="list"` on unstyled lists, safe-area insets.
- Checks named in the theme (none of their code is in this folder): `validate:block-settings`; `spec:audit` (import map entries, setting default vs CSS value, `no-domcontentloaded`); `pnpm run design:generate` (DESIGN.md index); "the theme CSS linter fails on" `{% stylesheet %}`; a review skill `reviewing-theme-css`; `tests/suites/contracts/lcp-preload-image-parity.spec.js`; `@partial-fetch-contract` comments in JS; `tailwindcss canonicalize`. Theme Check itself is not mentioned by name.
- Liquid parsing rules: whitespace between a tag name and a Liquid delimiter (`<li {% ... %}`); no filters in `{% block %}`/`{% render %}` arguments; `#` comments inside `{% liquid %}`; Liquid is parsed inside `<script>`.

---

## 2. Inventory

"Ripple" names are from the proposed v1 set; "none yet" means the proposal needs an answer.

### 2.1 Blocks (22)

| Block | Purpose | Doc params (besides `class`, `attributes`) | Schema settings | Ripple component |
|---|---|---|---|---|
| `container` | Page region wrapper with background colour or image and vertical padding | `tag`, `background_image_loading`, `_fetchpriority`, `_sizes`, `_widths` | `fill`, `background`, `background_image`, `padding` | Section/Container (plus a Hero pattern for the image case) |
| `header` | `<header>` wrapper | none | `background`, `padding` | Header shell |
| `footer` | `<footer>` wrapper | none | `background`, `padding` | Footer shell |
| `featured-collection` | `<section class="py-16">` shell whose `collection` setting binds the editor picker to the caller's source | none | `collection` | ProductGrid / FeaturedCollection blueprint |
| `heading` | Heading, five sizes, tag independent | `tag` | `color`, `variant` | Heading |
| `text` | Body text, three sizes | `tag` | `color`, `variant` | Text |
| `overline` | Eyebrow text | `tag` | `color` | Text (`variant: overline`) or Eyebrow |
| `richtext` | Prose wrapper for merchant HTML | none | `text` (richtext, dynamic source) | RichText / Prose |
| `link` | Standalone underlined link | none | `url` | Link |
| `button` | `<button>` or `<a>`; variant classes | `type`, `disabled`, `commandfor`, `command`, `name`, `value`, `autofocus`, `inert` | `variant`, `background_color`, `url` | Button, IconButton |
| `image` | Responsive `<img>` or placeholder | `fallback_image`, `sizes`, `loading`, `widths`, `alt`, `seed`, `placeholder_kind` | `image`, `aspect_ratio` | Image, Placeholder |
| `video` | Hosted video or click-to-load YouTube/Vimeo | `caption_url` | `video`, `ratio`, playback toggles, `youtube_id`, `vimeo_id` | Video |
| `card` | `<article>` shell with whole-card link | `url`, `aria_label`, `link_mode` | `background_color`, `border_radius`, `alignment` | Card; with body: ProductCard, CollectionCard, ArticleCard |
| `price` | Price, sale, compare-at, range | `price`, `compare_at_price`, `price_min`, `price_max`, `show_currency` | `color`, `variant` | Price |
| `quantity-selector` | Stepper around a number input | `name`, `id`, `value`, `min`, `max`, `step`, `disabled` | `style`, `button_color` | QuantityInput |
| `variant-picker` | One product option as swatches, pills or select | `product`, `option`, `form_id`, `option_type`, `show_selected_value` | `style`, `size`, `shape`, `radius` | VariantPicker (option group), Swatch |
| `pagination` | Numbered pagination links | `paginate`, `prev`, `next`, `summary` | none | Pagination |
| `logo` | Brand image or shop name, links home | none | `image`, `size`, `height` | Logo |
| `main-menu` | Desktop nav with dropdowns; renders the mobile drawer | `mobile_nav_close_button`, `mobile_nav_localization_submit` (captured HTML) | `menu`, `variant`, `color`, `dropdown_color` | NavigationMenu + MobileNav |
| `basic-menu` | Simple link list (footer) | `aria_label` | `menu` | LinkList / FooterMenu |
| `predictive-search` | `<s-predictive-search><s-dialog><dialog id="predictive-search">` shell | none | none | PredictiveSearch / SearchDialog |
| `gift-card` | Whole gift-card page content | `id` | none | GiftCard (none yet) |

### 2.2 Snippets (22)

| Snippet | Purpose | Params | Ripple component |
|---|---|---|---|
| `drawer` | `<s-dialog><dialog>` drawer with header/body/footer | `id`, `content`, `position`, `title`, `close_button`, `header`, `footer`, `class`, `attributes`, `close_on_navigate` | Drawer |
| `cart-drawer` | Renders `drawer` with id `cart-drawer`, loads `s-cart.js` | `header`, `content`, `footer`, `attributes` | CartDrawer |
| `cart-line-item` | Cart row, full or compact | `item`, `cart_id`, `compact`, `media`, `unit_price`, `remove_button`, `class`, `attributes` | CartLineItem |
| `cart-discount-code` | `<details>` with code input and apply button | `cart_id`, `input_id`, `class` | DiscountCodeInput |
| `cart-discount-list` | Applied cart discounts | `cart`, `class` | CartSummary part |
| `filters` | Toolbar, sort select, active chips, filter dialog, their partials | `page_type`, `resource`, `drawer_id`, five captured buttons, `search_terms` | Filters, SortSelect, FilterChips |
| `filter-group` | One facet in a `<details>` | `filter` | FilterGroup, PriceRange |
| `filter-value` | One checkbox row or swatch | `filter`, `value` | Checkbox, Swatch |
| `swatch` | Variant swatch radio | `swatch`, `name`, `value`, `size`, `shape`, `selected`, `disabled`, `unavailable`, `data_variant_id`, `class`, `attributes` | Swatch |
| `localization-form` | Country and language form as dropdown or accordion | `show_country`, `id`, `class`, `presentation`, `show_labels`, `submit_button` | LocaleSelector / CountrySelector |
| `mobile-nav-drawer` | Mobile nav dialog with push panels | `menu`, `close_button`, `localization_submit` | MobileNav |
| `placeholder-texture` | Seeded gradient placeholder | `kind`, `seed`, `class`, `attributes`, `aria_label`, `alt` | Placeholder |
| `notification-host` | `<s-notification>` toast host | none | Toast region |
| `sr-announcer` | Global live region and cart messages | none | Announcer (none yet) |
| `skip-link` | Skip to content | none | SkipLink |
| `command-polyfill` | Invoker Commands fallback | none | runtime (none yet) |
| `import-map` | Module import map | none | runtime loader |
| `theme-scripts` | Global module tags | none | runtime loader |
| `theme-styles` | Settings → CSS variables, fonts | none | token bridge |
| `standard-actions-config` | Configures `Shopify.actions` | none | data layer |
| `lcp-preload` | Per-template LCP image preload | none | none yet |
| `meta-tags` | SEO, Open Graph, JSON-LD, hreflang | none | none (host concern) |

### 2.3 Templates and layouts

| File | Purpose | Notable content | Ripple blueprint |
|---|---|---|---|
| `layout/theme.liquid` (393 lines) | Shell | Header, predictive search form and results (lines 123–249), cart drawer (254–341), footer | Layout, Header, Footer, CartDrawer, SearchDialog |
| `layout/password.liquid` | Minimal shell | | Password layout |
| `templates/index.liquid` | Home | Hero container, featured collection grid, placeholder cards | Home |
| `templates/product.liquid` | Product | Gallery with zoom dialogs, title/price partial, form partial, description | Product |
| `templates/collection.liquid` | Collection | Live form, filters, grid partial, pagination | Collection |
| `templates/list-collections.liquid` | Collections list | Collection cards | Collections |
| `templates/search.liquid` | Search | Live form, four result card kinds | Search |
| `templates/cart.liquid` | Cart | `s-cart`, line items, summary, note | Cart |
| `templates/blog.liquid`, `article.liquid` | Blog | Article cards; comments and comment form | Blog, Article |
| `templates/page.liquid`, `page.contact.liquid` | Page, contact form | Hand-written fields with error wiring | Page, Contact |
| `templates/404.liquid` | Not found | Poster typography in arbitrary values | NotFound |
| `templates/password.liquid` | Password page | Two dialogs plus `<noscript>` `<details>` forms | Password |
| `templates/gift_card.liquid` | Gift card (`{% layout none %}`) | | GiftCard |

Block usage across templates and layouts: `button` 40, `text` 26, `image` 19, `heading` 17, `container` 12, `card` 10, `price` 7, `pagination` 5, the rest 1–3 each.

### 2.4 Custom elements and JS assets

| Element / file | Lines | Purpose | Ripple or library equivalent |
|---|---|---|---|
| `s-cart` (`s-cart.js`) | 517 | Cart commands, per-line debounce and abort, partial refresh, focus restore | `rp-cart` on Hydrogen cart store (4.5) |
| `s-live-form` | 393 | Form → URL → partial refresh | `rp-live-form` (none yet; needed in Liquid) |
| `s-variant-picker` | 341 | Variant change → partial refresh, rollback | VariantPicker element; Hydrogen `core/product` on Hydrogen |
| `s-product-form` | 197 | Add to cart through Standard Actions | ProductForm on Hydrogen cart store |
| `s-dialog` | 189 | Backdrop click, focus restore, close-on-navigate, open-on-connect, password toggle, breakpoint auto-close | `rp-dialog` enhancement (4.4) |
| `s-notification` | 302 | Toast queue, portal into open modal | Toast (`ui-toast`) |
| `s-mobile-nav` | 263 | Push-panel navigation | MobileNav |
| `s-nav-dropdown` | 145 | Disclosure buttons, Escape, hover sync | NavigationMenu (`ui-navigation-menu`) |
| `s-predictive-search` | 187 | Combobox keyboard and ARIA | PredictiveSearch (`ui-combobox`) |
| `s-quantity-selector` | 146 | Stepper, clamp, announce | QuantityInput |
| `s-localization-dropdown` | 144 | Toggle a hidden panel, outside click, Escape | Popover (native) |
| `s-video` | 200 | Click to load, preconnect, captions | Video |
| `s-product-image-zoom` | 72 | Preload zoom image on intent | Gallery / Lightbox |
| `s-gift-card` | 159 | Copy code, pointer tilt | none yet |
| `s-view-event` | 7 | Defines the Standard Events view element | analytics hook |
| `standard-actions-override.js`, `cart-feedback.js`, `live-region.js`, `quantity-rules.js`, `view-transition.js`, `page-view-event(-init).js` | 21–92 each | Shared helpers | Ripple runtime helpers |

Other assets: 14 `icon-*.svg` files (inlined with `inline_asset_content`), generated `styles.min.css`.

---

## 3. What is weak or complex

### 3.1 Composition

1. **Named slots are simulated with captures threaded through parameters.** Because blocks may only be called from templates and `content` is a single body, every extra region becomes a captured string. `templates/collection.liquid:14–31` captures five buttons to pass to one snippet:

   ```liquid
   {% render 'filters', page_type: 'collection', resource: collection, drawer_id: 'collection-filter-drawer', filter_trigger: collection_filter_trigger, toolbar_submit: collection_toolbar_submit, close_button: collection_filter_close_button, show_results_button: collection_results_button, drawer_submit: collection_drawer_submit %}
   ```
   `templates/search.liquid:46–62` repeats it. The cart row needs three captures per line (`media`, `unit_price`, `remove_button`), written twice (`templates/cart.liquid:25–36`, `layout/theme.liquid:271–282`). The layout captures two buttons to pass to the `main-menu` block, which forwards them to the `mobile-nav-drawer` snippet, which forwards one to `localization-form` (`layout/theme.liquid:47–54`, `blocks/main-menu.liquid:156`, `snippets/mobile-nav-drawer.liquid:63`). There are about 85 `capture` tags in templates, layouts, snippets and block docs.
2. **An icon button costs three statements,** repeated wherever one appears:

   ```liquid
   {%- capture cart_close_button_attrs -%}aria-label="{{ 'general.close' | t | escape }}"{%- endcapture -%}
   {% block 'button', commandfor: 'cart-drawer', command: 'close', variant: 'button-ghost', class: 'size-touch-target rounded hover:bg-transparent hover:opacity-70', autofocus: true, attributes: cart_close_button_attrs %}<span class="inline-flex items-center justify-center shrink-0 size-5" aria-hidden="true">{{- 'icon-x.svg' | inline_asset_content -}}</span>{% endblock %}
   ```
   The class string `size-touch-target rounded hover:bg-transparent hover:opacity-70` occurs 13 times; the icon wrapper span 14 times; `inline_asset_content` 51 times; the close-label capture 9 times. The accessible name travels through the raw `attributes` string because `button` has no label param.
3. **The product card is written out six times** (`index.liquid` twice, `collection.liquid`, `search.liquid`, `layout/theme.liquid`, and the doc example), about ten lines each, including this caller-carried workaround in every copy:

   ```liquid
   {% block 'price', …, class: 'text-sm font-medium self-start group-[.text-center]/card:self-center group-[.text-end]/card:self-end' %}{% endblock %}
   ```
   The caller must know that `card` puts `group/card` and an alignment class on its root. Collection and article cards are written twice each.
4. **Layout knowledge lives at call sites.** `max-w-page mx-auto px-margin` occurs 25 times. `container` owns only vertical padding ("the padding setting owns `py-*`"), so `templates/collection.liquid` opens a bare `{% block 'container' %}` and re-creates the width wrapper four times inside. The grid `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-1 gap-y-10` is typed four times.
5. **Image loading is hand-computed per loop.** Six to ten lines per grid decide eager/lazy and `fetchpriority`, and build a raw attribute string (`templates/collection.liquid:44–55`). `sizes` strings such as `(min-width: 1280px) 297px, (min-width: 1024px) calc((100vw - 92px) / 4), …` are derived by hand from the grid classes and duplicated in `snippets/lcp-preload.liquid`.
6. **Blocks used as shells produce odd contracts.** `button` needs an `inert` param that "Does not emit the HTML inert attribute" only to hide an editor control. `predictive-search` is a block whose caller "must provide #predictive-search-input, #predictive-search-listbox, [role="option"][data-ps-url], and [data-ps-result-count]". `gift-card` requires the caller to "derive its copy target and code description ID from the same `id` it passes".
7. **The layout is 393 lines** because the search dialog and cart drawer bodies must be authored there.
8. **Class strings are long.** 123 `class:` kwargs in templates and layouts; median 83 characters, longest 395. Markup-level examples: the left drawer class string in `snippets/drawer.liquid:78` is about 470 characters and is copied verbatim into `snippets/filters.liquid:124`.

### 3.2 Inconsistencies

- Three typography scales: `heading` (`2xl`…`sm`), `text` (`lg|md|sm`), and the nine-step `display … overline` list in `price` and `main-menu` (the `case` is duplicated verbatim in both files). `.richtext h1` is `text-4xl font-bold` while `heading` is regular weight.
- `AGENTS.md` shows `{% block 'text', tag: 'h2', variant: 'type-heading-lg', … %}`, a value `text` does not accept.
- `button` documents a `button-surface` variant and the CSS class exists, but the schema options omit it.
- `card` offers `rounded-[16px]`, an arbitrary value, against "Don't use arbitrary values… where a token utility exists".
- Variant values are class names in `button` (`button-primary`) and semantic names in `heading` (`lg`).
- `templates/index.liquid:6` says the hero preload is "in layout/theme.liquid"; it is in `snippets/lcp-preload.liquid`.
- `DESIGN.md` says to "respect the theme-settings cap in `AGENTS.md`"; `AGENTS.md` states a cap only for block settings.
- The rule says no component classes; 27 exist, and the nav dropdown is about 350 lines of them.
- Focus ring colour differs: buttons and links use `outline-accent`; form fields use `--color-interactive`; the video button uses `outline-interactive-text`.
- Form fields are styled by element selectors in `@layer base`, so templates also add per-field overrides (`class="border-on-surface aria-invalid:border-critical"` in `page.contact.liquid`), and three places restyle inputs with utilities (`cart-discount-code`, `filter-group`, quantity inputs).

### 3.3 Behaviour that is hand-rolled

- **`s-dialog` reads Tailwind class names to decide behaviour:** `if (this.#dialog.classList.contains(`${bp}:hidden`))`. Styling and behaviour are coupled through utility names.
- **`s-dialog` replaces `dialog.showModal`** on the instance to capture the trigger for focus restore.
- **`s-localization-dropdown`** (144 lines) re-implements what a native `popover` gives: toggle, outside click, Escape. The base CSS for `[popover]` is already in the stylesheet and unused.
- **Quantity stepping exists twice:** the `quantity-selector` block with `s-quantity-selector`, and separate inline stepper markup in `cart-line-item` (four near-identical 500-character button lines) handled by `s-cart`.
- **Focus restore and stale-response handling are re-implemented** in `s-cart` (about 200 of 517 lines), `s-live-form` and `s-variant-picker`. `s-cart` identifies a `<details>` by its summary text and a row by `closest('[style*="view-transition-name"]')`.
- **Toasts inside modals** need a special portal (`s-notification` moves a `popover="manual"` element into the open dialog) because content outside a modal dialog is inert.
- **Hover dropdowns, combobox, toast, tabs-like push panels** are all bespoke; UI SDK ships `ui-navigation-menu`, `ui-combobox`, `ui-toast` (see `ripple/docs/research/uisdk-web-elements.md`).
- **Cart state is implicit.** Every mutation refetches all cart partials; optimistic updates are limited to the quantity input. Hydrogen core has an optimistic cart store on the same Standard Actions API (4.5).

### 3.4 Pieces that do not work without JavaScript

(From source; not run.)

- Desktop country/currency panel: a `hidden` div opened only by `s-localization-dropdown`.
- Mobile navigation below the first level: sub-panels are reached only through `data-mobile-nav-push` buttons.
- Desktop submenus for keyboard users: disclosure buttons need `s-nav-dropdown` (mouse hover works in CSS; top-level links still navigate).
- Cart quantity steppers, remove, discount code and note saving. No update-cart submit exists.
- Variant selection: radios change, the hidden `id` does not.
- External video (the iframe is in a `<template>`), toasts, gift-card copy.
- Every `commandfor` button depends on native Invoker Commands or the inline polyfill. With JS off in a browser without native support, the cart, search, menu and filter buttons do nothing, and the header has no link to `/cart` or `/search`.

### 3.5 Accessibility and robustness gaps

- `attributes` is an unescaped raw string on every block. The `image` doc warns it "Must be developer-supplied literals". It is the only way to set `id`, `aria-label`, `aria-describedby`, `loading` and `fetchpriority` on most blocks, so it is used constantly.
- The whole-card link pattern renders two links to the same URL per card in `content` mode (one `aria-hidden`), and the caller must add the third inside the body.
- The contrast heuristic for `--color-interactive-text` is `color_brightness > 128`, which `AGENTS.md` itself says is "a light-or-dark heuristic rather than a WCAG ratio".
- ARIA wiring is by hand-written ids: `aria-labelledby="cart-drawer-title"` is passed as a raw attribute string while the `<h2 id="cart-drawer-title">` is written in a capture elsewhere.
- Partial names, element ids and `data-*` hooks form string contracts across Liquid, JS and CSS with only comments to guard them (for example `#predictive-search` is styled by id in `config/styles.css`).
- `styles.min.css` goes stale when the theme is edited outside Canvas/Sidekick.

---

## 4. Conflicts and fits with the Ripple proposal

### 4.1 Styling

**Tension.** The theme says utilities by default, no component classes, one stylesheet compiled by Canvas/Sidekick. Ripple proposes `rp-` component classes, props printed as `data-` attributes, CSS precompiled so no build is needed.

**What the theme's own code shows.**

1. Utilities cannot express props in Liquid. Tailwind only sees complete literal strings, so a block cannot turn `gap: 4` into `gap-4`. The theme's answer is to have no layout props at all and make callers type classes, and to put class names in schema values (`"value": "py-16"`). That is the direct cause of 3.1 items 3, 4 and 8.
2. Wherever state, variants or descendant selectors were needed, the theme fell back to component classes (27 of them) or to utility spellings like `[:where(&)]:fixed`, `group-[.text-center]/card:self-center`, `[&[data-aspect-ratio=aspect-auto]]:absolute`.
3. Components already sit in `@layer components` precisely so that `class` utilities override them. Ripple needs the same ordering.
4. The compile step is not always present ("Classic Edit Code alone does not invoke the compiler").

**Same HTML across hosts.** If the Liquid binding printed utility strings and other hosts printed `rp-` classes, the contract would break. If every host printed utility strings, every host would need a Tailwind build and the recipe strings would have to be duplicated in each binding. `rp-` class plus `data-` attributes is the only option here that is identical everywhere, needs no build, and lets a Liquid block forward a prop value without constructing a class name.

**Recommendation.**

1. **Ripple's HTML contract wins inside components:** one `rp-<component>` class on the root, props as `data-*` attributes, parts as `rp-<component>-<part>` classes. This holds in Liquid as in every host.
2. **Ripple CSS is plain CSS in `@layer components`,** reading only CSS variables. Because it has no Tailwind directives, the same file works precompiled or passed through a Tailwind build.
3. **In a Liquid theme it enters through the single authored stylesheet.** The scaffolder writes Ripple's CSS into `config/styles.css` (a delimited region, or an `@import` of `config/ripple.css` if the Canvas compiler resolves relative imports, which is **UNVERIFIED**), so Canvas/Sidekick emits it inside `assets/styles.min.css`. This keeps "Single global CSS source" true and deliberately replaces "no component CSS / no custom component class names" with "component CSS lives in Ripple's layer; templates use props".
4. **Tailwind stays as the escape hatch, exactly through the existing `class` convention,** and for one-off template layout. Every Ripple block accepts `class` and `attributes`. Utilities beat Ripple rules because of layer order, not specificity; Ripple selectors should stay at single-class or single-attribute specificity.
5. **Token names are Tailwind v4 `@theme` names** so one variable drives both Ripple CSS and utilities (`--color-surface` gives `bg-surface`). Ripple should adopt the theme's settings-backed names where they exist (`--color-surface`, `--color-surface-secondary`, `--color-on-surface`, `--color-accent`, `--color-interactive`, `--color-interactive-text`, `--color-border`, `--radius-button|card|input`, `--font-body`, `--font-heading`) because the platform's `color_palette` setting has exactly those five slots.
6. **Breakpoint tokens in responsive props use Tailwind's names and widths** (`sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem), so `data-columns="1 md:2 lg:4"` and `class="md:hidden"` agree.
7. **Schema option values become prop tokens, not class names** (`"value": "md"`), mapped to `data-` attributes. This also removes class names from merchant data in `settings_data.json`.
8. **Behaviour must never read utility class names** (the `md:hidden` check in `s-dialog`). Use attributes.

**Fallbacks.**

- If adding to `config/styles.css` is not acceptable or no compiler runs (Classic Edit Code, theme installed from a zip): ship precompiled `assets/ripple.css` and load it with a second `stylesheet_tag` after `styles.min.css`. It must declare its rules in `@layer components` and the page must establish the layer order (`@layer theme, base, components, utilities;`, which Tailwind's output already declares). The HTML does not change.
- If Shopify rejects `data-` attribute props: keep `rp-` classes for variants and print enumerated, non-responsive props from literal `case` maps (the `heading` pattern), leaving responsive layout to `class`. This loses responsive props in Liquid and is strictly worse for agents.

**Size.** The compiled Tailwind file is 15.9 kB gzip today. A measurable requirement for the spec: a Ripple base theme's total CSS should not exceed that for the same pages, since component CSS replaces thousands of repeated utility tokens in HTML. Not measured here.

### 4.2 Composition

**Tension.** Ripple has compound components (Card with Image, Price, Button; Dialog with trigger, content, title). The theme forbids blocks calling blocks, forbids snippets calling blocks, and gives a parent no way to pass context to its body.

**What fits.**

- `{{ content }}` is the children slot. A compound component whose parts are siblings in the caller's body works today (`card` with `image`, `text`, `price`).
- Parts cannot receive context at render time, and UI SDK parts do not need it: they find their root through DOM ancestry or `for="<root id>"` (`ripple/docs/research/uisdk-web-elements.md` 2.1). The same rule suits Liquid: **parts relate to their root by nesting in the DOM or by an explicit `for` id, never by render-time context.**
- The theme already blesses self-contained, data-driven blocks: `variant-picker`, `pagination`, `basic-menu`, `main-menu`, `gift-card`.
- Blocks may render snippets (`image` → `placeholder-texture`, `variant-picker` → `swatch`, `main-menu` → `mobile-nav-drawer`).

**Proposed mapping.**

| Ripple component kind | Liquid form | Rule status |
|---|---|---|
| Primitive with children (Button, Heading, Text, Stack, Grid, Card, Container, Badge, Link) | Block with `{{ content }}` | Unchanged |
| Leaf primitive (Image, Price, Icon as a snippet, QuantityInput, Pagination, Swatch group) | Self-contained block; `Icon` is a snippet (`{% render 'icon', name: 'x' %}`) because the theme classes icons as utilities | Unchanged |
| Compound overlay (Dialog, Drawer, Popover, Accordion, Tabs) | Root block with `{{ content }}`, plus part blocks only where a part carries wiring: `dialog-title` (prints the id the root references), `dialog-close` (prints `commandfor`, `command="close"`, a translated label and the icon). Purely structural parts (`body`, `footer`) are plain elements with documented `rp-` classes, which the theme allows as "structural markup" | Unchanged |
| Resource pattern (ProductCard, CollectionCard, ArticleCard, CartLineItem, Filters, SortSelect, LocaleSelector, NavigationMenu, MobileNav, CartSummary) | **Self-contained block with a default body and an override:** `{% if content != blank %}{{ content }}{% else %}default markup{% endif %}`. The default markup prints Ripple contract HTML through internal `rp-*` snippets that the primitive blocks also render, so `price` the block and the price inside `product-card` are byte-identical | **Deliberate change** to "Moving those calls into a snippet… is not a valid migration", limited to resource-backed, data-driven content. The merchant edits such content through the product, collection or menu, and the pattern's own schema settings |
| Page region (Hero, FeaturedCollection, Newsletter) | Template composition published as a blueprint, wrapped in `container` | Unchanged |

Consequences for agents: a product card is one line; a custom card is still possible by passing a body; nothing is captured and threaded.

To make the snippet-backed approach safe, the spec needs one rule: **a primitive's markup lives in exactly one file.** For primitives that patterns reuse (`image`, `price`, `button`, `badge`, `icon`, `quantity-input`, `swatch`), that file is `snippets/rp-<name>.liquid`, and `blocks/<name>.liquid` is the doc, the schema and one `{% render %}`.

**Before and after: `templates/collection.liquid`.** Before is the real file (87 lines; excerpt):

```liquid
{% block 'container' %}
  <s-view-event class="block py-12" view-event-trigger="connect" view-event-payload="{{ collection | standard_event_data: 'view' | escape }}">
  <div class="max-w-page mx-auto px-margin">
  <div class="mb-8">
    {% block 'heading', tag: 'h1', variant: 'lg', class: 'mb-2' %}{{ collection.title | escape }}{% endblock %}
    …
<s-live-form class="block" partial="collection-count,collection-chips,collection-filters,collection-grid" debounce="300" …>
  <form action="{{ collection.url }}" method="get" role="search" aria-label="{{ 'collections.filter' | t }}">
    {% capture collection_filter_trigger %}
      {% block 'button', commandfor: 'collection-filter-drawer', command: 'show-modal', variant: 'button-outline', class: 'h-11 px-4 text-sm rounded-button' %}{{ 'collections.filter' | t }}{% endblock %}
    {% endcapture %}
    … four more captured buttons …
    {% render 'filters', page_type: 'collection', resource: collection, drawer_id: 'collection-filter-drawer', filter_trigger: collection_filter_trigger, toolbar_submit: collection_toolbar_submit, close_button: collection_filter_close_button, show_results_button: collection_results_button, drawer_submit: collection_drawer_submit %}
    {% partial 'collection-grid' %}
{% paginate collection.products by 20 %}
    {%- assign product_sizes = '(min-width: 1280px) 297px, (min-width: 1024px) calc((100vw - 92px) / 4), (min-width: 768px) calc((100vw - 84px) / 2), calc(100vw - 32px)' -%}
    <div class="w-full max-w-page mx-auto px-margin contain-paint">
      <ul id="product-grid" role="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-1 gap-y-10 mb-8 stagger-fade-in">
        {% for product in collection.products %}
          <li>
            {%- if forloop.index <= 4 -%}{%- assign lazy_load = false -%}{%- else -%}{%- assign lazy_load = true -%}{%- endif -%}
            {%- if forloop.first -%}{%- assign fetch_priority = 'high' -%}{%- elsif forloop.index <= 4 -%}{%- assign fetch_priority = 'low' -%}{%- else -%}{%- assign fetch_priority = 'auto' -%}{%- endif -%}
            <s-view-event class="block" view-event-trigger="intersect" view-event-payload="{{ product | standard_event_data: 'view', context: 'collection' | escape }}">
              {%- liquid
                assign card_variant = product.selected_or_first_available_variant
                … six lines building card_image_attributes …
              -%}
              {% block 'card', block.name: 't:blocks.product_card', url: product.url, aria_label: product.title, border_radius: 'rounded-card' %}
                <a href="{{ product.url | escape }}" class="relative block overflow-hidden rounded-[inherit]" aria-label="{{ product.title | escape }}">
                  {% block 'image', fallback_image: product.featured_image, aspect_ratio: 'aspect-square', sizes: product_sizes, attributes: card_image_attributes, alt: product.title, seed: forloop.index %}{% endblock %}
                </a>
                <div class="flex flex-col gap-0.5">
                  {% block 'text', variant: 'sm', tag: 'h3', class: 'font-medium text-on-surface line-clamp-2' %}{{ product.title | escape }}{% endblock %}
                  {% block 'price', price: card_variant.price, compare_at_price: card_variant.compare_at_price, price_min: product.price_min, price_max: product.price_max, class: 'text-sm font-medium self-start group-[.text-center]/card:self-center group-[.text-end]/card:self-end' %}{% endblock %}
                </div>
              {% endblock %}
            </s-view-event>
          </li>
        {% endfor %}
      </ul>
    </div>
    <div class="max-w-page mx-auto px-margin">
      {% block 'pagination', paginate: paginate %}{% endblock %}
    </div>
    …
```

After, with proposed Ripple blocks. **Every block name and prop below is a proposal, not an existing API.**

```liquid
{% block 'container', width: 'page', py: '12' %}
  {% block 'stack', gap: '2' %}
    {% block 'heading', tag: 'h1' %}{{ collection.title | escape }}{% endblock %}
    {% block 'richtext', text: collection.description, tone: 'muted' %}{% endblock %}
  {% endblock %}

  {% block 'live-form', action: collection.url, partials: 'collection-toolbar,collection-filters,collection-grid' %}
    {% partial 'collection-toolbar' %}
      {% block 'filter-bar', resource: collection, drawer: 'collection-filters' %}{% endblock %}
    {% endpartial %}

    {% block 'drawer', id: 'collection-filters', side: 'start' %}
      {% block 'drawer-title', for: 'collection-filters' %}{{ 'collections.filters' | t }}{% endblock %}
      {% block 'drawer-close', for: 'collection-filters' %}{% endblock %}
      {% partial 'collection-filters' %}
        {% block 'filter-list', resource: collection %}{% endblock %}
      {% endpartial %}
    {% endblock %}

    {% partial 'collection-grid' %}
      {% paginate collection.products by 20 %}
        {% block 'grid', tag: 'ul', columns: '1 md:2 lg:4', gap_x: '1', gap_y: '10', reveal: 'stagger' %}
          {% for product in collection.products %}
            <li>{% block 'product-card', product: product, index: forloop.index, columns: '1 md:2 lg:4', event_context: 'collection' %}{% endblock %}</li>
          {% endfor %}
        {% endblock %}
        {% block 'pagination', paginate: paginate %}{% endblock %}
      {% endpaginate %}
    {% endpartial %}
  {% endblock %}
{% endblock %}
```

What moved into components: the page width (a `width` prop on `container`), the grid classes (`columns`, `gap_x`, `gap_y` printed as `data-` attributes), the card body, the price alignment workaround (the card's CSS handles it), eager/lazy and `fetchpriority` (`index` on the card: first is high priority, the first row is eager, the rest lazy), `sizes` (derived from `columns` by one shared snippet that `lcp-preload` also uses), the five captured buttons (owned by `filter-bar` and the drawer parts with translated default labels), and the view-event wrapper (`event_context`).

Open design points the example exposes, for the spec to settle:

- `columns` is stated twice (grid and card) because the grid cannot pass context to its body. Accept it, or let the card default to `sizes="auto"` for lazy images and require `columns` only for the eager first row.
- Blocks that own default labels need their translation keys in the theme's locale files (4.6).
- The filter drawer's open state must survive partial refresh, so the partial is inside the drawer, not around it (the theme does the same: "Only the dialog's filter-list partial is replaced, so its open state survives").

### 4.3 Props, settings and tokens

**Fit.** The kwarg mechanism suits Ripple: a prop is a kwarg whether it is code-only (a doc `@param`) or a merchant control (a schema setting). The Ripple manifest only needs one flag per prop, "editor setting or not", and the Liquid generator puts the prop in `{% schema %}` or in `{% doc %}`, never both.

**Requirements this imposes on Ripple's cross-host API.**

- **Text is always children.** No `title=`, `label=`, `heading=` or `description=` props on any component in any host, because Liquid forbids them. Compound parts carry text instead (`drawer-title`). Two exceptions exist in the theme and should be the only ones: a `text` richtext setting for dynamic sources, and accessible-name params (`aria_label` on `card` and `basic-menu`). Ripple should add a `label` param for icon-only controls, which removes most uses of `attributes`.
- **At most three styling settings per block schema** by default. Ripple components usually have more props (variant, size, tone, radius). Choose up to three per component as editor settings; the rest are code-level kwargs.
- **Media, resources and links are settings** (`image_picker`, `video`, `product`, `collection`, `url`, `link_list`), passed as objects.
- **Colour.** The theme gives several blocks a `color` setting that prints an inline `style`. Ripple's `tone` prop (a token name) is safer; a per-usage colour picker can remain as an optional setting printing a CSS variable on the element, not a property.
- **`class` and `attributes` on every block.** Ripple should make `attributes` rarely necessary by giving common attributes real params (`id`, `label`, `loading`, `fetchpriority`, `describedby`).
- **`visible_if`** can read variables a block assigns, so a block can hide settings that do not apply.

**Tokens to theme settings.** Keep the existing mechanism: `config/settings_schema.json` (flat groups, `t:` labels) → `snippets/theme-styles.liquid` prints `:root` variables after the stylesheet → schema default equals CSS initial value. Ripple's "less/more" knobs map to `range` or `select` settings that set one scale variable each (for example a radius scale, a spacing density, a type scale), which Ripple's token CSS multiplies. The existing three radius selects (`sharp|rounded|pill` → `0|0.5rem|9999px`) are a coarse version of this. Derived tokens (`--color-interactive-text`) should be computed in CSS where possible (`contrast-color()` or a documented fallback) rather than with `color_brightness`.

### 4.4 Behaviour

**Fit.** The theme's "native first, commands for buttons" matches Ripple's progressive-enhancement goal better than the current Ripple plan, which classifies Dialog and Drawer as `ui-*` elements that are "Dead as an overlay" without JS (`ripple/docs/research/uisdk-web-elements.md` 3.2, 9.1).

**Verified in the UI SDK source (by search, nothing run):**

- No file in `uisdk/packages/web/src` or `uisdk/packages/core/src` handles `commandfor`, `command` events or `CommandEvent`. The matches for "command" are the command palette (`<ui-command>`, `packages/web/src/entries/command.ts`).
- No non-test file there calls `showModal` or references `HTMLDialogElement`. The only match is `packages/core/src/testing/pattern-popups.ts`.
- The docs under `uisdk/apps/docs/content/docs/web-components` and `core` contain no mention of native `<dialog>`, `showModal`, or invoker commands.
- From the earlier run recorded in `uisdk-web-elements.md` 2.4: an open `ui-dialog` content element is a non-`<dialog>` element with `role="dialog"` and `popover="manual"`.

**What follows (reasoned, not run):**

- `command="show-modal"` and `command="close"` cannot drive `ui-dialog`; those built-in commands apply to `<dialog>` only.
- `command="show-popover"` aimed at a `ui-*` popup would bypass UI SDK's state. **ASSUMED** to desynchronise it.
- A custom command (`command="--open"`) fires a `command` event on any target, so a Ripple wrapper could translate it to the UI SDK API. **ASSUMED** feasible.
- Native `<dialog>` and `ui-*` popups can be on the same page. One known hazard: anything outside an open modal dialog is inert, so a `ui-toast` region, tooltip or menu must render inside the dialog or be re-parented, as `s-notification` does. Whether UI SDK's `container` options cover this is **UNVERIFIED**.
- Putting UI SDK's dialog behaviour on a native `<dialog>` element (through `as-child`) is **UNVERIFIED** and not recommended: two owners of open state.

**Recommended no-JS baseline for Ripple's HTML contract.**

| Ripple component | Contract | Enhancement |
|---|---|---|
| Dialog, Drawer, Sheet, Lightbox, SearchDialog, CartDrawer, MobileNav shell, Filters drawer | Native `<dialog id>`; openers and closers are `<button commandfor="id" command="show-modal|close">` | A small `rp-dialog` wrapper (the `s-dialog` feature set: light dismiss, focus restore across partial swaps, close-on-navigate, open-on-connect), plus the inline invoker polyfill. No UI SDK |
| Openers that have a page equivalent (cart, search) | `<a href="{{ routes.cart_url }}">` marked as opening a dialog; navigates without JS | Intercepted to call `showModal()` (the pattern verified for links in `uisdk-web-elements.md` 4.3) |
| Accordion, Collapsible, FAQ, filter groups | `<details>`/`<summary>` (exclusive groups with the `name` attribute) | CSS only |
| Popover, dropdown panels (LocaleSelector, account, sort) | Native `popover` attribute with `popovertarget` or `command="toggle-popover"`; the theme already ships `[popover]` base CSS | Positioning; `ui-popover` only if anchor positioning support is insufficient |
| Commerce elements (`rp-cart`, `rp-quantity-input`, `rp-product-form`, `rp-video`) | Buttons carry `commandfor` plus a `--custom` command and `data-*` arguments | The element's `command` listener |
| Tabs, Carousel, Combobox (predictive search), NavigationMenu hover intent, Tooltip, Toast | No adequate native form | UI SDK `ui-*` elements, with the server-HTML rules already recorded in `uisdk-web-elements.md` |

This changes the current Ripple plan in one place: **Dialog and Drawer move from "ui" to "native + thin Ripple enhancement".** It removes the largest UI SDK entries from the critical path and makes overlays work before or without script in browsers with native Invoker Commands.

Adopt from the theme as contract rules: `--`-prefixed custom commands; no inline handlers; one element per module; strings for JS passed as `data-*`; `aria-busy` on the element during requests; `AbortController` for cancellation.

Browser support for native Invoker Commands and for `closedby` was not checked here. **UNVERIFIED**; the spec should record the support matrix and keep the polyfill until it is unnecessary. Whether React passes `commandfor` and `command` through unchanged is also **UNVERIFIED** here (see `ripple/docs/research/react-and-custom-elements.md`).

### 4.5 Data

**Today.** Cart reads are server-rendered Liquid (`cart` object) refreshed through partials. Cart writes are `window.Shopify.actions.updateCart` and `openCart` (Standard Actions; `s-cart.js` comments call it "Standard Actions (Storefront API)"). The AJAX cart API is not used. Product, collection, search and predictive search are server-rendered and refreshed through partials. Localization and contact are native form posts. Analytics are Standard Events.

**Hydrogen core, from source.**

- `hydrogen/packages/hydrogen/src/core/cart/cart.ts` builds its cart store on the same global. `getShopifyStandardActions()` reads `window.Shopify?.actions` and errors with "Add ShopifyScripts to your document head or include https://cdn.shopify.com/storefront/standard-actions.js".
- It configures the same action the theme configures:

  ```ts
  const configured = actions.updateCart.configure({
    eventTarget: () => document,
    handler: (defaultHandler, payload, options) => {
      const cartRequestUrl = getCartRequestUrl();
      if (!cartRequestUrl || !payload) return defaultHandler();
      return postCartUpdateToEndpoint(cartRequestUrl, payload, options);
    },
  });
  if (configured === false) { throw new Error("Standard Actions updateCart could not be configured."); }
  ```
  With no cart endpoint configured it calls `defaultHandler()`, which is what a Liquid store needs.
- `CartStore` offers `connect`, `hydrate`, `getState`, `subscribe`, `fetch`, `refresh`, `handleFormSubmit(event)`. Optimistic lines appear in state (`pendingLines` in the spike output).
- `core/cart/form.ts` defines the form contract: a submit button `name="intent"` with values `add`, `increase`, `decrease`, `remove`, `set`, `discount-apply`, `discount-remove`, `note-update`, `attributes-update`, and fields such as `merchandiseId`. The spike output records the check "The first button in cart form must have a name of "intent" and value of "set"."
- `core/` also has `product` (options, variant id, URL), `predictive-search` (store, queries, server handlers), `collection`, `money`, `i18n`, `analytics`, `standard-routes`, `shopify-scripts`.
- `package.json` (`@shopify/hydrogen` 2026.10.3) exports `.`, `./react`, `./vue`, `./vite` and others. There is no `./core` subpath.
- `hydrogen/skills/` holds `create-oxygen-template`, `error-reporting`, `hydrogen-branches`, `playwright-tests`, `pull-request-standards`. Nothing about themes, Liquid or partial rendering. A search of `core/` for "partial-rendering" found nothing; matches for "liquid" were not followed up.
- `ripple/docs/research/spikes/hydrogen-core/result.txt` records a store connecting in a "liquid-mode" with no endpoint. Read, not re-run.

**Conflicts.**

1. **Two configurers of `updateCart`.** The theme's `standard-actions-config.liquid` and Hydrogen's `configureUpdateCartOnce` both call `actions.updateCart.configure`. `configure` returns a boolean and Hydrogen throws on `false`. Whether a second call replaces, chains or fails is **UNVERIFIED**. Only one may remain.
2. **Event target.** The theme routes Standard Action events to the owning `s-cart` or product form; Hydrogen uses `document`.
3. **Form field names differ by host.** Liquid's native `{% form 'product' %}` posts `id`, `quantity`, `selling_plan`, `properties[...]` and the checkout button is `name="checkout"`. Hydrogen's forms use `merchandiseId` and `name="intent"`. One byte-identical `<form>` cannot serve both no-JS paths.
4. **Client state versus server HTML.** Hydrogen renders from store state. A Liquid theme has money formatting, translations, discounts and line properties only on the server.
5. **Predictive search.** Hydrogen's uses Storefront API queries; the theme uses the search page through partials and needs no token.

**Recommended resolution.**

- The Ripple cart element (`rp-cart`) uses the Hydrogen cart store for mutations, optimistic state (count, quantities, pending and error flags) and cross-instance sync on every host. Hydrogen core is the sole configurer of `updateCart`; delete `standard-actions-config.liquid` and `standard-actions-override.js`.
- **On Liquid, authoritative HTML still comes from partials.** After the store settles, `rp-cart` fetches the cart partials and applies them. Ripple needs a small host adapter interface: "refresh these regions" is `partials.fetch`/`apply` on Liquid and a framework re-render elsewhere.
- **The HTML contract must exclude form internals that the host owns.** The contract fixes the form's wrapper element, the visible controls and their classes. The form `action`, hidden fields and submit button `name`/`value` are host-specific and listed per host. On Liquid, `rp-product-form` reads `id`/`quantity` and calls the store, as `s-product-form` does now.
- Variant picking, filters, sort and search keep the URL-plus-partials model on Liquid through one `rp-live-form` element. Hydrogen `core/product` helpers can compute option availability on the client where useful, but the server render stays the source.
- **What Hydrogen core needs for this:** a browser-loadable build without a bundler (an ES module file a theme can put in `assets/` and reference from the import map); a documented way to connect with no endpoint and seed from server data (`hydrate`) or `getCart`; a way to set the Standard Actions event target, or agreement that `document` is acceptable; no React dependency on that entry; a size budget. Whether the root export tree-shakes to the cart store alone is **UNVERIFIED**.
- Keep Standard Events (`standard_event_data`, `<s-view-event>`, page view) as a Liquid-host concern outside the HTML contract.

### 4.6 File and naming conventions for the Liquid binding

Required by the theme:

- Files: `blocks/<kebab-name>.liquid`, `snippets/<kebab-name>.liquid`, `assets/<name>.js`. No `sections/`, no JSON templates, no `presets`, no `{% javascript %}`, no `{% stylesheet %}`.
- Every block: `{% doc %}` (description; `@param {type} [name] - …` for code params only; `@category`; `@renders`; `@example` that actually compiles, since Tailwind and tools scan doc examples) and `{% schema %}` with `"name": "t:blocks.<snake_name>"`.
- Every block accepts `class` and `attributes`. Compositional blocks print `{{ content }}`; self-contained ones are still called with `{% block %}{% endblock %}`.
- Every snippet: `{% doc %}` with `@param` and `@example`; body content only through a captured `content:` argument.
- No executable `{% block %}` in `blocks/` or `snippets/`.
- Schema setting ids are read by bare name and overridden by bare kwargs; they are not doc params; never `block.settings.*`.
- No filters in `{% block %}`/`{% render %}` arguments; assign first.
- Whitespace between a tag name and a Liquid delimiter (`<li {% if … %}`).
- Strings: literal `{{ 'ns.key' | t }}` in storefront locale files; schema text as `t:` keys in schema locale files; `_html` keys for rich text. Blocks may own default accessible labels (the theme's `pagination`, `quantity-selector` and `basic-menu` do).
- URLs from `routes.*`; JS gets them through `data-*`.
- Logical properties and `<bdi>` for RTL; `dir` from `request.locale.direction`.
- JS: one custom element per file; `@theme/*` import-map specifiers, never relative imports; listeners in `connectedCallback` with `AbortController`; module tag at the call site.
- Custom elements that take part in layout need a static `display` rule.
- Comments are Liquid comments, one or two lines, explaining why.

Ripple-specific decisions needed within those rules:

- **Block names.** `{% block 'button' %}` reads best and matches the theme, but collides with a theme's own files. `rp-button` avoids collisions and marks ownership. Section 6 recommends unprefixed names in the Ripple base theme with an optional prefix in the scaffolder.
- **Element prefix.** The theme uses `s-`; Ripple uses `rp-`; UI SDK uses `ui-`. No conflict.
- **Locale keys.** Ripple needs its own namespace in every locale file it supports, with schema keys alongside.

---

## 5. What the spec must say

### HTML contract

1. Every component root carries one `rp-<component>` class; props are `data-<prop>` attributes with token values; parts carry `rp-<component>-<part>` classes. The contract is identical in every host.
2. A part relates to its root only by DOM nesting or an explicit `for`/`commandfor` id. The contract MUST NOT require render-time context passing, because Liquid block bodies render before the parent.
3. Text content is always children. No component in any host has a visible-text prop. Allowed exceptions: an accessible-name prop (`label`) and a rich-text source prop on RichText.
4. Dialog, Drawer and every modal overlay use native `<dialog>`. Openers and closers are `<button commandfor command="show-modal|close">`. Openers with a page equivalent MAY instead be links to that page, enhanced by script.
5. Accordion and Collapsible use `<details>`. Popover uses the native `popover` attribute. Form controls are native.
6. Buttons address Ripple elements with `commandfor` and a `--`-prefixed custom command; arguments are `data-*` attributes on the button. No inline handlers, no `data-action`.
7. The contract ships an inline Invoker Commands polyfill equivalent to `snippets/command-polyfill.liquid` and states the browser support matrix.
8. Behaviour MUST NOT depend on utility class names. Responsive behaviour is expressed in attributes.
9. Form internals owned by the host (form `action`, hidden inputs, submit `name`/`value`) are outside the byte-identical contract and are specified per host. On Liquid: `{% form 'product' %}` with `input[name="id"]`, `name="quantity"`, and `name="checkout"` on checkout submitters.
10. Regions that a host refreshes (Liquid partials) are named in the contract per component, and a refreshed region MUST contain whole component roots (never the inside of an upgraded element), consistent with `uisdk-web-elements.md` 9.7.
11. Analytics wrappers (`<s-view-event>`, JSON payload scripts) are host additions outside the contract root and excluded from fixture comparison.
12. Every image-rendering component takes explicit `loading`, `fetchpriority` and `sizes` props, or a single `index` prop from which the component derives them. Callers never build attribute strings.

### Styling

13. Ripple CSS is plain CSS in `@layer components`, with selectors of single-class or single-attribute specificity, reading only CSS variables. It contains no Tailwind directives.
14. Tokens use Tailwind v4 `@theme` names. The colour roles include, with these names, the theme's settings-backed set: `--color-surface`, `--color-surface-secondary`, `--color-on-surface`, `--color-on-surface-secondary`, `--color-border`, `--color-accent`, `--color-interactive`, `--color-interactive-text`, plus `--color-sale`, `--color-compare`, `--color-success`, `--color-warning`, `--color-critical`, `--color-info`. Radius roles include `--radius-button`, `--radius-card`, `--radius-input`. Fonts are `--font-body` and `--font-heading`.
15. Responsive prop tokens use Tailwind's breakpoint names and widths.
16. Utilities passed through `class` always win over component styles by layer order. The spec states the required layer order: `theme, base, components, utilities`.
17. On Liquid, Ripple CSS is installed into `config/styles.css` so the platform compiler emits it in `assets/styles.min.css`. The precompiled `assets/ripple.css` path is the documented fallback.
18. Ripple ships a static `display` rule for every `rp-*` and `ui-*` tag it uses.
19. Motion uses two easing tokens (`--ease-ui`, `--ease-drawer`), about 300ms in and 200ms out, behind `prefers-reduced-motion`. Interactive controls have a 44px minimum target and press feedback. Layout uses logical properties only.
20. One typography scale serves Heading, Text, Price and menus. The spec lists its steps and replaces the theme's three scales.
21. Contrast thresholds are 4.5:1 for body text, 3:1 for large text and control indicators. Derived foreground tokens are specified with their algorithm.

### Liquid binding

22. One block file per Ripple component or wired part, named in kebab case, with `{% doc %}` and `{% schema %}`, accepting `class` and `attributes`.
23. The generator puts each prop either in `{% schema %}` (editor setting, read by bare name) or in `{% doc %}` (code param), from a per-prop flag in the Ripple manifest. Default cap: three styling settings per block. Schema option values are prop tokens, not class names.
24. Media, resources, menus and links are schema settings taking objects.
25. No block or snippet contains an executable `{% block %}` tag.
26. Primitives reused inside resource patterns have their markup in `snippets/rp-<name>.liquid`; the block file renders that snippet. A primitive's markup exists in exactly one file.
27. Resource patterns (ProductCard, CollectionCard, ArticleCard, CartLineItem, Filters, FilterBar, SortSelect, LocaleSelector, NavigationMenu, MobileNav, CartSummary, DiscountCodeInput) are self-contained blocks with a default body, and print `{{ content }}` instead when the caller supplies one. The spec records this as a deliberate change to the base theme's rule and limits it to resource-backed content.
28. Icons are a snippet: `{% render 'icon', name: 'x', size: 'md' %}` printing the contract's icon wrapper around `inline_asset_content`.
29. `container` (or its Ripple name) takes a `width` prop (`page`, `full`, `prose`) and owns both inline and block padding, so `max-w-page mx-auto px-margin` never appears in a template.
30. Ripple ships locale entries under its own namespace for every string its blocks print and `t:` schema entries for every setting, for the base theme's locale set (31 storefront, 20 schema).
31. The token bridge follows `snippets/theme-styles.liquid`: settings in `config/settings_schema.json` (flat groups, `t:` labels), a `:root` block printed after the stylesheet, schema defaults equal to CSS initial values. Scale knobs ("less/more") are `range` or `select` settings each writing one scale variable.
32. JS is delivered as one module per element in `assets/`, referenced through import-map specifiers, loaded by a module tag at the call site. Ripple adds its entries (and Hydrogen core's) to `snippets/import-map.liquid`.
33. On Liquid, `rp-cart` and `rp-product-form` use the Hydrogen cart store for mutations and optimistic state, and partial rendering for authoritative HTML. Hydrogen core is the only configurer of `Shopify.actions.updateCart`.
34. Ripple provides `rp-live-form` (form → URL → partial refresh, with focus and stale-response handling) for filters, sort, search and variant selection on Liquid.
35. The binding passes a conformance check: the Liquid output for each fixture equals the canonical HTML used for React and Remix (see the existing spike in `ripple/docs/research/spikes/liquid`).

### Component inventory

36. V1 MUST be able to replace these base-theme blocks one for one: `container`, `header`, `footer`, `featured-collection`, `heading`, `text`, `overline`, `richtext`, `link`, `button`, `image`, `video`, `card`, `price`, `quantity-selector`, `variant-picker`, `pagination`, `logo`, `main-menu`, `basic-menu`, `predictive-search`. `gift-card` may ship as a blueprint.
37. V1 MUST also cover what the theme implements as snippets or inline markup: Drawer, CartDrawer, CartLineItem, CartSummary, DiscountCodeInput, CartNote, Filters, FilterGroup, FilterChips, SortSelect, PriceRange, Swatch, LocaleSelector, MobileNav, Placeholder, Toast region, SkipLink, live-region announcer, Lightbox/zoom, form Field with error wiring (the contact and comment forms), Banner for form success and error, Badge (count pills), Icon, IconButton, Grid, Stack.
38. Each component is classified static, native-enhanced, `ui`, or commerce. Dialog and Drawer are native-enhanced.
39. Blueprints exist for every template in 2.3, plus the layout.

### Plan

40. Build order follows usage: Button/IconButton/Icon, Text/Heading, Image, Container/Stack/Grid, Card/ProductCard/Price first (they account for most call sites), then Dialog/Drawer, then cart, then filters and search.
41. Acceptance for the Ripple base theme: every template in 2.3 rebuilt with Ripple blocks; no `capture` used to pass a block into another file; no `class` kwarg longer than a stated limit; layout under a stated line count; total CSS and JS no larger than the base theme's (15.9 kB and 32.6 kB gzip).
42. No-JS acceptance: cart reachable by link, cart quantity changeable by form post, country and language changeable, every menu level reachable, variant selection submits the chosen variant.

### Proposed target structure for a Ripple base theme

```text
AGENTS.md                      # shorter: composition rules + pointer to the Ripple manifest
DESIGN.md
assets/
  ripple.css                   # only in the no-compiler fallback
  rp-dialog.js  rp-cart.js  rp-product-form.js  rp-live-form.js
  rp-quantity-input.js  rp-video.js  rp-toast.js  rp-nav.js  rp-search.js
  hydrogen-cart.js             # browser build of the Hydrogen cart store
  icon-*.svg
blocks/
  container.liquid  header.liquid  footer.liquid  stack.liquid  grid.liquid
  heading.liquid  text.liquid  richtext.liquid  link.liquid  button.liquid  icon-button.liquid  badge.liquid
  image.liquid  video.liquid  logo.liquid
  card.liquid  product-card.liquid  collection-card.liquid  article-card.liquid
  price.liquid  quantity-input.liquid  variant-picker.liquid  product-form.liquid  gallery.liquid
  dialog.liquid  dialog-title.liquid  dialog-close.liquid  drawer.liquid  drawer-title.liquid  drawer-close.liquid
  accordion.liquid  accordion-item.liquid  popover.liquid
  cart-drawer.liquid  cart-line-item.liquid  cart-summary.liquid  discount-code.liquid
  live-form.liquid  filter-bar.liquid  filter-list.liquid  pagination.liquid
  navigation-menu.liquid  mobile-nav.liquid  link-list.liquid  locale-selector.liquid
  search-dialog.liquid  field.liquid  banner.liquid
config/
  settings_schema.json  settings_data.json
  styles.css                   # Tailwind entry + @theme tokens + Ripple component layer
layout/
  theme.liquid                 # skeleton only: head snippets, header, main, footer, overlays
  password.liquid
locales/                       # theme keys + ripple.* keys
snippets/
  rp-image.liquid  rp-price.liquid  rp-button.liquid  rp-badge.liquid  rp-quantity-input.liquid  rp-swatch.liquid
  icon.liquid  rp-image-sizes.liquid  placeholder.liquid
  import-map.liquid  theme-styles.liquid  theme-scripts.liquid  command-polyfill.liquid
  meta-tags.liquid  lcp-preload.liquid  skip-link.liquid  announcer.liquid  toast-region.liquid
templates/
  index.liquid  product.liquid  collection.liquid  list-collections.liquid  search.liquid  cart.liquid
  blog.liquid  article.liquid  page.liquid  page.contact.liquid  404.liquid  password.liquid  gift_card.liquid
```

---

## 6. Open questions for Ben

1. **May Ripple relax "moving block calls into a snippet is not a valid migration" for resource-backed patterns** (ProductCard and the others in requirement 27)? Recommended default: yes, with the body override. Without it, product cards stay as multi-line compositions repeated in every template.
2. **May Ripple's component CSS live in `config/styles.css`,** replacing "no component CSS / no custom component class names"? Recommended default: yes, in `@layer components`, with the precompiled file as fallback.
3. **Does the Canvas/Sidekick compiler resolve a relative `@import` in `config/styles.css`,** and does it tree-shake anything in `@layer components`? Recommended default until answered: scaffold Ripple CSS inline into `config/styles.css` and include only installed components.
4. **Block names: unprefixed (`button`) or prefixed (`rp-button`)?** Recommended default: unprefixed in the Ripple base theme, matching the platform's vocabulary and the React names; a scaffolder option adds the prefix when installing into an existing theme.
5. **Name of the page-region component.** "Section" is a reserved idea in Shopify themes ("Section? Never"). Recommended default: call it Container in every host.
6. **Is Hydrogen core allowed to be the only configurer of `Shopify.actions.updateCart` on Liquid stores, and can it ship a no-bundler browser build without React?** Recommended default: yes to both, with partial rendering kept for HTML.
7. **How does `@shopify/partial-rendering` resolve** (it is not in the theme's import map), and is its API (`partials.fetch(...names, { url, signal })`, `partials.apply(html)`) stable enough to depend on? Recommended default: depend on it only through a Ripple host adapter.
8. **Does the editor need anything from block markup** (the theme never prints `block.shopify_attributes`), and what exactly does the `block.name:` kwarg do? Recommended default: assume the platform injects editor hooks and treat `block.name` as an optional editor label kwarg the binding passes through.
9. **Minimum browser support.** The theme relies on Invoker Commands (with polyfill), `@starting-style`, `allow-discrete` transitions, `:has()`, View Transitions and `sizes="auto"`. Recommended default: the same baseline as the base theme, with the polyfill kept.
10. **Should no-JS cart editing and variant selection be required** (requirement 42)? The base theme does not support them. Recommended default: yes for a link to the cart, cart quantity update and variant submit; no for the drawer experience itself.
11. **Which props become editor settings** given the three-setting cap? Recommended default: variant, size and one component-specific prop; everything else is code-level.
12. **Locales.** Should Ripple ship translations for all 31 locales the base theme carries? Recommended default: yes, generated, under a `ripple.` namespace.
