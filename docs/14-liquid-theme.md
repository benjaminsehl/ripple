# 14 - The Liquid theme

Status: specification. Date: 2026-11-21. Law: [00-decisions.md](00-decisions.md) (D-037 to D-039, D-041, D-046, D-054, D-055, D-087, D-089, D-091, D-097 to D-099, section 8.6). Milestone: M5 (D-067).

## 0. Scope and how to read this document

This document specifies the **Ripple base theme**: the Shopify Liquid theme at `examples/liquid/` in the Ripple repository, built only from Ripple components. It replaces the component layer of the base theme in `ripple/theme/` and keeps that theme's platform rules (D-039). `ripple/theme/` is reference material: it MUST NOT be edited, copied wholesale, or shipped.

Owned here (the theme's infrastructure, D-099 item 2): the theme rules; the theme file tree; the infrastructure snippets `rp-head`, `rp-tokens`, `rp-import-map-entries` in full; the theme-owned snippets `snippets/import-map.liquid` (in full) and `snippets/meta-tags.liquid` (the base theme file with two key renames, D-109); `config/settings_schema.json`; `config/styles.css`; the settings group the CLI patches into other themes; the locale files; which partial is declared where; the replacement of every base theme block, snippet, custom element and asset; the no-JS gaps closed; acceptance criteria; SPIKE-02.

`snippets/import-map.liquid` and `snippets/meta-tags.liquid` are specified here and are files of the `layout` blueprint's Liquid list (keys `import-map`, `meta-tags`).

This document contains NO layout or template text. Every `layout/*.liquid` and `templates/*.liquid` file is the Liquid file of a blueprint, and [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) owns its complete text (D-099 item 1). Where this document and doc 12 differ about the content of such a file, doc 12 wins (D-069).

Not owned here (linked, never restated in full):

| Topic | Owner |
|---|---|
| Liquid block file rules L-1 to L-21, tiers, generated block code | [06-bindings.md](06-bindings.md) section 8 |
| Component contracts, params, locale keys, region parts | [09-components-foundation.md](09-components-foundation.md), [10-components-interactive.md](10-components-interactive.md), [11-components-commerce.md](11-components-commerce.md), [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) |
| Tokens, dials, layers, `theme.css`, component CSS | [03-styling-and-tokens.md](03-styling-and-tokens.md) |
| `ripple.js`, lazy chunks, Invoker Commands polyfill, opener listener | [04-elements.md](04-elements.md) |
| Cart store, Liquid adapter, form dialect, refresh algorithm, `rp-view-event`, the page-view dispatch | [05-commerce.md](05-commerce.md) |
| `ripple init` / `add` / `upgrade`, patches, trailers, `assets/ripple.css` format, checker rules | [07-manifest-registry-cli.md](07-manifest-registry-cli.md) |
| Every `layout/*.liquid` and `templates/*.liquid` file (the Liquid files of the 14 blueprints) | [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) |
| The Ripple Liquid subset (three scopes, D-097) | [06-bindings.md](06-bindings.md) rule L-13 |
| `AGENTS.md` generated section, skills, evals | [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) |
| The liquidjs shim, canonicaliser, test tiers | [13-testing.md](13-testing.md) |

Terms: "the base theme" is `ripple/theme/`. "The Ripple theme" is `examples/liquid/`. "Theme-owned file" is a file of the Ripple theme that belongs to the theme and to no component. It is either created by hand (section 4.1 step 1; no provenance trailer) or it is a blueprint file written by `ripple add --blueprint <id>` (trailer owner `blueprint.<id>`, D-056). "Registry file" is a file of owner `core` or of a component, written by `ripple init` or `ripple add` (it has a trailer, D-056). "Template" in the rules of section 2 means a file in `templates/` or `layout/`.

Evidence paths starting with `theme/` mean `ripple/theme/`.

---

## 1. Facts this design rests on

| # | Fact | Status | Evidence |
|---|---|---|---|
| F-1 | `{% block %}` is legal only in `templates/` and `layout/`; a block prints its body with `{{ content }}`; the body is rendered in the caller's scope before the block runs | Verified by Theme Check (`ValidBlockTagPlacement`) and docs; body scope from the base theme only | `ripple/docs/research/liquid-blocks-partials.md` 2.1; `theme/AGENTS.md` |
| F-2 | `{% partial 'name' %}` body `{% endpartial %}` marks a region in a template or layout; `partials.fetch(...names, { url, signal })` then `partials.apply(html)` REPLACES the region's DOM | Tag documented; JS API read in base theme source only | `ripple/docs/research/liquid-blocks-partials.md` 2.2; `theme/assets/s-cart.js`, `theme/assets/s-live-form.js` |
| F-3 | A `{% partial %}` inside a block file is not seen anywhere | UNVERIFIED (SPIKE-02 question V-6); Ripple files MUST NOT contain one | `ripple/docs/research/liquid-blocks-partials.md` 2.2 |
| F-4 | `Shopify.actions.updateCart` accepts Liquid variant ids and line keys; only the first `configure` call wins | Documented; real runtime not executed (SPIKE-01) | `ripple/docs/research/liquid-blocks-partials.md` 2.7 |
| F-5 | The base theme's import map maps `@shopify/standard-events` to `https://cdn.shopify.com/storefront/standard-events.js`; `@shopify/partial-rendering` is not in the map and not on npm | Read | `theme/snippets/import-map.liquid`; `ripple/docs/research/liquid-blocks-partials.md` 2.2 |
| F-6 | "Classic Edit Code alone does not invoke the compiler" of `config/styles.css` | Read | `theme/AGENTS.md` |
| F-7 | A theme may contain ONE `color_palette` setting; its values are hex colours without alpha; it supports no `label` | Read in Shopify docs (`docs/storefronts/themes/architecture/settings/input-settings`) | docs search tool (read by the first writer of this document) |
| F-8 | A `range` setting requires numeric `min`, `max`, `default`; `step` defaults to 1; the value is returned as a number | Read in Shopify docs (same page) | docs search tool (read by the first writer of this document) |
| F-9 | A theme has at most 300 block files | Read | `ripple/docs/research/liquid-blocks-partials.md` 2.1 |
| F-10 | No block file of this document has been rendered by Shopify | Open: SPIKE-02 (section 15) | `ripple/docs/research/liquid-blocks-partials.md` section 0 |
| F-11 | A `font_picker` setting accepts the default handle `system_ui_n4`; a `font` object has the member `system?`, true for a system font | Read in Shopify docs (D-098 evidence); UNVERIFIED on a store (SPIKE-02 questions V-15, V-19) | docs search tool; `00-decisions.md` D-098 |
| F-12 | The base theme prints view events with the filter `standard_event_data` in two markup forms: an attribute (`view-event-payload`) on the product and collection templates, a child `<script type="application/json" data-view-event-payload>` on the cart template | Read | `theme/templates/product.liquid`, `theme/templates/collection.liquid`, `theme/templates/cart.liquid` |

---

## 2. Theme rules

Rules are numbered T-n. "Template" below means a file in `templates/` or `layout/`.

### 2.1 Kept from the base theme (D-039)

- **T-1** The theme MUST NOT contain `sections/`, JSON templates, schema `presets`, `{% section %}`, `{% sections %}`, `{% javascript %}`, `{% stylesheet %}` or `{% style %}`.
- **T-2** `{% block %}` appears only in templates. A file under `blocks/` or `snippets/` MUST NOT contain `{% block %}` (RP401) or `{% partial %}` (RP403, F-3).
- **T-3** Every user-visible string is a locale key printed with `| t`. A template MUST NOT contain literal user-visible text. Every string of a shipped template is a key `ripple.blueprints.<blueprint id>.<key>` (ledger section 4.1); every component string is a key `ripple.<component id>.<key>`. The shipped theme has no `theme` namespace and no other namespace. A project's own strings go under a namespace of its choice that is not `ripple`.
- **T-4** Every internal URL comes from `routes.*` or from a resource drop (`product.url`, `collection.url`, `item.url_to_remove`). A template MUST NOT contain a hard-coded path. The only fragment links allowed are `#footer-menu` (the no-JS target of the menu opener) and `#main` (SkipLink; and the menu opener when both menus are empty: [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) rule LY-1, test LT-2).
- **T-5** `<html>` prints `lang="{{ request.locale.iso_code }}"` and `dir="{{ request.locale.direction | default: 'ltr' }}"` (evidence: `theme/layout/theme.liquid` line 3). Text that must keep its direction (vendor names, codes) is wrapped in `<bdi>`.
- **T-6** There is exactly ONE `<script type="importmap">` per page, printed by `snippets/import-map.liquid`, and it is the first element of `<head>`.
- **T-7** An asset MUST NOT import another asset by a relative path. Cross-asset imports are bare specifiers resolved by the import map.
- **T-8** `{% block %}` and `{% render %}` arguments are variables, literals or property access. They MUST NOT contain a filter. A filtered value is assigned on a line before the call.
- **T-9** Between an HTML tag name and a Liquid delimiter there is whitespace: `<li {% if x %}` and never `<li{% if x %}`.
- **T-10** `AGENTS.md` MUST NOT exceed 50,000 bytes (RP406).

### 2.2 Changed from the base theme

| # | Base theme rule | Ripple theme rule | Decision |
|---|---|---|---|
| T-11 | "Block-first, template-owned composition" for everything | A component of tier `resource` is ONE self-contained block; a body is passed only to replace its default body, or (rule T-17) to wrap its region part in a partial | D-037 |
| T-12 | Utility-only markup; "no component CSS files" | Ripple block and snippet files print only `rp-` classes and `data-` attributes and contain NO Tailwind utility; component CSS is `assets/ripple.css` | D-024, D-055 |
| T-13 | "Single global CSS source `config/styles.css`" | Two stylesheets: `assets/ripple.css` (complete on its own, loaded first) and `assets/styles.min.css` (compiled utilities, optional) | D-055 |
| T-14 | "One custom element per JS file", a module tag at each call site | One bundle `assets/ripple.js` plus five further files (`tabs`, `tooltip`, `toast`, `shared`, `agent`), loaded once by `rp-head`; no component prints a `<script>` tag; the theme has no JavaScript module of its own | D-054, D-039 |
| T-15 | The theme configures `Shopify.actions.updateCart` | Hydrogen inside `ripple.js` is the only configurer; the two base theme files MUST NOT exist | D-041 |
| T-16 | Schema option values are class names (`py-16`) | Schema option values are prop tokens (`md`) | D-038 |

### 2.3 New rules

- **T-17 Region wiring.** A region is declared by the template that renders it, never by a Ripple file (D-091). Two forms exist and no other is allowed:
  1. **Component region** (the region root is a region part of a component; D-091 item 1; [11-components-commerce.md](11-components-commerce.md) section 0 owns the pattern). The template passes the component's region-part snippet, wrapped in the partial, as the block body, on ONE line:

     ```liquid
     {% block 'cart-lines', id: 'cart' %}
       {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
     {% endblock %}
     ```

  2. **Template region** (the region wraps whole components; a blueprint-owned region, D-091 item 2). The partial contains exactly one layout block, `stack` or `inline`, whose `attributes` param carries the hook. A `{% paginate %}` tag MAY sit between the partial and that block. Shape (the complete files are in doc 12):

     ```liquid
     {% partial 'rp-product-buy' %}
       {% block 'stack', gap: '4', attributes: 'data-rp-region="rp-product-buy"' %}
         {% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}
         {% block 'product-form', id: 'product-form', product: product %}{% endblock %}
       {% endblock %}
     {% endpartial %}
     ```

  In both forms the partial name equals the `data-rp-region` value, and the partial's rendered content is exactly one element. A region-part snippet is rendered with the same params everywhere it is rendered (D-091 item 4).
- **T-18 One declaration per page.** A partial name MUST be declared at most once in the HTML of any page (layout plus one template) (D-091 item 5). Therefore the layout MUST NOT render CartDrawer when `template.name == 'cart'`, and the CartLink on the cart template has no `drawer` (so it prints no `data-rp-open` and the link navigates).
- **T-19 Overlays outside partials.** A block whose root contains a `<dialog>` (`dialog`, `drawer`, `cart-drawer`, `mobile-nav`, `product-gallery`) MUST NOT be called between `{% partial %}` and `{% endpartial %}` (RP404). The partial goes inside the overlay's body.
- **T-20 No utilities in shipped templates.** The templates of the Ripple theme MUST NOT pass `class:` to any block and MUST NOT print a `class` attribute. Layout is expressed with `container`, `stack`, `inline`, `grid` and their props. (A project MAY add utilities later; they exist only after the Canvas / Sidekick compile, section 5.3.)
- **T-21 No captures.** The templates of the Ripple theme MUST NOT contain `{% capture %}`.
- **T-22 `attributes` use.** In the templates of the Ripple theme the `attributes` param is used only with this ONE literal form: `'data-rp-region="<region name>"'`. `data-rp-region` is the only Ripple hook attribute that may be passed through `attributes` (D-091 item 2). An overlay opener is written with the `dialog` param of `link`, `button` or `icon-button` (or the `drawer` param of `cart-link`), never with `attributes: 'data-rp-open=...'` (D-009 as amended).
- **T-23 Raw HTML in templates.** The only HTML tags a template of the Ripple theme may write itself are: the document shell in `layout/*.liquid` (`html`, `head`, `body`, `main`), `li` (child of a `grid` or `stack` with `as: 'ul'` or `as: 'ol'`), `bdi`, `rp-view-event`, and `script type="application/json"` with the attribute `data-view-event-payload` as the only child of an `rp-view-event` (the cart view, D-089 item 3). Everything else is a block or a snippet. The Liquid tag `{% form %}` is not raw HTML and is allowed. A template writes no other `<script>` tag.
- **T-24 Fixed ids.** These ids are fixed in every host's blueprint files and are referenced by other files exactly as written. The table is a copy of [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) section 1.5, which owns the list (D-107 item 4); the table below is byte-equal to it.

| Id | Element | Referenced by |
|---|---|---|
| `main` | `<main>` of the layout | SkipLink `href="#main"` |
| `main-nav` | NavigationMenu root | Header prop `navigationMenu` |
| `mobile-nav` | MobileNav `<dialog>` | Header prop `mobileNav` |
| `footer-menu` | the Footer's LinkList `<nav>` | Header prop `linkList` (the no-JS target of the menu opener, D-009) |
| `search-dialog` | the search Dialog `<dialog>` | Header prop `searchDialog` |
| `predictive-search` | PredictiveSearch root | none |
| `footer-locale` | LocaleSelector popover panel in the footer | none |
| `newsletter` | NewsletterForm `<form>` | none |
| `cart-drawer` | CartDrawer `<dialog>`. MUST equal `CommerceOptions.cartDrawer` (D-087); CartDrawer's `id` defaults to it | Header prop `cartDrawer` (which passes it to CartLink's `drawer`); `CommerceOptions.cartDrawer` |
| `cart-drawer-list` | CartLines inside the drawer; its Liquid form id is `cart-drawer-list-form` | CartSummary `cartLines` / `cart_lines` in the drawer |
| `cart` | CartLines on the cart page; its Liquid form id is `cart-form` (D-092) | `cartLines` / `cart_lines` of CartSummary, CartNote and CheckoutButton on the cart page |
| `cart-discount` | DiscountCode on the cart page | none |
| `cart-note` | CartNote on the cart page | none |
| `product-gallery` | ProductGallery | none |
| `product-options` | VariantPicker | none |
| `product-form` | ProductForm | none |
| `collection-filters` | Filters | none |
| `collection-sort` | SortSelect | none |

The layout prints exactly one LocaleSelector, with id `footer-locale`; there is no `header-locale` id.

- **T-25 Theme JavaScript.** The shipped Ripple theme contains no theme-owned JavaScript module (D-039 as amended). A project MAY add one. When present it MUST be an ES module in `assets/`, loaded with `<script type="module" src="{{ '<file>' | asset_url }}"></script>`; it MUST import Ripple APIs only from the specifier `ripple` (`import { getCommerce, toast } from "ripple"`); it MUST NOT import `@shopify/hydrogen`, MUST NOT call `Shopify.actions.updateCart.configure` (RP307), MUST NOT define a custom element whose name starts with `rp-` or `ui-`, and MUST NOT select elements by `rp-` class (D-024 item 6: use `data-rp-*` hooks or its own `data-*` attributes).

---

## 3. Conventions every Ripple Liquid file follows

The binding rules are owned by [06-bindings.md](06-bindings.md) section 8. This table is the checklist an implementer applies to every file under `blocks/` and `snippets/`; each row names its rule there.

| Convention | Rule |
|---|---|
| File name: `blocks/<component id>.liquid`, `blocks/<component id>-<part>.liquid` (unprefixed); `snippets/rp-<id>.liquid` (always prefixed) | L-1, L-2, D-038 |
| File order: `{% doc %}`, optional `{%- liquid -%}` guard block, markup or one `{% render %}`, `{% schema %}`, trailer | 06 section 8.3 |
| `{% doc %}`: description, one `@param` per code param, then `class`, `attributes`, `content`; at least one valid `@example` | L-17 |
| `{% schema %}`: `"name": "t:ripple.<component id>.name"` (a part block: `"t:ripple.<component id>.<part>_name"`); `settings` array with at most three `select` settings, one per non-responsive enumerated prop that has a default; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (a character outside `[a-z0-9_]` in a value becomes `_`); no `presets`, no `tag` | L-17, D-038 item 5 and amendments (a), (b) |
| Every block accepts `class` (escaped, appended after the `rp-` class) and `attributes` (raw, printed last in the root start tag). A root printed by `{% form %}` accepts only `id` and `class` | L-11, L-18, D-035 as amended, D-091 item 6 |
| Exactly one `{{ content }}` outlet per block file; inline-level roots print `{{- content -}}` | L-6 |
| No content params: text is the block body. Only `aria_label` and RichText `html` carry text | D-035 item 5 |
| Params are snake_case; reserved names are never params: `true false nil blank empty content block section form settings for` | L-5, D-038 item 3 |
| Booleans tested with `== true`; enumerations guarded against an allow-list with fallback to the default; responsive strings escaped and printed unchanged | L-14, L-15, L-16 |
| Ids are explicit params; `block.id` is never used | L-8, D-020 |
| Strings are `{{ 'ripple.<component id>.<key>' | t }}` | L-10 |
| Only the tags and filters of the Component scope of the Ripple Liquid subset | L-13, D-097 |
| No `{% block %}`, no `{% partial %}`, no `{% capture %}` slot | L-12, L-7, T-2 |

Infrastructure snippets (`rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`, and the theme-owned `import-map` and `meta-tags`) use the Infrastructure scope of [06-bindings.md](06-bindings.md) rule L-13 (D-097): the component tags; the component filters plus `asset_url`, `stylesheet_tag`, `font_face`, and for `meta-tags` only `first`, `join`, `remove_first`, `slice`, `strip_html`, `money_without_currency`, `structured_data` (D-097 as amended, D-109); and the font object members section 6.3 uses (`family`, `fallback_families`, `weight`, `style`, `system?`). The shim of [13-testing.md](13-testing.md) implements them. They have a `{% doc %}` and no `{% schema %}` (they are snippets).

Call-site rules for templates (the blueprint files of doc 12 follow them):

1. Scale and responsive values are quoted strings: `gap: '4'`, `columns: '1 md:2'`.
2. Booleans are the literal `true` or a variable holding a boolean; never `'true'`.
3. A translated value used as an argument is assigned first: `assign close_label = 'ripple.blueprints.layout.close' | t`, then `aria_label: close_label`.
4. A component of tier `resource` is called with an empty body, except for region wiring (T-17).
5. A link that opens an overlay passes the dialog id in the `dialog` param (`link`, `button` with `href`, `icon-button` with `href`); the block prints `data-rp-open`. A template never writes `data-rp-open` (T-22).
6. The element param is `as` (`as: 'ul'`). Its use as a block argument is UNVERIFIED on a store (SPIKE-02 question V-17); the fallback name is `tag` (D-038 amendment (d)).

---

## 4. File tree of the Ripple theme

Location in the Ripple repository: `examples/liquid/`. "T" = theme-owned: the note says either "by hand" (created in step 1 of section 4.1) or "blueprint `<id>`" (written by `ripple add --blueprint <id>`; text owned by doc 12 unless the note names this document). "R" = registry file of owner `core` or of a component, written by `ripple init` or `ripple add`; MUST NOT be hand-written. The tree is produced by the procedure of section 4.1 and nothing else.

```text
examples/liquid/
  AGENTS.md                               T  by hand (section 4.2) + generated region written by core/patch:agents
  DESIGN.md                               T  by hand (section 4.3)
  assets/
    ripple.css                            R  composite stylesheet (07 section 4.5)
    ripple.js                             R
    ripple-tabs.js                        R
    ripple-tooltip.js                     R
    ripple-toast.js                       R
    ripple-shared.js                      R
    ripple-agent.js                       R  loaded only when a project calls loadAgent() (D-054 item 6)
    styles.min.css                        T  compiled from config/styles.css (section 5.3), committed
  blocks/
    <110 files>                           R  one per component or part (section 4.4)
  config/
    settings_data.json                    T  by hand: exactly {"current": {}}
    settings_schema.json                  T  by hand: the theme_info object; the Ripple group is written by core/patch:settings (section 6.1)
    styles.css                            T  by hand + marker region "theme" written by core/patch:theme-reference (section 5.2)
  layout/
    theme.liquid                          T  blueprint layout (doc 12)
    password.liquid                       T  blueprint password (doc 12)
  locales/
    en.default.json                       T  by hand: {} ; key "ripple" merged by the CLI (section 11)
    en.default.schema.json                T  by hand: {} ; key "ripple" merged by the CLI (section 11)
  snippets/
    import-map.liquid                     T  blueprint layout (text: this document, section 7.1)
    meta-tags.liquid                      T  blueprint layout (text: section 7.6, D-109)
    rp-head.liquid                        R  (section 7.3)
    rp-tokens.liquid                      R  (section 6.3)
    rp-import-map-entries.liquid          R  (section 7.2)
    rp-icon.liquid                        R
    rp-<id>.liquid                        R  every snippet the installed components declare
  templates/
    index.liquid                          T  blueprint home (doc 12)
    product.liquid                        T  blueprint product (doc 12)
    collection.liquid                     T  blueprint collection (doc 12)
    list-collections.liquid               T  blueprint collections-list (doc 12)
    search.liquid                         T  blueprint search (doc 12)
    cart.liquid                           T  blueprint cart (doc 12)
    blog.liquid                           T  blueprint blog (doc 12)
    article.liquid                        T  blueprint article (doc 12)
    page.liquid                           T  blueprint page (doc 12)
    page.contact.liquid                   T  blueprint contact (doc 12)
    404.liquid                            T  blueprint not-found (doc 12)
    password.liquid                       T  blueprint password (doc 12)
    gift_card.liquid                      T  blueprint gift-card (doc 12)
```

The 14 blueprints of ledger section 8.5 give 15 layout and template files (the `password` blueprint has two) and the two theme-owned snippets of the `layout` blueprint.

The theme MUST NOT contain: `sections/`, any `*.json` under `templates/`, `assets/icon-*.svg`, `assets/s-*.js`, `assets/standard-actions-override.js`, `assets/cart-feedback.js`, `assets/live-region.js`, `assets/quantity-rules.js`, `assets/view-transition.js`, `assets/page-view.js`, `assets/page-view-event.js`, `assets/page-view-event-init.js`, any other theme-owned `.js` file under `assets/` (D-039 as amended), `snippets/standard-actions-config.liquid`, `snippets/command-polyfill.liquid`, `snippets/theme-scripts.liquid`, `snippets/theme-styles.liquid`, `snippets/lcp-preload.liquid`, or any other base theme snippet listed as "removed" in section 12.2.

### 4.1 Build procedure (the only way the tree is produced)

Run from the Ripple repository root, after `pnpm build`. Steps 2 to 4 and 6 run `node bin/ripple.mjs` with `examples/liquid` as the working directory.

1. Create `examples/liquid/` holding exactly these seven hand-made files and nothing else:
   - `config/settings_data.json`: exactly `{"current": {}}`.
   - `config/settings_schema.json`: a JSON array holding ONLY the `theme_info` object of section 6.1.
   - `config/styles.css`: the file of section 5.2 WITHOUT the marker region (its first eight lines).
   - `locales/en.default.json`: exactly `{}`.
   - `locales/en.default.schema.json`: exactly `{}`.
   - `AGENTS.md`: the text of section 4.2.
   - `DESIGN.md`: the text of section 4.3.
2. `node bin/ripple.mjs init --host liquid`. The flag is required: host detection (D-057) needs `layout/theme.liquid`, which does not exist yet. Expected plan: three regions of `assets/ripple.css` (`core/tokens`, `core/base`, `core/props`); six JavaScript assets; the `core` snippets `rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`; patches `core/patch:theme-reference`, `core/patch:settings`, `core/patch:locale`, `core/patch:agents` applied; patches `core/patch:head` and `core/patch:import-map` reported as `patch-skipped`, because their target files (`layout/theme.liquid`, `snippets/import-map.liquid`) do not exist yet ([07-manifest-registry-cli.md](07-manifest-registry-cli.md) section 7.6).
3. `node bin/ripple.mjs add --all`.
4. `node bin/ripple.mjs add --blueprint <id>`, once for each of the 14 blueprints, in this order: `layout`, `home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card`. The `layout` blueprint writes `layout/theme.liquid`, `snippets/import-map.liquid` and `snippets/meta-tags.liquid`; these files already contain `{% render 'rp-head' %}` and `{% render 'rp-import-map-entries' %}`. Each blueprint also merges its `ripple.blueprints.<id>.*` keys into the locale files (D-107 item 5). After the 14 commands, running `node bin/ripple.mjs init --host liquid` again MUST print only `unchanged` and `patch-skipped` lines and write nothing.
5. `pnpm theme:css` (section 5.3), run from the repository root, to write `assets/styles.min.css`.
6. `node bin/ripple.mjs check` MUST exit 0.

The result is committed. No layout, template, block, snippet or asset is written by hand. CI repeats steps 2 to 6 on a clean copy of the seven hand-made files and fails when the result differs from the committed tree (acceptance A-2).

UNVERIFIED: the exact plan lines of steps 2 and 4 (which lines read `add`, `patch` or `patch-skipped`) have not been run; they depend on doc 07 section 7.6 as amended by its worklist. The first implementation run MUST record the real plan output in the test of A-2.

### 4.2 `AGENTS.md`

Theme-owned part (complete; the generated Ripple section follows it between the markers `<!-- ripple:start agents -->` and `<!-- ripple:end agents -->`, written by `core/patch:agents`):

```markdown
# Ripple base theme

This theme is built only from Ripple components. Read the Ripple section below before changing anything.

## Rules of this theme

1. No sections, no JSON templates, no presets, no `{% javascript %}`, no `{% stylesheet %}`, no `{% style %}`.
2. Compose pages in `templates/*.liquid` and `layout/*.liquid` with `{% block %}`. Never write `{% block %}` or `{% partial %}` in `blocks/` or `snippets/`.
3. Layout comes from the `container`, `stack`, `inline` and `grid` blocks and their props. Do not add `class:` arguments unless the task asks for a one-off style; utility classes work only after the Canvas or Sidekick compile of `config/styles.css`.
4. Text is the body of a block. Every string is a locale key in `locales/en.default.json`: `ripple.blueprints.*` for template text, `ripple.<component id>.*` for component text, and your own namespace for text you add.
5. Links use `routes.*` or a resource URL.
6. A region that refreshes in place is a `{% partial 'rp-<name>' %}` declared in the template, at most once per page. Copy the two forms from an existing template.
7. Never render a block that contains a dialog (`dialog`, `drawer`, `cart-drawer`, `mobile-nav`, `product-gallery`) inside a partial.
8. The cart drawer is not rendered on the cart template.
9. Do not add `snippets/standard-actions-config.liquid`, do not call `Shopify.actions.updateCart.configure`, do not load `@shopify/hydrogen`. Import cart access with `import { getCommerce } from "ripple"`.
10. Change the look in Theme settings (palette, fonts, radius, density, type scale) or in the `core/tokens` region of `assets/ripple.css`. Change one component in its region of `assets/ripple.css`.
11. After any change run `<command form> check`. It must exit 0.
12. Open an overlay from a link with the `dialog` param of `link`, `button` or `icon-button`; never write `data-rp-open` by hand.
```

`<command form>` is not printed literally: when the file is created it is written `npx <pkg>` with the real package name (D-052) and NO version, which is the spelling for static files ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 0; D-110). The two hand-made files therefore do not change when the package version changes, and the reproducibility test A-2 is version-independent.

### 4.3 `DESIGN.md`

Complete content (`<command form>` is replaced as in section 4.2):

```markdown
# Design

The look of this theme is defined by Ripple tokens. There is no other design source.

| What | Where | How |
|---|---|---|
| Colours | Theme settings, palette `rp_palette` | `surface` page background, `on_surface` text, `interactive` primary buttons, `surface_2` muted surfaces, `accent` links |
| Fonts | Theme settings `rp_font_body`, `rp_font_heading` | font pickers; the default is the system font |
| Corner radius | Theme setting `rp_radius` | 0 to 24 px |
| Spacing density | Theme setting `rp_density` | 75 to 125 percent |
| Type scale | Theme setting `rp_text_scale` | 113 to 133 (ratio 1.13 to 1.33) |
| Anything else | `assets/ripple.css`, region `core/tokens` | edit the token, then run `<command form> upgrade` to regenerate derived regions |

Rules: logical properties only; text contrast at least 4.5:1; motion respects `prefers-reduced-motion`; minimum target size 24 by 24 CSS px.
```

### 4.4 Block files

`ripple add --all` installs every V1 component. The number of block files is fixed by the tiers (D-037): tier `block` and tier `resource` give one file; tier `snippet` gives none; tier `parts` gives one file per author-placed part.

| Source | Components | Block files |
|---|---|---|
| Doc 09, tier `block` or `resource` (37 components minus Icon, Field, RadioGroup, Breadcrumb) | 33 | 33 |
| Doc 09, tier `parts`: `field`, `field-label`, `field-control`, `field-description`, `field-error`; `radio-group`, `radio-group-legend`, `radio-group-item`; `breadcrumb`, `breadcrumb-item` | 3 | 10 |
| Doc 10: `dialog` + 5 parts (6); `drawer` + 5 parts (6); `popover`, `popover-title` (2); `tooltip`, `tooltip-trigger`, `tooltip-content` (3); `toast` (1); `tabs`, `tabs-list`, `tabs-tab`, `tabs-panel` (4); `accordion`, `accordion-item`, `accordion-trigger`, `accordion-content` (4); `carousel`, `carousel-item` (2); `quantity-input` (1) | 9 | 29 |
| Doc 11 (all tier `block` or `resource`) | 26 | 26 |
| Doc 12 (all tier `block` or `resource`) | 12 | 12 |
| Total | 83 with block files (84 minus Icon) | 110 |

110 is below the Ripple budget of 150 and the platform limit of 300 (D-038 item 7, F-9). The number was re-derived from the `blocks/<name>.liquid` file names that docs 09 to 12 print (43 + 29 + 26 + 12); there is no `dialog-close` and no `drawer-close` block (D-084). The number is not normative: if a component spec changes its number of author-placed parts, the number changes with it. The invariant tested (A-3) is "equal to the count derived from the manifest, and at most 150".

---

## 5. CSS

### 5.1 `assets/ripple.css`

1. Ripple's component CSS on Liquid is ONE unminified, editable asset, `assets/ripple.css` (D-055 item 3). Its exact format, marker regions, trailers and merge behaviour are owned by [07-manifest-registry-cli.md](07-manifest-registry-cli.md) section 4.5. It is written only by the CLI.
2. It MUST be the first stylesheet the page loads (it carries the layer statement of D-025). `rp-head` prints its tag (section 7.3) and the layout renders `rp-head` before the tag of `styles.min.css` (section 10.2, constraint 1).
3. It needs no compiler. A theme edited only in "Edit Code", or installed from a zip, renders every Ripple component correctly (F-6).
4. It is NOT written into `config/styles.css`. The base-theme research recommended that; D-055 rejected it because Ripple would then depend on a compiler it does not control. `config/styles.css` is the theme's own Tailwind entry and holds no Ripple component CSS (D-055 amendment (e)). Liquid has exactly one CSS mode.
5. A merchant or agent MAY edit any region. `ripple upgrade` merges upstream changes three ways (D-057).

Install without the CLI (documented fallback, not used by the Ripple theme): copy `browser/ripple.css` from the package to `assets/ripple.css`. That file holds every component and has no marker regions; before a later `ripple init` the file MUST be deleted, because the CLI aborts on an untrailered file at a target path (D-057).

### 5.2 `config/styles.css`

Complete theme-owned file. The marker region is written by `core/patch:theme-reference`; its body is `generateThemeCss(<body of region core/tokens>)` ([03-styling-and-tokens.md](03-styling-and-tokens.md) section 5.1) and MUST NOT be hand-written.

```css
@layer ui-sdk, theme, base, rp, components, rmx, utilities;
@layer rp.tokens, rp.base, rp.components, rp.props;
@import "tailwindcss" source(none);
@source "../assets/*.js";
@source "../blocks/**/*.liquid";
@source "../snippets/**/*.liquid";
@source "../templates/**/*.liquid";
@source "../layout/**/*.liquid";

/* ripple:start theme */
<generated @theme reference block>
/* ripple:end theme */
```

Rules:

1. The two layer statements are the first statements (D-025). The `@import` and the five `@source` lines are those of `theme/config/styles.css`, unchanged.
2. The file contains NO token declarations of its own, no `@layer components` rules, no `@utility`, no element-selector base styles. Everything the base theme had there (27 component classes, form element styles, `display` rules for `s-*` tags) is replaced by `assets/ripple.css`.
3. A project MAY add its own CSS below the marker region. It MUST NOT edit inside the region.

### 5.3 `assets/styles.min.css`

1. It is the compiled output of `config/styles.css`. On a store it is regenerated by Canvas / Sidekick after theme changes (F-6). Ripple never writes it on a store.
2. In the Ripple repository it is produced by the root `package.json` script `theme:css`, exactly: `tailwindcss -i examples/liquid/config/styles.css -o examples/liquid/assets/styles.min.css --minify` (package `@tailwindcss/cli`, a devDependency of the repository pinned at `4.3.5`, `01-architecture.md` section 9). The result is committed.
3. Because of T-20 the shipped templates contain no utility, so this file contains only Tailwind's theme and preflight layers. Both sit below layer `rp` in the layer order, so Ripple rules win.
4. The layout loads it AFTER `ripple.css` with `{{ 'styles.min.css' | asset_url | stylesheet_tag }}`.
5. A stale or missing `styles.min.css` MUST NOT change the rendering of any Ripple component (acceptance A-12).

### 5.4 Utilities as the escape hatch

A project that wants a one-off style passes `class: '<utilities>'` to any block. The classes exist only after the compile of `config/styles.css`; they MUST be complete literal strings in a scanned file (never assembled from fragments). With the marker region present, utilities can name Ripple tokens: `bg-primary`, `text-muted-foreground`, `rounded-control`, `gap-4`.

### Fallback (SPIKE-03)

When the Canvas / Sidekick compiler rejects the `@theme reference` block or the layer statements:

1. `core/patch:theme-reference` is not applied; `config/styles.css` is the file of 5.2 without the two `@layer` lines and without the marker region.
2. Utilities name Ripple tokens through arbitrary values: `bg-(--color-primary)`, `rounded-(--radius-control)`, `p-[calc(var(--spacing)*4)]`.
3. Nothing else changes: `assets/ripple.css` is loaded first and already establishes the layer order.

---

## 6. Tokens and theme settings

### 6.1 `config/settings_schema.json` (complete)

```json
[
  {
    "name": "theme_info",
    "theme_name": "Ripple Base",
    "theme_version": "0.1.0",
    "theme_author": "Ripple",
    "theme_documentation_url": "https://help.shopify.com/manual/online-store/themes",
    "theme_support_url": "https://support.shopify.com/"
  },
  {
    "name": "t:ripple.settings.name",
    "settings": [
      {
        "type": "color_palette",
        "id": "rp_palette",
        "default": {
          "surface": "#FFFFFF",
          "on_surface": "#18181B",
          "surface_2": "#F4F4F5",
          "accent": "#18181B",
          "interactive": "#18181B"
        }
      },
      {
        "type": "font_picker",
        "id": "rp_font_body",
        "label": "t:ripple.settings.font_body",
        "default": "system_ui_n4"
      },
      {
        "type": "font_picker",
        "id": "rp_font_heading",
        "label": "t:ripple.settings.font_heading",
        "default": "system_ui_n4"
      },
      {
        "type": "range",
        "id": "rp_radius",
        "label": "t:ripple.settings.radius",
        "min": 0,
        "max": 24,
        "step": 2,
        "unit": "px",
        "default": 8
      },
      {
        "type": "range",
        "id": "rp_density",
        "label": "t:ripple.settings.density",
        "min": 75,
        "max": 125,
        "step": 5,
        "unit": "%",
        "default": 100
      },
      {
        "type": "range",
        "id": "rp_text_scale",
        "label": "t:ripple.settings.text_scale",
        "min": 113,
        "max": 133,
        "step": 1,
        "default": 120
      }
    ]
  }
]
```

The second object, byte for byte, is the content of `src/gen/liquid-core/settings.json` (registry `registry/liquid/settings.json`), which `core/patch:settings` appends to or replaces in any theme ([07-manifest-registry-cli.md](07-manifest-registry-cli.md) section 7.6.3). The Ripple theme has no other settings group (ledger section 11 item 11). Bounds, units and defaults are fixed by D-098 items 1 and 2. The font default `system_ui_n4` is the handle of the system font (F-11).

### 6.2 Mapping

| Setting | Type | Editor range | Printed as | Dial range ([03-styling-and-tokens.md](03-styling-and-tokens.md) 3.2) | Default equals `tokens.css` default |
|---|---|---|---|---|---|
| `rp_palette.surface` | palette slot | hex | `--rp-background: <hex>` | any sRGB colour | yes (`#FFFFFF` = `oklch(1 0 0)`) |
| `rp_palette.on_surface` | palette slot | hex | `--rp-foreground: <hex>` | any sRGB colour | nearest hex of `oklch(0.21 0.006 286)` |
| `rp_palette.interactive` | palette slot | hex | `--rp-brand: <hex>` | any sRGB colour | nearest hex of `oklch(0.21 0.006 286)` |
| `rp_palette.surface_2` | palette slot | hex | `--color-muted: <hex>` | derived token, overridden directly | nearest hex of the 5 percent mix |
| `rp_palette.accent` | palette slot | hex | `--rp-accent: <hex>` | any colour | yes: equal to `on_surface`, which is what an unset `--rp-accent` resolves to |
| `rp_font_body` | `font_picker` | font library | nothing for a system font; otherwise `--rp-font-body: <family>, <fallback families>` plus `@font-face` | font-family list | yes: the default `system_ui_n4` prints nothing |
| `rp_font_heading` | `font_picker` | font library | nothing for a system font; otherwise `--rp-font-heading: <family>, <fallback families>` plus `@font-face` | font-family list | yes: the default `system_ui_n4` prints nothing |
| `rp_radius` | `range` | 0 to 24 px, step 2 | `--rp-radius: <value / 16>rem` | 0 to 1.5rem | yes (8 px = 0.5rem) |
| `rp_density` | `range` | 75 to 125 percent, step 5 | `--rp-density: <value / 100>` | 0.75 to 1.25 | yes (100 = 1) |
| `rp_text_scale` | `range` | 113 to 133, step 1 | `--rp-text-scale: <value / 100>` | 1.125 to 1.333 | yes (120 = 1.2) |

Rules:

1. The three `range` settings are the "less / more" sliders of Ben's decision 6. Each writes exactly one dial. Their bounds are inside the dial's allowed range, so no clamping is needed in Liquid.
2. Setting ids, palette slot names and target tokens are fixed by D-026 item 5. No other theme setting may write a Ripple token. `--rp-brand-foreground` is never printed; the computed value applies ([03-styling-and-tokens.md](03-styling-and-tokens.md) 3.5).
3. The palette applies to the `light` scheme only (it is printed on `:root, [data-scheme="light"]`). The `dark` scheme keeps the values of `tokens.css`.
4. One `color_palette` per theme (D-098 item 3). `core/patch:settings` on a theme that already has a `color_palette` setting with another id (the base theme has `color_palette`): because a theme may hold only one (F-7), the CLI MUST write the Ripple group WITHOUT the `rp_palette` object and print `note: this theme already has a color_palette setting ("<id>"); rp_palette was not added. Ripple colours stay at their tokens.css values until you map them in snippets/rp-tokens.liquid.` `rp-tokens` then prints no colour dials (every colour line is guarded).
5. A font whose `system?` member is true prints NO `@font-face` rule and NO `--rp-font-body` / `--rp-font-heading` declaration; `tokens.css` then supplies its system stack (D-098 item 2).

### 6.3 `snippets/rp-tokens.liquid` (complete)

Source: `src/gen/liquid-core/rp-tokens.liquid`. It prints ONE `<style>` element: `@font-face` rules, then the two rules required by [03-styling-and-tokens.md](03-styling-and-tokens.md) section 3.8.

```liquid
{% doc %}
  Ripple token bridge. Prints the theme settings as Ripple dials.
  Rendered by `rp-head` directly after the `ripple.css` stylesheet tag.
  Do not render it anywhere else.

  @example
  {% render 'rp-tokens' %}
{% enddoc %}
{%- liquid
  assign palette = settings.rp_palette
  assign font_body = settings.rp_font_body
  assign font_heading = settings.rp_font_heading
  assign face_body = font_body.family | append: '|' | append: font_body.weight | append: '|' | append: font_body.style
  assign face_heading = font_heading.family | append: '|' | append: font_heading.weight | append: '|' | append: font_heading.style
-%}
<style>
  {%- if font_body != blank and font_body.system? != true %}
  {{ font_body | font_face: font_display: 'swap' }}
  {%- endif %}
  {%- if font_heading != blank and font_heading.system? != true and face_heading != face_body %}
  {{ font_heading | font_face: font_display: 'swap' }}
  {%- endif %}
  :root {
    {%- if settings.rp_radius != nil %}
    --rp-radius: {{ settings.rp_radius | divided_by: 16.0 }}rem;
    {%- endif %}
    {%- if settings.rp_density != nil %}
    --rp-density: {{ settings.rp_density | divided_by: 100.0 }};
    {%- endif %}
    {%- if settings.rp_text_scale != nil %}
    --rp-text-scale: {{ settings.rp_text_scale | divided_by: 100.0 }};
    {%- endif %}
    {%- if font_body != blank and font_body.system? != true %}
    --rp-font-body: {{ font_body.family }}, {{ font_body.fallback_families }};
    {%- endif %}
    {%- if font_heading != blank and font_heading.system? != true %}
    --rp-font-heading: {{ font_heading.family }}, {{ font_heading.fallback_families }};
    {%- endif %}
  }
  :root,
  [data-scheme="light"] {
    {%- if palette.surface != blank %}
    --rp-background: {{ palette.surface }};
    {%- endif %}
    {%- if palette.on_surface != blank %}
    --rp-foreground: {{ palette.on_surface }};
    {%- endif %}
    {%- if palette.interactive != blank %}
    --rp-brand: {{ palette.interactive }};
    {%- endif %}
    {%- if palette.accent != blank %}
    --rp-accent: {{ palette.accent }};
    {%- endif %}
    {%- if palette.surface_2 != blank %}
    --color-muted: {{ palette.surface_2 }};
    {%- endif %}
  }
</style>
```

Notes:

1. The numeric settings are tested with `!= nil` because `0` is a valid radius. A declaration whose setting is missing is omitted, never printed empty.
2. The font lines follow `theme/snippets/theme-styles.liquid` (`family`, `fallback_families`, `font_face: font_display: 'swap'`).
3. With the default `system_ui_n4` nothing is printed for fonts, so `tokens.css` supplies its system stack and the Liquid default look equals the other hosts (D-098 item 2). The member `font.system?` was read in the Shopify docs and is UNVERIFIED on a store (SPIKE-02 question V-19).
4. A non-system font prints one `@font-face` rule per distinct face (the heading rule is skipped when family, weight and style equal the body font's) and its font dial.
5. Expected output for the defaults contains `--rp-radius: 0.5rem;`, `--rp-density: 1.0;`, `--rp-text-scale: 1.2;`, `--rp-background: #FFFFFF;`, and contains neither `@font-face` nor `--rp-font-`.
6. The output is two rules, never one: non-colour dials on `:root`, colour dials on `:root, [data-scheme="light"]` (D-026 item 5 as amended).

---

## 7. JavaScript loading

### 7.1 `snippets/import-map.liquid` (complete, theme-owned)

This file is a file of the `layout` blueprint (key `import-map`); `ripple add --blueprint layout` writes it and appends the blueprint trailer (D-056) after the last line shown.

```liquid
{% doc %}
  The theme's single import map. Render it first in <head>, before any module
  script and before content_for_header: browsers ignore an import map that
  appears after the first module script.

  Ripple's entries come from `rp-import-map-entries`. Add theme entries after
  the `@shopify/standard-events` line. Keep at least one entry after the render
  line: the Ripple entries end with a comma.

  @example
  {% render 'import-map' %}
{% enddoc %}
<script type="importmap">
{
  "imports": {
    {% render 'rp-import-map-entries' %}
    "@shopify/standard-events": "https://cdn.shopify.com/storefront/standard-events.js"
  }
}
</script>
```

1. In the Ripple theme the file is written with the render line already in it, so `core/patch:import-map` reports `patch-skipped`. On another theme, which has its own import map, `core/patch:import-map` inserts the line `{% render 'rp-import-map-entries' %}` directly after the `"imports": {` line.
2. The `@shopify/standard-events` entry and its URL are those of `theme/snippets/import-map.liquid`. `ripple.js` imports that specifier (`createViewEventElement`, `PageViewEvent`).
3. `@shopify/partial-rendering` MUST NOT be added to the map: the platform supplies it (F-5; how is UNVERIFIED, section 15 question V-4). `ripple.js` loads it with a guarded dynamic import and falls back to navigation when it is missing (D-046).
4. The import map MUST contain at least one entry after the render line. `ripple check` layer H reports invalid JSON in the rendered map through RP510 (patch state); acceptance A-6 parses it.

### 7.2 `snippets/rp-import-map-entries.liquid` (complete)

Source: `src/gen/liquid-core/rp-import-map-entries.liquid`. The six entries are fixed by D-054 item 3 and [04-elements.md](04-elements.md) section 5.4. Every line ends with a comma, including the last, so the theme map MUST keep at least one entry after the render line (section 7.1 rule 4).

```liquid
{% doc %}
  Ripple entries for the theme's import map. Rendered inside the "imports"
  object of the single import map, before the theme's own entries.

  @example
  {% render 'rp-import-map-entries' %}
{% enddoc %}
"ripple": "{{ 'ripple.js' | asset_url }}",
"ripple/tabs": "{{ 'ripple-tabs.js' | asset_url }}",
"ripple/tooltip": "{{ 'ripple-tooltip.js' | asset_url }}",
"ripple/toast": "{{ 'ripple-toast.js' | asset_url }}",
"ripple/shared": "{{ 'ripple-shared.js' | asset_url }}",
"ripple/agent": "{{ 'ripple-agent.js' | asset_url }}",
```

### 7.3 `snippets/rp-head.liquid` (complete)

Source: `src/gen/liquid-core/rp-head.liquid`. Order is fixed by D-054 item 7: the stylesheet tag for `ripple.css`; `{% render 'rp-tokens' %}`; the config element `<script type="application/json" id="rp-commerce">` (D-087); the inline Invoker Commands polyfill; the module script. The inline script is the one [04-elements.md](04-elements.md) section 3.3 requires, byte-identical to the output generated from `src/runtime/commands-polyfill.ts` (D-078).

`rp-head` prints exactly this and nothing else: no title, no meta tags, no import map, no `{{ content_for_header }}` (D-099 item 4).

```liquid
{% doc %}
  Ripple head. Render exactly once in <head> of every layout:
  after the import map, before the styles.min.css stylesheet tag,
  and before content_for_header.

  @example
  {% render 'rp-head' %}
{% enddoc %}
{{ 'ripple.css' | asset_url | stylesheet_tag: preload: true }}
{% render 'rp-tokens' %}
<script type="application/json" id="rp-commerce">
{
  "host": "liquid",
  "cartUrl": {{ routes.cart_url | json }},
  "cartAddUrl": {{ routes.cart_add_url | json }},
  "cartDrawer": "cart-drawer",
  "strings": {
    "added": {{ 'ripple.product-form.added' | t | json }},
    "updated": {{ 'ripple.cart-lines.updated' | t | json }},
    "removed": {{ 'ripple.cart-lines.removed' | t | json }},
    "discountApplied": {{ 'ripple.discount-code.applied' | t | json }},
    "discountRemoved": {{ 'ripple.discount-code.removed' | t | json }},
    "noteSaved": {{ 'ripple.cart-note.saved' | t | json }},
    "error": {{ 'ripple.cart-lines.error' | t | json }}
  }
}
</script>
<script>
(function () {
  if ("commandForElement" in HTMLButtonElement.prototype || window.rpCommandsPolyfill) return;
  window.rpCommandsPolyfill = true;
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;
    var origin = event.target instanceof Element ? event.target : null;
    var button = origin && origin.closest("button[commandfor]");
    if (!button || button.disabled) return;
    var target = document.getElementById(button.getAttribute("commandfor") || "");
    if (!target) return;
    var command = button.getAttribute("command") || "";
    var commandEvent = new Event("command", { bubbles: false, cancelable: true });
    commandEvent.command = command;
    commandEvent.source = button;
    if (!target.dispatchEvent(commandEvent)) return;
    if (command === "show-modal") { if (target.showModal && !target.open) target.showModal(); }
    else if (command === "close") { if (target.close && target.open) target.close(); }
    else if (command === "show-popover") { if (target.showPopover && !target.matches(":popover-open")) target.showPopover(); }
    else if (command === "hide-popover") { if (target.hidePopover && target.matches(":popover-open")) target.hidePopover(); }
    else if (command === "toggle-popover") { if (target.togglePopover) target.togglePopover(); }
  });
})();
</script>
<script type="module" src="{{ 'ripple.js' | asset_url }}"></script>
```

Rules:

1. `rp-head` is rendered by BOTH layouts (`theme.liquid`, `password.liquid`).
2. The `src` of the module script and the import-map value of `ripple` are the same filter on the same file name, so the browser creates one module instance ([04-elements.md](04-elements.md) section 5.4 rule 1).
3. Config element (D-087). Its keys are exactly `host`, `cartUrl`, `cartAddUrl`, `cartDrawer` (the literal `"cart-drawer"`, which MUST equal the id of the CartDrawer `<dialog>`, T-24) and `strings`. `strings` has exactly the seven keys `added`, `updated`, `removed`, `discountApplied`, `discountRemoved`, `noteSaved`, `error`, each sourced from the one locale key shown. `analytics` is NOT printed; its default is `true`. No other option is printed. The config element is printed here and NOT in the layout file (D-087 item 3).
4. Because `rp-head` is installed by `ripple init` before any component, `registry/liquid/locales/core.json` MUST contain the seven locale keys the config element reads (`ripple.product-form.added`, `ripple.cart-lines.updated`, `ripple.cart-lines.removed`, `ripple.discount-code.applied`, `ripple.discount-code.removed`, `ripple.cart-note.saved`, `ripple.cart-lines.error`) with the English texts of [05-commerce.md](05-commerce.md) section 4.3, in addition to the settings labels of section 11.2. The component locale files carry the same keys with the same values; the merge never overwrites (07 section 7.6.4).
5. The five further files are never referenced by a `<script>` tag. `ripple.js` imports them by bare specifier (D-054 item 2, D-083): `ripple-tabs.js` when a `ui-tabs` tag is in the document at `DOMContentLoaded` or is inserted later; `ripple-tooltip.js` when a `ui-tooltip` tag is; `ripple-toast.js` on the first `toast()` call only (the `ui-toast-region` that every layout prints does NOT trigger a load); `ripple-shared.js` is imported by the tooltip and toast chunks; `ripple-agent.js` is loaded only through the `loadAgent()` export of `ripple`.
6. No block, snippet or template prints a `<script>` tag for Ripple code. The base theme's call-site module tags have no equivalent.

### 7.4 What replaces "one custom element per file"

The base theme ships 15 element files and 7 helper modules and prints a module tag per call site. The Ripple theme ships one bundle and five further files (`tabs`, `tooltip`, `toast`, `shared`, `agent`), all library code (D-053): they MUST NOT be edited in the theme, and `ripple upgrade` overwrites them whole, with a warning when a file was modified. In the Ripple source repository the rule "one element per source file" still holds (`src/elements/<tag>.ts`, `src/commerce/<tag>.ts`, D-019 item 7).

### 7.5 Page view

The Liquid adapter inside `ripple.js` dispatches one `PageViewEvent` (from `@shopify/standard-events`) per document load when `options.analytics` is true (D-089 item 6). It reads the template name from `main[data-template]`, which the layout prints from `request.page_type`. The theme contains no page-view asset and no module tag for one ([05-commerce.md](05-commerce.md) section 12).

### 7.6 `snippets/meta-tags.liquid` (theme-owned; the base theme file with two key renames)

This file is a file of the `layout` blueprint (key `meta-tags`, repository source `blueprints/layout/liquid/snippets/meta-tags.liquid`); `ripple add --blueprint layout` writes it and appends the blueprint trailer. Both layouts render it directly after the import map. It prints the document metadata that `rp-head` does not print (D-099 item 4).

Its text is decided by D-109: it is `theme/snippets/meta-tags.liquid` (253 lines, in this repository) with exactly these two replacements and no other change. The text is therefore not reprinted here; the base theme file is the source.

| In `theme/snippets/meta-tags.liquid` | In `snippets/meta-tags.liquid` |
|---|---|
| `'general.meta.tagged'` | `'ripple.blueprints.layout.meta_tagged'` |
| `'general.meta.page'` | `'ripple.blueprints.layout.meta_page'` |

Build command for the source file (run once, output committed):

```sh
sed -e "s/'general\.meta\.tagged'/'ripple.blueprints.layout.meta_tagged'/" -e "s/'general\.meta\.page'/'ripple.blueprints.layout.meta_page'/" theme/snippets/meta-tags.liquid > blueprints/layout/liquid/snippets/meta-tags.liquid
```

Rules:

1. What it prints (all carried over from the base theme, so SEO does not regress): charset and viewport metas, favicon links, Open Graph and Twitter metas including `og:price:*` and the image size and alt tags, `<title>` with the "tagged" and "page N" suffixes, canonical and `hreflang` alternate links, the description meta, the robots meta, and the JSON-LD scripts (product through `structured_data`, WebSite, Organization).
2. Scope: the Infrastructure scope of [06-bindings.md](06-bindings.md) rule L-13 (D-097 as amended). The seven filters `first`, `join`, `remove_first`, `slice`, `strip_html`, `money_without_currency`, `structured_data` are in that scope only for this file.
3. Locale keys: the two keys above. They are keys of the `layout` blueprint ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md), blueprint `layout`, "Locale keys"); English text `meta_tagged`: `tagged "{{ tags }}"`, `meta_page`: `Page {{ number }}` (the base theme's text). The theme has no `general.*` key.
4. Globals read (the shim of [13-testing.md](13-testing.md) supplies them): `page_title`, `page_description`, `page_image`, `canonical_url`, `current_tags`, `current_page`, `request.origin`, `request.page_type`, `request.locale` (`root_url`), `shop` (`name`, `description`, `published_locales`, `brand.favicon`, `brand.logo`), `product` (on the product page), `routes.search_url`.
5. The `<script type="application/ld+json">` elements it prints are data blocks, not JavaScript; rules T-23 and T-25 (no theme-owned script) do not apply to them.
6. The values of `request.page_type` it tests (`product`, `article`, `password`, `search`, `cart`, `404`, `index`) are those of the base theme file; they are UNVERIFIED on a store (SPIKE-02 question V-18).

---

## 8. Standard Actions and Hydrogen on a theme

The JavaScript is owned by [05-commerce.md](05-commerce.md) (sections 4.5, 5.2, 10.4). What the THEME must do, and nothing more:

1. Render `rp-head` (section 7.3) in every layout. It prints the config element `#rp-commerce` with `"host": "liquid"` (D-087 item 3); the adapter derives `backend: "liquid"` from it.
2. NOT contain `snippets/standard-actions-config.liquid`, `assets/standard-actions-override.js`, or the text `updateCart.configure` in any file outside `assets/ripple*.js` (RP307, D-041 item 5). Hydrogen's `createCartStore()` inside `ripple.js` makes the one `Shopify.actions.updateCart.configure` call and, with no cart endpoint configured, its handler calls the platform's default handler.
3. NOT load `@shopify/hydrogen` or any second copy of Ripple (D-041 item 4).
4. Print cart forms in the liquid dialect (D-043). The Ripple blocks do this; a template never writes a cart `<form>`, `<input>` or submit button by hand.
5. Give the CartDrawer `<dialog>` the id `cart-drawer` (T-24). The adapter configures `Shopify.actions.openCart` to open it; on a page without it (the cart template, T-18) `openCart()` navigates to `cartUrl`, which is `routes.cart_url` (D-042 amendment (b), D-091 item 5).
6. Declare the cart partials of section 9.

What the platform must provide, all UNVERIFIED on a store (SPIKE-01, SPIKE-02): `window.Shopify.actions` present before the first cart read; `@shopify/partial-rendering` resolvable; `@shopify/standard-events` at the mapped URL.

Failure behaviour the theme relies on (D-041 item 7): when the commerce runtime cannot start, every form posts natively. The markup that makes that work is in section 13.

### Fallback (SPIKE-01)

The theme does not change. The fallback replaces the store implementation inside `adapter-liquid.ts` ([05-commerce.md](05-commerce.md) "Fallback (SPIKE-01)").

---

## 9. Regions and partials

### 9.1 Where each partial is declared

Owners and snippet names are fixed by D-091 item 1. The files named in "Declared in" are blueprint files of doc 12; this table states which partial each MUST declare.

| Region / partial name | Owner | Form (T-17) | Region root printed by | Declared in | Refreshed by |
|---|---|---|---|---|---|
| `rp-cart-lines` | CartLines, part `list` | component | `snippets/rp-cart-lines-list.liquid` | `layout/theme.liquid` (inside CartDrawer, all templates except `cart`); `templates/cart.liquid` | cart adapter after any cart mutation settles |
| `rp-cart-summary` | CartSummary, part `totals` | component | `snippets/rp-cart-summary-totals.liquid` | same two files | same |
| `rp-predictive-results` | PredictiveSearch, part `results` | component | `snippets/rp-predictive-search-results.liquid` | `layout/theme.liquid` (inside the search Dialog) | `rp-predictive-search` on input |
| `rp-product-media` | ProductGallery, part `media` | component | `snippets/rp-product-gallery-media.liquid` | `templates/product.liquid` | VariantPicker (`rp-live`) on variant change |
| `rp-product-buy` | blueprint `product` | template | a layout block (`stack` or `inline`), as doc 12 prints it | `templates/product.liquid` | VariantPicker on variant change |
| `rp-product-recommendations` | ProductRecommendations, part `list` | component | `snippets/rp-product-recommendations-list.liquid` | `templates/product.liquid` | `rp-recommendations` once, when within 400 px of the viewport (SPIKE-09) |
| `rp-collection-filters` | Filters, part `groups` | component | `snippets/rp-filters-groups.liquid` | `templates/collection.liquid` only | Filters, SortSelect, FilterChips (`rp-live`) |
| `rp-collection-toolbar` | blueprint `collection` | template | a layout block (`stack` or `inline`), as doc 12 prints it | `templates/collection.liquid` only | same three |
| `rp-collection-results` | blueprint `collection` | template | a layout block (`stack` or `inline`), as doc 12 prints it | `templates/collection.liquid` | same three |
| `rp-search-results` | blueprint `search` | template | a layout block (`stack` or `inline`), as doc 12 prints it | `templates/search.liquid` | none in V1: the search template has no Filters, SortSelect or FilterChips; a new search and a page change are full navigations |

No template declares any other partial. The ten names are the fixed region names of D-046 item 1; the `rp-` prefix is reserved for Ripple, so a project that adds a region uses a name that does not start with `rp-`.

### 9.2 Which mutation refreshes which partial

"On failure" is what the Liquid refresh strategy does when `partials.fetch` or `partials.apply` fails or `@shopify/partial-rendering` cannot be imported (D-090 item 2, row `liquid`).

| User action | Element | Request | Reason | Partials fetched | URL passed to `partials.fetch` | On failure |
|---|---|---|---|---|---|---|
| Add to cart | `rp-product-form` | store mutation through Standard Actions | `cart` | `rp-cart-lines`, `rp-cart-summary` (the drawer's) | none (current page) | `location.reload()` |
| Change a line quantity, remove a line | `rp-cart` (CartLines) | store mutation, intent `set` with the absolute quantity (D-044) | `cart` | `rp-cart-lines`, `rp-cart-summary` | none | `location.reload()` |
| Apply or remove a discount code | `rp-cart` (DiscountCode, CartSummary) | store mutation | `cart` | `rp-cart-lines`, `rp-cart-summary` | none | `location.reload()` |
| Save the order note | `rp-cart` (CartNote) | store mutation | `cart` | `rp-cart-lines`, `rp-cart-summary` | none | `location.reload()` |
| Choose a variant | `rp-live` (VariantPicker) | none | `variant` | `rp-product-buy`, `rp-product-media` | the option link's URL (`?variant=<id>`); `history.replaceState` | `location.assign(url)` |
| Change a filter, the sort order, remove a chip (collection template) | `rp-live` | none | `filter` | `rp-collection-results`, `rp-collection-filters`, `rp-collection-toolbar` | the form URL; `history.pushState` | `location.assign(url)` |
| Type in the search dialog | `rp-predictive-search` | none | `predictive` | `rp-predictive-results` | `routes.search_url` + `?q=<terms>` | nothing happens: no navigation (D-090 item 3) |
| Scroll near recommendations | `rp-recommendations` | none | `recommendations` | `rp-product-recommendations` | the element's `data-url`: `routes.product_recommendations_url` + `?product_id=<id>&limit=4&intent=related` | nothing happens: no navigation (D-090 item 3) |
| Go to another results page | none (Pagination links) | full navigation | none | none | none | not applicable |

The cart partial list is not written in the theme: the adapter computes it as the union of the `data-rp-refresh` values of every `rp-cart` root on the page, limited to regions present ([05-commerce.md](05-commerce.md) section 8.4). `rp-product-form` carries no `data-rp-refresh` (ledger section 4.4). CartLink (header) carries no `data-rp-refresh`; its count is updated from the store, not from a partial. There is no `rp-cart-count` partial.

### 9.3 Rules

1. T-17, T-18, T-19 apply.
2. When `partials.fetch` or `partials.apply` fails or `@shopify/partial-rendering` cannot be imported, the adapter navigates (`location.assign(url)` when the request had a URL, `location.reload()` otherwise); the page is then correct ([05-commerce.md](05-commerce.md) section 8), except for reasons `predictive` and `recommendations`, which never navigate (D-090 item 3). The theme adds no fallback code.
3. `partials.apply` replaces DOM (F-2). Nothing in a template may depend on an element inside a region keeping its identity.
4. The checker enforces this section: RP403 (a `data-rp-refresh` name without a partial; a partial declared twice in one file), RP404 (overlay block inside a partial), RP308 (a `data-rp-refresh` name whose region is not on the page; an `rp-cart` root inside the region it refreshes). The containment check of RP308 applies only to `rp-cart` roots: an `rp-live` root (VariantPicker, SortSelect, FilterChips) MAY sit inside the region it refreshes (D-047, D-102 item 4).

---

## 10. Layout and templates

Every template and layout is the Liquid file of a blueprint ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)). Each MUST obey T-1 to T-25, the call-site rules of section 3, and the region table of section 9.1. This document prints none of them (D-099).

### 10.1 Where each file is specified

| File | Complete text |
|---|---|
| `layout/theme.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `layout`, Liquid file |
| `layout/password.liquid`, `templates/password.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `password`, Liquid files |
| `templates/index.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `home`, Liquid file |
| `templates/product.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `product`, Liquid file |
| `templates/collection.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `collection`, Liquid file |
| `templates/list-collections.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `collections-list`, Liquid file |
| `templates/search.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `search`, Liquid file |
| `templates/cart.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `cart`, Liquid file |
| `templates/blog.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `blog`, Liquid file |
| `templates/article.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `article`, Liquid file |
| `templates/page.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `page`, Liquid file |
| `templates/page.contact.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `contact`, Liquid file |
| `templates/404.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `not-found`, Liquid file |
| `templates/gift_card.liquid` | `12-components-chrome-and-blueprints.md`, Blueprint `gift-card`, Liquid file |

### 10.2 Constraints the layout satisfies

These constraints come from D-099 item 3 and from the infrastructure of this document. Doc 12's `layout/theme.liquid` MUST satisfy every one; acceptance A-6, A-7, A-13 and A-14 test them.

1. `<head>` contains exactly these five lines, in this order: `{% render 'import-map' %}`, `{% render 'meta-tags' %}`, `{% render 'rp-head' %}`, `{{ 'styles.min.css' | asset_url | stylesheet_tag }}`, `{{ content_for_header }}`. This satisfies T-6 (the import map is the first element of `<head>`), D-054 item 7 (`rp-head` after the import map and before `content_for_header`) and D-055 (`ripple.css` before `styles.min.css`). There is no page-view module tag (section 7.5).
2. `<html>` prints `lang` and `dir` as in T-5. `<body>` carries no class: page background, text colour and font come from `base.css` inside `ripple.css`.
3. The body is the list of ledger section 8.5: SkipLink, AnnouncementBar, Header with its default body, `<main>`, Footer, CartDrawer (unless the cart template), MobileNav, the search Dialog holding PredictiveSearch, the Toast region. There is no Announcer block (D-079). The order of these children is owned by doc 12 (test LT-1).
4. `<main>` is printed as `<main id="main" tabindex="-1" data-template="{{ request.page_type }}">`. The Liquid adapter reads `data-template` for the page view (section 7.5).
5. The three header openers (menu, search, cart) are printed by Header's default body, through the `dialog` prop of IconButton and the `drawer` prop of CartLink (D-009 as amended). The layout passes the dialog ids to Header through the Header props `mobileNav`, `searchDialog` and `cartDrawer` (D-085); it does not compose the header by hand and passes no `attributes: 'data-rp-open=...'`. Each opener is a link with a page equivalent as `href`: the menu to `#footer-menu`, search to `routes.search_url`, cart to `routes.cart_url`.
6. Footer menu (doc 12 rule LY-1): the footer LinkList with id `footer-menu` renders the footer menu, or the main menu when the footer menu is empty. It is the page equivalent of MobileNav. When both menus are empty no `#footer-menu` exists and the menu opener's `href` is `#main` (doc 12 test LT-2).
7. Every `<dialog>` is rendered outside `<main>` and outside every partial (T-19).
8. The Toast region (`{% block 'toast' %}{% endblock %}`) is the last child of `<body>` ([10-components-interactive.md](10-components-interactive.md), Toast host notes).
9. AnnouncementBar is rendered when the key `ripple.blueprints.layout.announcement` is not empty (English default: empty).
10. The CartDrawer is omitted when `template.name == 'cart'`, and the CartLink then has no `drawer` (D-091 item 5; T-18). The CartDrawer `<dialog>` has the id `cart-drawer` (T-24).
11. Every string comes from a `ripple.blueprints.layout.*` key (T-3).

`layout/password.liquid` MUST contain the same five head lines in the same order, a SkipLink and `<main id="main" tabindex="-1" data-template="{{ request.page_type }}">`, and no Header, Footer or CartDrawer (doc 12, Blueprint `password`).

### 10.3 Facts about the templates that this document relies on

Each is one sentence; the template text is in doc 12.

1. Collection: Filters are rendered inline (a column beside the results from `lg`, stacked above them below `lg`), never in a Drawer, because D-005 requires Filters to be `full` without JavaScript and a `<dialog>` cannot be opened without script on browsers without Invoker Commands (D-107 item 3; doc 12, Blueprint `collection`).
2. Collection: `{% paginate %}` wraps the results region root inside the partial, so that a partial fetch renders the same page of results (doc 12, Blueprint `collection`).
3. Product: the template builds the recommendations URL from `routes.product_recommendations_url` with `?product_id=<id>&limit=4&intent=related` and passes it to the `product-recommendations` block, which prints it as `data-url` (doc 12, Blueprint `product`; [11-components-commerce.md](11-components-commerce.md), ProductRecommendations).
4. Search: the template declares the one partial `rp-search-results` and has no Filters, SortSelect or FilterChips in V1 (doc 12, Blueprint `search`).
5. Cart: CartLines with id `cart` prints the one cart form, id `cart-form`; the checkout button and the note field join it through the param `cart_lines: 'cart'`, which prints `form="cart-form"` (D-092; doc 12, Blueprint `cart`).
6. Cart: the template has no cart drawer and the list region part prints the empty state, so removing the last line with JavaScript shows the empty state through the partial refresh ([11-components-commerce.md](11-components-commerce.md), CartLines).
7. View events (D-089): only the `product`, `collection`, `search` (only when terms exist) and `cart` templates print `rp-view-event`, each exactly once and outside every region. Product, collection and search use the attribute form; cart uses the child form:

   ```liquid
   <rp-view-event view-event-trigger="connect" view-event-payload="{{ product | standard_event_data: 'view', context: 'page' | escape }}"></rp-view-event>
   ```

   ```liquid
   <rp-view-event view-event-trigger="connect"><script type="application/json" data-view-event-payload>{{ cart | standard_event_data: 'view', context: 'page' }}</script></rp-view-event>
   ```

   In the attribute form the object is `product`, `collection` or `search` and the output is escaped; in the child form the output is NOT escaped. The payload is ALWAYS the output of `standard_event_data`; hand-built JSON is prohibited (D-089 item 4). Evidence: F-12. `standard_event_data` on the `search` object is UNVERIFIED (SPIKE-02 question V-20).

---

## 11. Locales

The Ripple theme ships exactly two locale files: `locales/en.default.json` and `locales/en.default.schema.json`.

English only (D-098 item 4, Q16): the locale patch writes the English text under `ripple` into every locale file the theme has, never changes an existing value, and `remove` keeps keys. A project adds a language by adding `locales/<code>.json`; the next `ripple add` or `ripple upgrade` fills the `ripple` key with English text for missing keys (07 section 7.6.4), which the project then translates.

### 11.1 `locales/en.default.json`

The theme-owned part is exactly `{}`. There is no `theme` key and no other hand-written key. Everything else is the key `ripple`, written by the CLI; it MUST NOT be hand-written:

| Keys | Text for | Written by | Listed in |
|---|---|---|---|
| `ripple.<component id>.<key>` | component text | `ripple add <component>` (the component's locale patch) | the component's spec in docs 09 to 12 |
| `ripple.blueprints.<blueprint id>.<key>` | template and layout text | `ripple add --blueprint <id>` (the blueprint's locale patch `registry/liquid/locales/blueprint.<id>.json`, D-107 item 5) | doc 12, the "Locale keys" line of each blueprint |
| The seven keys of section 7.3 rule 4 | announcements printed into the config element | `ripple init` (`registry/liquid/locales/core.json`) | [05-commerce.md](05-commerce.md) section 4.3 |

A project's own strings go under a namespace of its choice that is not `ripple` (T-3).

### 11.2 `locales/en.default.schema.json`

Theme-owned part: `{}` (the theme has no schema strings of its own). The CLI merges the key `ripple`. The `schema` part of `registry/liquid/locales/core.json` MUST contain exactly:

```json
{
  "settings": {
    "name": "Design",
    "font_body": "Body font",
    "font_heading": "Heading font",
    "radius": "Corner radius",
    "density": "Spacing density",
    "text_scale": "Type scale"
  }
}
```

(merged as `ripple.settings.*`; the key names are those of ledger section 4.1). The schema label keys of blocks are fixed by D-038 amendment (a): `ripple.<component id>.name` (block name), `ripple.<component id>.<part>_name` (part block name), and the shared `ripple.props.<prop name>` and `ripple.props.<value>` (setting and option labels). They come from the component locale patches ([06-bindings.md](06-bindings.md) L-17); the English text is humanised from the prop name by the generator.

### 11.3 Money

Every Ripple Liquid file prints money with the `money` filter and nothing else (D-049 amendment (a); [11-components-commerce.md](11-components-commerce.md)). The shop's currency format in the Shopify admin decides whether a currency code is shown. The theme has no money snippet and no "show currency" setting (D-049 amendment (a)).

---

## 12. Replacement of every base theme file

### 12.1 Blocks (22)

Ledger section 8.6, with the call that replaces the most common use. In the calls, `{{ label }}` stands for the block body (a translated string) and "body" for nested blocks.

| Base theme block | Ripple | Replacement call |
|---|---|---|
| `basic-menu` | LinkList | `{% block 'link-list', menu: footer_menu, aria_label: footer_label %}{% endblock %}` |
| `button` | Button (IconButton when the content is only an icon) | `{% block 'button', variant: 'outline', href: routes.cart_url %}{{ label }}{% endblock %}`; the base theme params `commandfor` / `command` become `command_for` / `command`; `url` becomes `href`; an opener with a page equivalent uses `href` plus `dialog` (`href: routes.cart_url, dialog: 'cart-drawer'`); the `inert` and `background_color` params have no equivalent |
| `card` | Card; with a product, collection or article: ProductCard, CollectionCard, ArticleCard | `{% block 'product-card', product: product %}{% endblock %}` |
| `container` | Container | `{% block 'container', as: 'section', py: '12 md:20' %}` body `{% endblock %}`; the background image case is Hero |
| `featured-collection` | FeaturedCollection | one resource block; doc 12 |
| `footer` | Footer | doc 12, Blueprint `layout` |
| `gift-card` | blueprint `gift-card` | `templates/gift_card.liquid`; no block |
| `header` | Header | doc 12, Blueprint `layout` |
| `heading` | Heading | `tag: 'h1', variant: 'lg'` becomes `level: 1` (optional `size`) |
| `image` | Image; Placeholder when there is no image | `{% block 'image', image: product.featured_image, ratio: '4/5' %}{% endblock %}`; `loading` and `fetch_priority` are params, never `attributes` |
| `link` | Link | `{% block 'link', href: url %}{{ label }}{% endblock %}` |
| `logo` | Logo | `{% block 'logo' %}{% endblock %}` |
| `main-menu` | NavigationMenu (desktop) and MobileNav (drawer), two separate blocks | doc 12, Blueprint `layout` |
| `overline` | Text | `{% block 'text', variant: 'overline' %}{{ label }}{% endblock %}` |
| `pagination` | Pagination | `{% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}` |
| `predictive-search` | PredictiveSearch inside a Dialog | doc 12, Blueprint `layout` |
| `price` | Price | `{% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}` |
| `quantity-selector` | QuantityInput | `{% block 'quantity-input', id: 'qty', default_value: 1, min: 1, max: 10 %}{% endblock %}` (the usage example of [10-components-interactive.md](10-components-interactive.md), QuantityInput); add `form_id: '<form id>'` where the input joins a form elsewhere in the document |
| `richtext` | RichText | `{% block 'rich-text', html: product.description %}{% endblock %}` |
| `text` | Text | `{% block 'text', tone: 'muted' %}{{ label }}{% endblock %}` |
| `variant-picker` | VariantPicker (one block for all options; no loop in the template) | `{% block 'variant-picker', id: 'product-options', product: product %}{% endblock %}` |
| `video` | Video | `{% block 'video', ratio: '16/9', aria_label: label %}{% for source in video.sources %}<source src="{{ source.url }}" type="{{ source.mime_type }}">{% endfor %}{% endblock %}` (the usage example of [09-components-foundation.md](09-components-foundation.md), Video) |

### 12.2 Snippets (22)

| Base theme snippet | Fate | Replacement |
|---|---|---|
| `cart-discount-code` | removed | DiscountCode: `{% block 'discount-code', id: 'cart-discount' %}{% endblock %}` |
| `cart-discount-list` | removed | discount rows inside `snippets/rp-cart-summary-totals.liquid` (CartSummary) |
| `cart-drawer` | removed | CartDrawer block (doc 12, Blueprint `layout`) |
| `cart-line-item` | removed | CartLine: `snippets/rp-cart-line.liquid`, rendered by `rp-cart-lines-list`; no captures |
| `command-polyfill` | removed | inline script in `snippets/rp-head.liquid` plus the same polyfill inside `ripple.js`; it is a port, not a copy, of the base theme script (D-008 item 3 as amended, D-078) |
| `drawer` | removed | Drawer blocks: `drawer`, `drawer-header`, `drawer-title`, `drawer-description`, `drawer-body`, `drawer-footer` |
| `filter-group` | removed | FilterGroup: `snippets/rp-filter-group.liquid`; price ranges: `snippets/rp-price-range.liquid` |
| `filter-value` | removed | Checkbox and Swatch markup inside `rp-filter-group` |
| `filters` | removed | Filters, SortSelect, FilterChips blocks (doc 12, Blueprint `collection`); no captured buttons |
| `import-map` | kept, rewritten | `snippets/import-map.liquid` (section 7.1) |
| `lcp-preload` | removed | Image props `loading: 'eager'` and `fetch_priority: 'high'` on the first image; no preload link (dropped feature, Q19) |
| `localization-form` | removed | LocaleSelector: `{% block 'locale-selector', id: 'footer-locale', side: 'top' %}{% endblock %}` |
| `meta-tags` | kept; two locale keys renamed | `snippets/meta-tags.liquid` (section 7.6; theme-owned; D-109) |
| `mobile-nav-drawer` | removed | MobileNav block |
| `notification-host` | removed | Toast: `{% block 'toast' %}{% endblock %}` |
| `placeholder-texture` | removed | Placeholder: `{% block 'placeholder', ratio: '4/5' %}{% endblock %}` |
| `skip-link` | removed | SkipLink: `{% block 'skip-link' %}{{ 'ripple.blueprints.layout.skip' | t }}{% endblock %}` |
| `sr-announcer` | removed | no layout-level Announcer: announcements are made by the commerce elements and dialogs through their status parts and `announce()` (D-079); cart messages come from the `strings` of the `rp-commerce` config element |
| `standard-actions-config` | removed, MUST NOT exist (RP307) | Hydrogen inside `ripple.js` (section 8) |
| `swatch` | removed | Swatch: `snippets/rp-swatch.liquid` and block `swatch` |
| `theme-scripts` | removed | the one module tag in `rp-head` |
| `theme-styles` | removed | `snippets/rp-tokens.liquid` (section 6.3) |

### 12.3 Custom elements and JavaScript assets (22 files)

| Base theme file | Lines | Fate | Replacement |
|---|---|---|---|
| `s-cart.js` (`<s-cart>`) | 517 | removed | `rp-cart` on the Hydrogen cart store; partial refresh in the Liquid adapter |
| `s-live-form.js` (`<s-live-form>`) | 393 | removed | `rp-live` (Filters, SortSelect, FilterChips, LiveForm) |
| `s-variant-picker.js` (`<s-variant-picker>`) | 341 | removed | `rp-live` (VariantPicker): option values are links with `?variant=` |
| `s-product-form.js` (`<s-product-form>`) | 197 | removed | `rp-product-form` |
| `s-dialog.js` (`<s-dialog>`) | 189 | removed | `rp-dialog` |
| `s-notification.js` (`<s-notification>`) | 302 | removed | `ui-toast-region` and `toast()` from `ripple`; feedback inside an open dialog is a FormMessage or the dialog's status part (D-008 item 7, D-079) |
| `s-mobile-nav.js` (`<s-mobile-nav>`) | 263 | removed | no element: MobileNav is `rp-dialog` plus nested `<details>` |
| `s-nav-dropdown.js` (`<s-nav-dropdown>`) | 145 | removed | `rp-navigation-menu` plus native `popover` |
| `s-predictive-search.js` (`<s-predictive-search>`) | 187 | removed | `rp-predictive-search` (search field plus list of links, not a combobox, D-048) |
| `s-quantity-selector.js` (`<s-quantity-selector>`) | 146 | removed | `rp-quantity` |
| `s-localization-dropdown.js` (`<s-localization-dropdown>`) | 144 | removed | no element: native `popover` (LocaleSelector) |
| `s-video.js` (`<s-video>`) | 200 | removed | no element: Video is a native `<video controls>`. Click-to-load YouTube / Vimeo is not in V1 (Q19) |
| `s-product-image-zoom.js` (`<s-product-image-zoom>`) | 72 | removed | lightbox Dialog inside ProductGallery (`rp-dialog`, `rp-carousel`) |
| `s-gift-card.js` (`<s-gift-card>`) | 159 | removed | no element: the gift-card blueprint shows the code as selectable text; the copy button and pointer tilt are not in V1 (Q19) |
| `s-view-event.js` (`<s-view-event>`) | 7 | removed | `rp-view-event`, defined by the Liquid adapter from `@shopify/standard-events` ([05-commerce.md](05-commerce.md) section 12); printed only by the product, collection, search and cart templates (D-089 item 2) |
| `standard-actions-override.js` | - | removed, MUST NOT exist | section 8 |
| `cart-feedback.js` | - | removed | announcements by `rp-cart` and the adapter |
| `live-region.js` | - | removed | Ripple's `announce(text, { from })` wrapper inside `ripple.js` (D-079) |
| `quantity-rules.js` | - | removed | `rp-quantity` (min, max, step from the input's attributes); per-variant quantity rules are not in V1 (Q19) |
| `view-transition.js` | - | removed | none: region refresh does not use View Transitions in V1 (Q19) |
| `page-view-event.js`, `page-view-event-init.js` | - | removed | the Liquid adapter in `ripple.js` dispatches the page view (D-089; section 7.5) |

The platform element `<shopify-account>` used by the base theme header is replaced by AccountLink (a plain link, D-051).

### 12.4 Icons (14 assets)

`assets/icon-*.svg` and the filter `inline_asset_content` are not used. Icons are `{% render 'rp-icon', name: '<name>' %}` (D-068).

| Base theme asset | `rp-icon` name |
|---|---|
| `icon-account.svg` | `account` |
| `icon-arrow-right.svg` | `arrow-right` |
| `icon-cart.svg` | `cart` |
| `icon-check.svg` | `check` |
| `icon-chevron-down.svg` | `chevron-down` |
| `icon-chevron-left.svg` | `chevron-left` |
| `icon-chevron-right.svg` | `chevron-right` |
| `icon-menu.svg` | `menu` |
| `icon-minus.svg` | `minus` |
| `icon-plus.svg` | `plus` |
| `icon-search.svg` | `search` |
| `icon-tag.svg` | `tag` |
| `icon-trash.svg` | `trash` |
| `icon-x.svg` | `close` |

### 12.5 Settings, styles and config

| Base theme | Ripple theme |
|---|---|
| `color_palette` setting `color_palette` | `rp_palette` (same five slot names) |
| `type_primary_font`, `type_heading_font` | `rp_font_body`, `rp_font_heading` |
| `border_radius_buttons`, `border_radius_cards`, `border_radius_forms` (three selects) | one slider `rp_radius`; the per-kind radius selects are a dropped feature (Q19); a project that needs different shapes per kind overrides `--radius-control`, `--radius-field`, `--radius-surface` in the `core/tokens` region |
| none | sliders `rp_density`, `rp_text_scale` |
| `config/styles.css` with `@theme` tokens, 27 component classes, element styles | `config/styles.css` of section 5.2; everything else in `assets/ripple.css` |
| `DESIGN.md` (210 lines) | `DESIGN.md` of section 4.3 |

---

## 13. No-JS gaps of the base theme and how the Ripple theme closes them

Source of the gap list: `ripple/docs/research/base-theme.md` section 3.4. "Without JavaScript" means scripting disabled or `ripple.js` failed to load.

| # | Base theme gap | Ripple theme behaviour without JavaScript | Mechanism | Test (section 14) |
|---|---|---|---|---|
| G-1 | Cart quantity steppers do nothing; no update submit exists | The quantity is a number input `name="updates[]"`; an "Update cart" submit button `name="update"` is visible; submitting posts to `routes.cart_url` | CartLines Liquid dialect (D-043); the button is `data-rp-js="fallback"` (hidden only once `rp-cart` is defined) | A-15 |
| G-2 | Remove line needs `--remove` command | Remove is a link to `item.url_to_remove` | CartLine | A-15 |
| G-3 | Order note is saved only by script | The note `textarea name="note"` belongs to the cart form (`form="cart-form"`; the CartLines id is `cart`, D-092); Update or Checkout saves it | CartNote | A-15 |
| G-4 | Discount code needs script | Still needs script on Liquid: the platform has no no-JS discount form. The discount `<form>` carries `data-rp-js="inflow"` and is therefore not shown without script; the buyer enters the code at checkout | D-043, D-092 item 3, D-005 (DiscountCode has `noJs.level: degraded`) | A-15 |
| G-5 | Variant selection: radios change, the hidden `id` does not; the first available variant is added | Each option value is a link to the variant URL (`?variant=<id>`); the server renders the form with that variant's id | VariantPicker (D-047) | A-16 |
| G-6 | Header cart, search and menu buttons are `commandfor` buttons: dead without script on browsers without Invoker Commands; no link to `/cart` or `/search` | The three openers are links: `routes.cart_url`, `routes.search_url`, `#footer-menu`; they are printed by Header's default body with the `dialog` prop (CartLink: `drawer`) | D-009 as amended; section 10.2 constraint 5 | A-14 |
| G-7 | Mobile navigation below the first level needs push-panel script | The footer LinkList with id `footer-menu` prints every menu level as links; inside the drawer, sublevels are native `<details>` | LinkList, MobileNav (D-017) | A-14 |
| G-8 | Desktop submenus need `s-nav-dropdown` for keyboard users | Submenus are native `popover` panels opened by `popovertarget` buttons, which work without script | NavigationMenu (D-017) | A-14 |
| G-9 | Desktop country / currency panel is a `hidden` div opened only by script | The panel is a native `popover` with a real `{% form 'localization' %}` and a visible submit button | LocaleSelector | A-14 |
| G-10 | Filters live in a `<dialog>` drawer | Filters are inline; the form has a visible "Apply filters" submit button (`data-rp-js="fallback"`) | section 10.3 fact 1; D-005, D-107 item 3 | A-17 |
| G-11 | Sort has a `<noscript>` submit button | Same result with one mechanism: a `data-rp-js="fallback"` submit button; no `<noscript>` | SortSelect | A-17 |
| G-12 | Predictive search dialog is unreachable | The search opener navigates to the search page, which has a plain GET SearchForm | D-009, D-048 | A-14 |
| G-13 | Image zoom dialogs need `commandfor` | The zoom opener is a D-009 link with the full image URL as `href` | ProductGallery (D-093) | A-16 |
| G-14 | External video iframe is inside a `<template>` | Not in V1: external click-to-load video is a dropped feature (Q19; section 12.3) | none | none |
| G-15 | Toasts and gift-card copy need script | Toasts are `none` by design (D-005); every message a toast would show is also in the page after the form post (the cart page shows the cart). Gift-card code is selectable text; the copy button is a dropped feature (Q19) | D-005 | none |

Not a gap but a behaviour change: without JavaScript, add to cart posts to `routes.cart_add_url` and the platform answers with its own redirect (to the cart page by default). With JavaScript the cart drawer opens.

---

## 14. Acceptance criteria

Tests live in `test/liquid/` (ledger section 5.1). "Shim" is the liquidjs renderer of [13-testing.md](13-testing.md). "The theme" is `examples/liquid/`. Every criterion is pass or fail.

Structure:

- **A-1** `ripple check` (layers S, H on shim-rendered pages, P) run in the theme exits 0 with 0 errors and 0 warnings.
- **A-2** Reproducibility: applying section 4.1 steps 2 to 5 to a copy holding only the seven hand-made files of step 1 produces a tree byte-identical to the committed theme, and step 6 exits 0. Running `init --host liquid` once more afterwards prints only `unchanged` and `patch-skipped` lines and changes no file. No file under `layout/`, `templates/`, `blocks/`, `snippets/` lacks a provenance trailer.
- **A-3** `blocks/` holds exactly the number of files derived from the manifest (sum over components of 1 for tier `block` and `resource`, of the number of author-placed parts plus 1 for tier `parts`, of 0 for tier `snippet`), and that number is at most 150. With the tiers of section 4.4 it is 110.
- **A-4** None of the forbidden paths of section 4 exists. `grep -rE "s-(cart|dialog|live-form|variant-picker|product-form|notification|mobile-nav|nav-dropdown|predictive-search|quantity-selector|localization-dropdown|video|product-image-zoom|gift-card|view-event)\b" examples/liquid` finds nothing. `grep -r "inline_asset_content" examples/liquid` finds nothing. `grep -r "updateCart.configure" examples/liquid --exclude="ripple*.js"` finds nothing. `assets/` contains exactly eight files: `ripple.css`, the six `ripple*.js` files of section 4, and `styles.min.css`. `grep -rE "['\"]theme\." examples/liquid/layout examples/liquid/templates examples/liquid/snippets examples/liquid/blocks` finds nothing (no `theme.*` locale key), and `locales/en.default.json` has exactly one top-level key, `ripple`.
- **A-5** Theme Check (`themeCheckRun` from `@shopify/theme-check-node`, config `theme-check:recommended`) on the theme reports 0 offenses of severity error and 0 of severity warning.

Loading:

- **A-6** For every template rendered inside its layout with the shim: the first element child of `<head>` is `<script type="importmap">`; its text parses as JSON; `imports` has exactly the keys `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`, `@shopify/standard-events`; the page has exactly one import map.
- **A-7** In the same output, in document order: the import map, `<meta charset="utf-8">`, `<title>`, the `<link>` for `ripple.css`, one `<style>` containing `--rp-radius`, `script#rp-commerce` whose text parses as JSON, one classic inline `<script>` containing `rpCommandsPolyfill`, `<script type="module">` whose `src` equals the import-map value of `ripple`, the `<link>` for `styles.min.css`. The parsed config object has exactly the keys `host`, `cartUrl`, `cartAddUrl`, `cartDrawer`, `strings`, with `host === "liquid"` and `cartDrawer === "cart-drawer"`; `strings` has exactly the seven keys `added`, `updated`, `removed`, `discountApplied`, `discountRemoved`, `noteSaved`, `error`, each a non-empty string. The document contains exactly one `script#rp-commerce`. No other `<script>` element exists in the document except the JSON payload script that is the child of an `rp-view-event` (cart template). The output of `rp-head` alone contains no `<title>`, no `<meta>` and no `<script type="importmap">`.
- **A-8** Token bridge, three cases.
  1. Default settings: rendering `rp-tokens` prints `--rp-radius: 0.5rem`, `--rp-density: 1.0`, `--rp-text-scale: 1.2`, `--rp-background: #FFFFFF`, `--rp-foreground: #18181B`, `--rp-brand: #18181B`, `--rp-accent: #18181B`, `--color-muted: #F4F4F5`; the output contains no `@font-face` and no `--rp-font-` declaration (the default fonts are system fonts: the shim's font fixture for `system_ui_n4` has `system?` true). With `rp_radius` 0 it prints `--rp-radius: 0.0rem` (or `0rem`); with `rp_radius` 24, `--rp-radius: 1.5rem`. With `rp_palette` absent it prints no colour declaration and no empty declaration.
  2. Non-system fonts: with `rp_font_body` and `rp_font_heading` set to two fonts whose `system?` is false and whose faces differ, the output contains exactly two `@font-face` rules, one `--rp-font-body` and one `--rp-font-heading` declaration. With both settings set to the same non-system face it contains exactly one `@font-face` rule and both declarations.
  3. In every case the output is one `<style>` element with exactly two rules after the `@font-face` rules: selector `:root`, then selector `:root, [data-scheme="light"]`.
- **A-9** `config/settings_schema.json` parses; it has exactly two objects; the second equals `registry/liquid/settings.json`; every `default` of a `range` setting divided as in section 6.2 equals the dial default in `css/tokens.css`; both `font_picker` settings have the default `system_ui_n4`.

Templates:

- **A-10** Static rules on `layout/*.liquid` and `templates/*.liquid`: no `{% capture %}` (T-21); no `class:` argument and no `class="` text (T-20); every `attributes:` argument matches `^'data-rp-region="[a-z0-9-]+"'$` (T-22); the text `data-rp-open` does not occur; no `{% section`, `{% style`, `{% javascript`, `{% stylesheet`; no literal path matching `href="/` or `action="/` (T-4); every `| t` key starts with `ripple.` (T-3); the only raw `<script` text is `<script type="application/json" data-view-event-payload>` (T-23).
- **A-11** (withdrawn: the line limits applied to files that doc 12 now owns, D-099. The id is kept so that later ids do not change.)
- **A-12** No dependence on utilities: every `class` attribute value in the shim-rendered HTML of every template consists only of tokens that start with `rp-` (plus platform classes inside masked opaque markup).
- **A-13** Regions: for every template rendered inside the layout, every partial name appears at most once; every partial's content is exactly one element whose `data-rp-region` equals the partial name; the set of declared partials per template equals section 9.1; no `<dialog>` is inside a `[data-rp-region]` element. Rendering `templates/cart.liquid` inside the layout yields no element with id `cart-drawer`. The set of templates that print `rp-view-event` is exactly `product`, `collection`, `search` (with search terms) and `cart`; each prints exactly one, outside every `[data-rp-region]` element.

No-JS structure (shim-rendered HTML, parsed; no browser needed):

- **A-14** Layout (any template except `cart`, fixture menus non-empty): the header contains `a[href][data-rp-open="mobile-nav"]` with `href="#footer-menu"`, `a[data-rp-open="search-dialog"]` whose `href` is the search route, and `a[data-rp-open="cart-drawer"]` whose `href` is the cart route; `main#main` has the attributes `tabindex="-1"` and `data-template`; the document contains no element with class `rp-announcer` that is outside a `<dialog>` and outside every `rp-*` element; the last element child of `<body>` is `ui-toast-region`; on the cart template the cart link has no `data-rp-open` attribute and no `#cart-drawer` exists; an element with id `footer-menu` exists and contains one `a[href]` for every link of every level of the fixture menu; every NavigationMenu disclosure is `button[popovertarget]` whose target id exists and has the `popover` attribute; the LocaleSelector contains a `form` with `method="post"` and a submit button that has no `data-rp-js` attribute.
- **A-15** Cart template with fixture `cart.two-lines`: exactly one `form[method="post"]` whose `action` is the cart route and whose id is `cart-form`; it contains two `input[name="updates[]"]`; its first submit button has `name="update"` and `data-rp-js="fallback"`; a `button[name="checkout"]` exists and has `form="cart-form"` or is inside that form; each `[data-rp-line]` contains `a[data-rp-part="remove"][href]`; `textarea[name="note"]` has `form="cart-form"`; every discount form has `data-rp-js="inflow"`; the cart view event is the child form: one `rp-view-event[view-event-trigger="connect"]` without a `view-event-payload` attribute, whose only child is `script[type="application/json"][data-view-event-payload]` with text that parses as JSON. With fixture `cart.empty`: the list region contains the empty state and no `[data-rp-line]`.
- **A-16** Product template with fixture `product.options`: `rp-product-form` contains exactly one `form[method="post"]` with `input[type="hidden"][name="id"]` whose value is the selected variant id, and one `button[type="submit"][name="add"]`; the VariantPicker is not a descendant of that form; every existing option value is an `a[href]` whose URL contains `variant=`; the zoom opener is `a[href]`; the product view event is the attribute form: one `rp-view-event[view-event-trigger="connect"][view-event-payload]` with no child element.
- **A-17** Collection template with fixture `filters.basic`: the Filters form is `form[method="get"]` whose `action` is the collection URL, is not inside a `<dialog>`, and contains a submit button with `data-rp-js="fallback"`; the SortSelect form is a separate `form[method="get"]` with a `select[name="sort_by"]` and a `data-rp-js="fallback"` submit button; pagination links are plain `a[href]`.

Behaviour (browser, static server serving shim-rendered pages and the built assets; commerce runtime not usable in this setup, which is the "script failure" case):

- **A-18** Upgrade stability (D-063 tier 3): loading each rendered template with `ripple.js` records zero mutations inside component roots outside the allow-lists. The allow-lists are `GLOBAL_UPGRADE_ALLOW` plus each manifest's `upgradeAllow` (D-071).
- **A-19** With no `window.Shopify.actions` present, `getCommerce().usable` is `false` after `ready`, no form submission is prevented, and clicking the header cart link opens the drawer (the opener listener does not depend on commerce).
- **A-24** Lazy loading: on the home template no request is made for `ripple-toast.js`, `ripple-shared.js` or `ripple-agent.js` until `toast()` or `loadAgent()` is called, although the page contains `ui-toast-region` (D-083); after one `toast("x")` call from `import { toast } from "ripple"`, `ripple-toast.js` and `ripple-shared.js` have each been requested exactly once.
- **A-25** Page view (served by `serveTheme` from `<pkg>/testing`, which emulates Standard Actions and maps a recording stand-in for `@shopify/standard-events`, [13-testing.md](13-testing.md)): loading any template dispatches exactly one `PageViewEvent` whose `page.template` equals the `data-template` value of `<main>`; `assets/` contains no page-view file (A-4).

Live store (D-063 tier 8; blocked until Ben provides a store, ledger section 10 Q5):

- **A-20** The questions of section 15 are answered and recorded in `docs/research/spikes/liquid-preview-store-rendering/`.
- **A-21** With JavaScript disabled: add to cart from the product page ends on a page showing the line; changing a quantity and pressing "Update cart" changes the line; the remove link removes it; the checkout button reaches checkout.
- **A-22** With JavaScript: add to cart opens the drawer showing the new line with no navigation and exactly one `partials.fetch` request; changing a quantity updates the line total and the summary total; choosing a variant changes price, selected state and the hidden `id` with no navigation; changing a filter changes the results and the URL with no navigation.
- **A-23** The same fixture page rendered by Shopify and by the shim is canonical-equal for every component fixture (`templates/page.rp-fixtures.liquid`, one `<section data-rp-fixture="<component>/<fixture>">` per case; this template exists only in the test theme, never in `examples/liquid/`).

---

## 15. SPIKE-02 `liquid-preview-store-rendering` (owned by this document)

Needs: a development store with the feature preview `liquid_july_26_changes`, theme access, a catalogue (ledger section 10 Q5). Procedure: push `examples/liquid/` plus `templates/page.rp-fixtures.liquid`; answer each question below with a recorded HTTP response or browser trace; write the report to `docs/research/spikes/liquid-preview-store-rendering/`.

| # | Question | Default assumed by this document | If the answer differs |
|---|---|---|---|
| V-1 | Does `{% block %}` or `{% partial %}` output have a wrapper element, attribute or comment? | No wrapper | "Fallback (SPIKE-02)" below |
| V-2 | Is a schema setting readable by bare name when the caller passes nothing (a "bare schema setting")? What does a block see for a `select` value outside its options? | Readable; any value reaches the guard | No change needed: every enumeration is guarded ([06-bindings.md](06-bindings.md) L-15). Record the answer |
| V-3 | Is the body rendered before the block, in the caller's scope? | Yes | Report to doc 06; ProductForm's shape is unaffected |
| V-4 | How does `@shopify/partial-rendering` resolve? Does it resolve on a store without the preview? | Supplied by the platform; absent without the preview | If the platform expects a theme import-map entry, add that entry to `snippets/import-map.liquid` after the `@shopify/standard-events` line and record the URL here |
| V-5 | Exact `partials` API: `fetch` options and return type, `apply` return value, emitted events, behaviour for an unknown name and for a duplicate name | As in F-2; unknown name rejects | Report to doc 05 (`refresh-liquid.ts`). If a duplicate name is refreshed correctly in all instances, T-18 MAY be relaxed by a ledger update |
| V-6 | Does `{% partial %}` work inside a block file or a snippet rendered by a block? | Not used | No change: T-17 stays. Record the answer for a later simplification |
| V-7 | Does `{% render %}` inside `<script type="importmap">` output valid JSON? | Yes | "Fallback (SPIKE-02)" item 3 |
| V-8 | What does `{% form 'product' %}` print on the preview (extra hidden inputs), and what does a failed no-JS add show? | As in `ripple/docs/research/liquid-blocks-partials.md` 2.6 | Update the ProductForm masks in doc 11 |
| V-9 | Is `window.Shopify.actions` defined before module scripts run? | Yes | Report to doc 05: the Liquid adapter MUST then wait for `DOMContentLoaded` before the first cart read |
| V-10 | After Hydrogen's handler calls the default `updateCart` handler, does the platform reload the page ("falls back to a full page reload" on a theme it does not recognise)? | No reload when a handler is configured (the base theme relies on this) | This is SPIKE-01 territory: report to doc 05 |
| V-11 | Does the platform publish the page view itself? (Also asked by SPIKE-01.) | No (the base theme dispatches it; the Liquid adapter does, D-089) | If yes: the adapter's page-view dispatch is removed, for page views only; `analytics: false` is NOT printed and cart analytics are unchanged. Report to doc 05. The theme does not change |
| V-12 | Which drop lists applied discount codes, and is `discount_application.type` equal to `discount_code`? | `cart.cart_level_discount_applications`, `type == 'discount_code'` (D-092 item 4) | Correct `snippets/rp-cart-summary-totals.liquid` (doc 11, CartSummary) |
| V-13 | How does a `boolean` filter expose its value; are `filter.min_value.value` and `filter.range_max` in subunits for every currency? | Through `filter.values`; yes | Correct `rp-filter-group` / `rp-price-range` (doc 11) |
| V-14 | Does the theme editor let a merchant select a block rendered with `{% block %}` without `block.shopify_attributes`? | Yes | Report to doc 06; a root attribute would be added to every block by the generator |
| V-15 | Do `font_picker` defaults `system_ui_n4` and the `color_palette` id `rp_palette` validate on upload? | Yes | Correct section 6.1 and report to the ledger (D-098) |
| V-16 | Are `additional_checkout_buttons` and `content_for_additional_checkout_buttons` readable inside a block file? | Yes | Move the accelerated part to the template through a named slot param (D-037 exception) and record it in doc 11 |
| V-17 | Is `as` accepted as a `{% block %}` argument name and readable as a variable inside the block file (D-038 amendment (d), D-108)? | Yes | The Liquid param becomes `tag` through `prop.liquid.name` in every manifest entry that has `as`; every `as:` in blocks, templates and docs becomes `tag:`. Report to docs 06, 09 and 12 |
| V-18 | Which values does `request.page_type` return for the 13 templates (the layout prints it as `data-template`; `meta-tags` tests `product`, `article`, `password`, `search`, `cart`, `404`, `index`)? | The values the base theme tests in `theme/snippets/meta-tags.liquid` | Correct section 7.6; report the list to doc 05 (page-view `template`) |
| V-19 | Does a `font` object returned by a `font_picker` setting have the member `system?`, true for `system_ui_n4`, and does `font_face` print nothing harmful for it? | `system?` exists and is true for system fonts | Replace the four conditions of section 6.3 by a comparison of `font_body.family` and `font_heading.family` with the family name the store returns for `system_ui_n4`, recorded here |
| V-20 | Does `standard_event_data: 'view', context: 'page'` produce a payload that the element defined by `createViewEventElement()` under the tag `rp-view-event` accepts, for `product` and `collection` (attribute form), `search` (attribute form) and `cart` (child form)? | Yes for all four | For an object the filter rejects (`search` is the one not seen in the base theme): doc 12 omits the element on that template. If the tag name matters: report to doc 05 |

### Fallback (SPIKE-02)

Applies only to the findings named.

1. **Wrapper element around block or partial output (V-1).** Record the wrapper's selector in this section. `css/base.css` gains `:where(<selector>) { display: contents; }` ([03-styling-and-tokens.md](03-styling-and-tokens.md) section 4.3). This rule applies to the platform's wrapper element only, never to an `rp-*` tag: every `rp-*` root stays `display: block` (D-080); the canonicaliser unwraps it ([02-html-contract.md](02-html-contract.md) section 15); region lookup in `refresh-liquid.ts` is by partial name, which a wrapper does not affect. Theme files do not change. A-13's "exactly one element" is evaluated after unwrapping.
2. **Comment markers only.** No change (the canonicaliser removes comments).
3. **`{% render %}` not allowed inside the import map (V-7).** `snippets/import-map.liquid` contains the six Ripple lines of section 7.2 literally instead of the render line, and `snippets/rp-import-map-entries.liquid` is not installed ([07-manifest-registry-cli.md](07-manifest-registry-cli.md) "Fallback (SPIKE-02)").
4. **Param `as` rejected (V-17).** The Liquid param name becomes `tag` (D-038 amendment (d)); nothing else in this document changes except call-site rule 6 of section 3 and the `as:` arguments in the replacement calls of section 12.1.

### Fallback (SPIKE-09)

When recommendations cannot be fetched as a partial ([11-components-commerce.md](11-components-commerce.md), ProductRecommendations fallback):

1. The edit is made in doc 12's `product` blueprint file, `blueprints/product/liquid/templates/product.liquid` (target `templates/product.liquid`): delete the line that assigns the recommendations URL and replace the whole `product-recommendations` block call (from `{% block 'product-recommendations'` to its `{% endblock %}`) by:

   ```liquid
   {% if settings.rp_related_collection != blank %}
     {% block 'featured-collection', collection: settings.rp_related_collection, limit: 4 %}{% endblock %}
   {% endif %}
   ```

2. `config/settings_schema.json` gains a third object: `{ "name": "t:ripple.settings.product", "settings": [ { "type": "collection", "id": "rp_related_collection", "label": "t:ripple.settings.related_collection" } ] }`, and the schema locale gains `ripple.settings.product` = `Product page` and `ripple.settings.related_collection` = `Related products collection`.
3. Section 9.1 loses the row `rp-product-recommendations`, section 9.2 loses the row "Scroll near recommendations", and section 10.3 loses fact 3.

---

## 16. Evidence and UNVERIFIED

Evidence read for this document:

- Base theme: `ripple/theme/AGENTS.md`; `ripple/theme/layout/theme.liquid`; `ripple/theme/templates/product.liquid`, `collection.liquid`, `cart.liquid`; `ripple/theme/snippets/import-map.liquid`, `theme-scripts.liquid`, `theme-styles.liquid`, `command-polyfill.liquid`; `ripple/theme/config/settings_schema.json`; `ripple/theme/assets/page-view-event.js`, `page-view-event-init.js`, `s-view-event.js`; the file list of `ripple/theme/` (22 blocks, 22 snippets, 13 templates, 22 JavaScript assets, 14 icon assets, 35 storefront and 22 schema locale files).
- Research: `ripple/docs/research/base-theme.md` (inventory, weaknesses 3.1 to 3.5, section 4); `ripple/docs/research/liquid-blocks-partials.md` (sections 2, 4, 6, 7, 8, 12; spike `ripple/docs/research/spikes/liquid/`).
- Shopify docs, through the docs search tool: `range` and `color_palette` input settings (F-7, F-8); the `font_picker` default handle `system_ui_n4` and the `font` object's `system?` member (F-11; read for D-098).
- Sibling documents: 03 (3.2, 3.8, 5.3), 04 (3.3, 5.4), 05 (4.2 to 4.5, 5.2, 6.2, 8, 10.4, 12), 06 (section 8), 07 (4.4, 4.5, 7.1, 7.4, 7.6, 9.6), 09 and 10 (Liquid host notes), 11 (section 0, Liquid host notes and usage examples), 12 (sections 1.5, 2.1, 2.2, rule LY-1, tests LT-1 and LT-2, the Liquid files of the `layout`, `product`, `collection`, `search`, `cart`, `contact`, `password` and `gift-card` blueprints).

Nothing in this document was rendered by Shopify. Nothing was run for this document: the templates (doc 12) were not rendered through the shim, because the block files they call do not exist yet. They MUST be rendered and checked (A-1, A-5, A-10, A-12 to A-17) as soon as the components exist. `snippets/meta-tags.liquid` (section 7.6) and the reordered `snippets/rp-head.liquid` (section 7.3) were written for this document and have not been rendered.

UNVERIFIED items and their spike:

| Item | Spike |
|---|---|
| Everything in the "Default assumed" column of section 15 | SPIKE-02 |
| Hydrogen's default cart handler on the real Standard Actions runtime | SPIKE-01 |
| The Canvas / Sidekick compiler accepts the `config/styles.css` of section 5.2 | SPIKE-03 |
| `standard_event_data` output is accepted by the element created by `createViewEventElement()` under the tag `rp-view-event`, in both markup forms: the attribute `view-event-payload` (product, collection, search) and the child `<script type="application/json" data-view-event-payload>` (cart). The base theme does exactly this with `s-view-event` for `product`, `collection` and `cart`; the `search` object was not seen there | SPIKE-02, V-20 |
| Whether the platform publishes a page view itself | SPIKE-01; SPIKE-02, V-11 |
| `font.system?`, and the `font_picker` default `system_ui_n4` on upload | SPIKE-02, V-15 and V-19 |
| The Liquid param name `as` | SPIKE-02, V-17 |
| `request.page_type` values | SPIKE-02, V-18 |
| The plan lines of section 4.1 (which patches read `patch-skipped`; `init` on a theme without `layout/theme.liquid`) | none: recorded by the test of A-2 on the first implementation run |
| `linklists['main-menu']` and `linklists['footer']` exist on the test store (they are the default menu handles of a new Shopify store; the base theme reads its menus through schema settings instead) | SPIKE-02 |
| The hex values `#18181B` and `#F4F4F5` are the nearest sRGB hex of the `tokens.css` defaults (computed by hand, not by a tool) | none: A-9 MUST compute them with the token generator and this document MUST be corrected if they differ |
| Recommendations as a partial | SPIKE-09 |

---

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
