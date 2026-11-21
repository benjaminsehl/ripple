# 14 - The Liquid theme

Status: specification. Date: 2026-11-21. Law: [00-decisions.md](00-decisions.md) (D-037 to D-039, D-041, D-046, D-054, D-055, section 8.6). Milestone: M5 (D-067).

## 0. Scope and how to read this document

This document specifies the **Ripple base theme**: the Shopify Liquid theme at `examples/liquid/` in the Ripple repository, built only from Ripple components. It replaces the component layer of the base theme in `ripple/theme/` and keeps that theme's platform rules (D-039). `ripple/theme/` is reference material: it MUST NOT be edited, copied wholesale, or shipped.

Owned here: the theme rules; the theme file tree; `layout/theme.liquid` and the `product`, `collection` and `cart` templates in full; the infrastructure snippets `rp-head`, `rp-tokens`, `rp-import-map-entries` in full; `snippets/import-map.liquid`; `config/settings_schema.json`; `config/styles.css`; the settings group the CLI patches into other themes; which partial is declared where; the replacement of every base theme block, snippet, custom element and asset; the no-JS gaps closed; acceptance criteria; SPIKE-02.

Not owned here (linked, never restated in full):

| Topic | Owner |
|---|---|
| Liquid block file rules L-1 to L-18, tiers, generated block code | [06-bindings.md](06-bindings.md) section 8 |
| Component contracts, params, locale keys, region parts | [09-components-foundation.md](09-components-foundation.md), [10-components-interactive.md](10-components-interactive.md), [11-components-commerce.md](11-components-commerce.md), [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) |
| Tokens, dials, layers, `theme.css`, component CSS | [03-styling-and-tokens.md](03-styling-and-tokens.md) |
| `ripple.js`, lazy chunks, Invoker Commands polyfill, opener listener | [04-elements.md](04-elements.md) |
| Cart store, Liquid adapter, form dialect, refresh algorithm | [05-commerce.md](05-commerce.md) |
| `ripple init` / `add` / `upgrade`, patches, trailers, `assets/ripple.css` format, checker rules | [07-manifest-registry-cli.md](07-manifest-registry-cli.md) |
| `AGENTS.md` generated section, skills, evals | [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) |
| The liquidjs shim, canonicaliser, test tiers | [13-testing.md](13-testing.md) |

Terms: "the base theme" is `ripple/theme/`. "The Ripple theme" is `examples/liquid/`. "Theme-owned file" is a file of the Ripple theme that the Ripple registry does not install (it has no provenance trailer). "Registry file" is a file installed by `ripple init` or `ripple add` (it has a trailer, D-056).

Evidence paths starting with `theme/` mean `ripple/theme/`.

---

## 1. Facts this design rests on

| # | Fact | Status | Evidence |
|---|---|---|---|
| F-1 | `{% block %}` is legal only in `templates/` and `layout/`; a block prints its body with `{{ content }}`; the body is rendered in the caller's scope before the block runs | Verified by Theme Check (`ValidBlockTagPlacement`) and docs; body scope from the base theme only | `ripple/docs/research/liquid-blocks-partials.md` 2.1; `theme/AGENTS.md` |
| F-2 | `{% partial 'name' %}...{% endpartial %}` marks a region in a template or layout; `partials.fetch(...names, { url, signal })` then `partials.apply(html)` REPLACES the region's DOM | Tag documented; JS API read in base theme source only | `ripple/docs/research/liquid-blocks-partials.md` 2.2; `theme/assets/s-cart.js`, `theme/assets/s-live-form.js` |
| F-3 | A `{% partial %}` inside a block file is not seen anywhere | UNVERIFIED (SPIKE-02 question 6); Ripple files MUST NOT contain one | `ripple/docs/research/liquid-blocks-partials.md` 2.2 |
| F-4 | `Shopify.actions.updateCart` accepts Liquid variant ids and line keys; only the first `configure` call wins | Documented; real runtime not executed (SPIKE-01) | `ripple/docs/research/liquid-blocks-partials.md` 2.7 |
| F-5 | The base theme's import map maps `@shopify/standard-events` to `https://cdn.shopify.com/storefront/standard-events.js`; `@shopify/partial-rendering` is not in the map and not on npm | Read | `theme/snippets/import-map.liquid`; `ripple/docs/research/liquid-blocks-partials.md` 2.2 |
| F-6 | "Classic Edit Code alone does not invoke the compiler" of `config/styles.css` | Read | `theme/AGENTS.md` |
| F-7 | A theme may contain ONE `color_palette` setting; its values are hex colours without alpha; it supports no `label` | Read in Shopify docs (`docs/storefronts/themes/architecture/settings/input-settings`) | docs search tool, this session |
| F-8 | A `range` setting requires numeric `min`, `max`, `default`; `step` defaults to 1; the value is returned as a number | Read in Shopify docs (same page) | docs search tool, this session |
| F-9 | A theme has at most 300 block files | Read | `ripple/docs/research/liquid-blocks-partials.md` 2.1 |
| F-10 | No block file of this document has been rendered by Shopify | Open: SPIKE-02 (section 15) | `ripple/docs/research/liquid-blocks-partials.md` section 0 |

---

## 2. Theme rules

Rules are numbered T-n. "Template" below means a file in `templates/` or `layout/`.

### 2.1 Kept from the base theme (D-039)

- **T-1** The theme MUST NOT contain `sections/`, JSON templates, schema `presets`, `{% section %}`, `{% sections %}`, `{% javascript %}`, `{% stylesheet %}` or `{% style %}`.
- **T-2** `{% block %}` appears only in templates. A file under `blocks/` or `snippets/` MUST NOT contain `{% block %}` (RP401) or `{% partial %}` (RP403, F-3).
- **T-3** Every user-visible string is a locale key printed with `| t`. A template MUST NOT contain literal user-visible text.
- **T-4** Every internal URL comes from `routes.*` or from a resource drop (`product.url`, `collection.url`, `item.url_to_remove`). A template MUST NOT contain a hard-coded path. The only fragment link allowed is `#footer-menu` (section 10.2).
- **T-5** `<html>` prints `lang="{{ request.locale.iso_code }}"` and `dir="{{ request.locale.direction | default: 'ltr' }}"`. Text that must keep its direction (vendor names, codes) is wrapped in `<bdi>`.
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
| T-14 | "One custom element per JS file", a module tag at each call site | One bundle `assets/ripple.js` plus lazy chunks, loaded once by `rp-head`; no component prints a `<script>` tag | D-054 |
| T-15 | The theme configures `Shopify.actions.updateCart` | Hydrogen inside `ripple.js` is the only configurer; the two base theme files MUST NOT exist | D-041 |
| T-16 | Schema option values are class names (`py-16`) | Schema option values are prop tokens (`md`) | D-038 |

### 2.3 New rules

- **T-17 Region wiring.** A region is declared by the template that renders it, never by a Ripple file. Two forms exist and no other is allowed:
  1. **Component region** (the region root is a part of a component; [11-components-commerce.md](11-components-commerce.md) rules RS-1 to RS-3). The template passes the component's region-part snippet, wrapped in the partial, as the block body, on ONE line:

     ```liquid
     {% block 'cart-lines', id: 'cart' %}
       {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
     {% endblock %}
     ```

  2. **Template region** (the region wraps whole components). The partial contains exactly one `stack` block whose `attributes` param carries the hook:

     ```liquid
     {% partial 'rp-product-buy' %}
       {% block 'stack', gap: '6', attributes: 'data-rp-region="rp-product-buy"' %}
         ...
       {% endblock %}
     {% endpartial %}
     ```

  In both forms the partial name equals the `data-rp-region` value, and the partial's content is exactly one element.
- **T-18 One declaration per page.** A partial name MUST be declared at most once in the HTML of any page (layout plus one template). Therefore the layout MUST NOT render CartDrawer when `template.name == 'cart'` ([11-components-commerce.md](11-components-commerce.md) RS-4).
- **T-19 Overlays outside partials.** A block whose root contains a `<dialog>` (`dialog`, `drawer`, `cart-drawer`, `mobile-nav`, `product-gallery`) MUST NOT be called between `{% partial %}` and `{% endpartial %}` (RP404). The partial goes inside the overlay's body.
- **T-20 No utilities in shipped templates.** The templates of the Ripple theme MUST NOT pass `class:` to any block and MUST NOT print a `class` attribute. Layout is expressed with `container`, `stack`, `inline`, `grid` and their props. (A project MAY add utilities later; they exist only after the Canvas / Sidekick compile, section 5.3.)
- **T-21 No captures.** The templates of the Ripple theme MUST NOT contain `{% capture %}`.
- **T-22 `attributes` use.** In the templates of the Ripple theme the `attributes` param is used only with these two literal forms: `'data-rp-region="<region name>"'` and `'data-rp-open="<dialog id>"'`.
- **T-23 Raw HTML in templates.** The only HTML tags a template of the Ripple theme may write itself are: the document shell in `layout/*.liquid` (`html`, `head`, `body`, `main`, `script`), `li` (child of a `grid` or `stack` with `as: 'ul'`), `bdi`, and `rp-view-event`. Everything else is a block or a snippet.
- **T-24 Fixed ids.** These ids are fixed in the Ripple theme and are referenced by other files exactly as written:

| Id | Element | Referenced by |
|---|---|---|
| `main` | `<main>` | SkipLink default `href` `#main` |
| `cart-drawer` | CartDrawer `<dialog>` | `cart-link` param `drawer`; `rp-commerce` config key `cartDrawer` |
| `cart-drawer-list` | CartLines inside the drawer (form id `cart-drawer-list-form`) | `cart-summary` param `cart_lines` |
| `cart` | CartLines on the cart template (form id `cart-form`) | `cart-summary`, `cart-note` param `cart_lines` |
| `mobile-nav` | MobileNav `<dialog>` | header opener `data-rp-open` |
| `search-dialog` | search Dialog `<dialog>` | header opener `data-rp-open` |
| `predictive-search` | PredictiveSearch | none |
| `footer-menu` | LinkList in the footer | header opener `href="#footer-menu"` (D-009, D-017) |
| `main-nav` | NavigationMenu | none |
| `product-gallery`, `product-options`, `product-form` | product template | none |
| `collection-filters`, `collection-sort` | collection template | none |
| `cart-discount`, `cart-note` | cart template | none |

- **T-25 Theme JavaScript.** Theme-owned JavaScript is optional. When present it MUST be an ES module in `assets/`, loaded with `<script type="module" src="{{ '<file>' | asset_url }}"></script>`; it MUST import Ripple APIs only from the specifier `ripple` (`import { getCommerce, toast } from "ripple"`); it MUST NOT import `@shopify/hydrogen`, MUST NOT call `Shopify.actions.updateCart.configure` (RP307), MUST NOT define a custom element whose name starts with `rp-` or `ui-`, and MUST NOT select elements by `rp-` class (D-024 item 6: use `data-rp-*` hooks or its own `data-*` attributes).

---

## 3. Conventions every Ripple Liquid file follows

The binding rules are owned by [06-bindings.md](06-bindings.md) section 8. This table is the checklist an implementer applies to every file under `blocks/` and `snippets/`; each row names its rule there.

| Convention | Rule |
|---|---|
| File name: `blocks/<component id>.liquid`, `blocks/<component id>-<part>.liquid` (unprefixed); `snippets/rp-<id>.liquid` (always prefixed) | L-1, L-2, D-038 |
| File order: `{% doc %}`, optional `{%- liquid -%}` guard block, markup or one `{% render %}`, `{% schema %}`, trailer | 8.3 |
| `{% doc %}`: description, one `@param` per code param, then `class`, `attributes`, `content`; at least one valid `@example` | L-17 |
| `{% schema %}`: `"name": "t:ripple.<component id>.name"`, `settings` array with at most three `select` settings; no `presets`, no `tag` | L-17, D-038 item 5 |
| Every block accepts `class` (escaped, appended after the `rp-` class) and `attributes` (raw, printed last in the root start tag) | L-11, L-18 |
| Exactly one `{{ content }}` outlet per block file; inline-level roots print `{{- content -}}` | L-6 |
| No content params: text is the block body. Only `aria_label` and RichText `html` carry text | D-035 item 5 |
| Params are snake_case; reserved names are never params: `true false nil blank empty content block section form settings for` | L-5, D-038 item 3 |
| Booleans tested with `== true`; enumerations guarded against an allow-list with fallback to the default; responsive strings escaped and printed unchanged | L-14, L-15, L-16 |
| Ids are explicit params; `block.id` is never used | L-8, D-020 |
| Strings are `{{ 'ripple.<component id>.<key>' | t }}` | L-10 |
| Only the tags and filters of the Ripple Liquid subset | L-13 |
| No `{% block %}`, no `{% partial %}`, no `{% capture %}` slot | L-12, L-7, T-2 |

Infrastructure snippets (`rp-head`, `rp-tokens`, `rp-import-map-entries`) additionally use these filters, which the shim of [13-testing.md](13-testing.md) MUST implement: `asset_url`, `stylesheet_tag`, `font_face`, `divided_by`, `json`, `t`. They have a `{% doc %}` and no `{% schema %}` (they are snippets).

Call-site rules for templates (every example in section 10 follows them):

1. Scale and responsive values are quoted strings: `gap: '4'`, `columns: '1 md:2'`.
2. Booleans are the literal `true` or a variable holding a boolean; never `'true'`.
3. A translated value used as an argument is assigned first: `assign close_label = 'theme.close' | t`, then `aria_label: close_label`.
4. A component of tier `resource` is called with an empty body, except for region wiring (T-17).

---

## 4. File tree of the Ripple theme

Location in the Ripple repository: `examples/liquid/`. "T" = theme-owned (written by hand from this document or from doc 12). "R" = registry file written by the CLI; MUST NOT be hand-written. The tree is produced by the procedure of section 4.1 and nothing else.

```text
examples/liquid/
  AGENTS.md                               T + generated region (section 4.2)
  DESIGN.md                               T (section 4.3)
  assets/
    ripple.css                            R  composite stylesheet (07 section 4.5)
    ripple.js                             R
    ripple-tabs.js                        R
    ripple-tooltip.js                     R
    ripple-toast.js                       R
    ripple-shared.js                      R
    ripple-agent.js                       R  never loaded unless a project imports "ripple/agent"
    styles.min.css                        T  compiled from config/styles.css (section 5.3), committed
    page-view.js                          T  (section 7.5)
  blocks/
    <110 files>                           R  one per component or part (section 4.4)
  config/
    settings_data.json                    T  exactly {"current": {}}
    settings_schema.json                  T  (section 6.1)
    styles.css                            T + marker region "theme" (section 5.2)
  layout/
    theme.liquid                          T  (section 10.2)
    password.liquid                       T  (section 10.6)
  locales/
    en.default.json                       T + key "ripple" merged by the CLI (section 11)
    en.default.schema.json                T + key "ripple" merged by the CLI (section 11)
  snippets/
    import-map.liquid                     T  (section 7.1)
    meta-tags.liquid                      T  byte copy of theme/snippets/meta-tags.liquid
    rp-head.liquid                        R  (section 7.3)
    rp-tokens.liquid                      R  (section 6.3)
    rp-import-map-entries.liquid          R  (section 7.2)
    rp-icon.liquid                        R
    rp-<id>.liquid                        R  every snippet the installed components declare
  templates/
    index.liquid                          T  blueprint home
    product.liquid                        T  (section 10.3)
    collection.liquid                     T  (section 10.4)
    list-collections.liquid               T  blueprint collections-list
    search.liquid                         T  blueprint search
    cart.liquid                           T  (section 10.5)
    blog.liquid                           T  blueprint blog
    article.liquid                        T  blueprint article
    page.liquid                           T  blueprint page
    page.contact.liquid                   T  blueprint contact
    404.liquid                            T  blueprint not-found
    password.liquid                       T  blueprint password
    gift_card.liquid                      T  blueprint gift-card
```

The theme MUST NOT contain: `sections/`, any `*.json` under `templates/`, `assets/icon-*.svg`, `assets/s-*.js`, `assets/standard-actions-override.js`, `assets/cart-feedback.js`, `assets/live-region.js`, `assets/quantity-rules.js`, `assets/view-transition.js`, `assets/page-view-event.js`, `assets/page-view-event-init.js`, `snippets/standard-actions-config.liquid`, `snippets/command-polyfill.liquid`, `snippets/theme-scripts.liquid`, `snippets/theme-styles.liquid`, `snippets/lcp-preload.liquid`, or any other base theme snippet listed as "removed" in section 12.2.

### 4.1 Build procedure (the only way the tree is produced)

Run from the Ripple repository root, after `pnpm build`:

1. Create `examples/liquid/` with the theme-owned files marked T above: `layout/`, `templates/`, `config/settings_data.json`, `config/settings_schema.json` WITHOUT the Ripple settings group (only the `theme_info` object of section 6.1), `config/styles.css` WITHOUT the marker region, `snippets/import-map.liquid` WITHOUT the render line (the two-entry form shown in section 7.1 step 1), `snippets/meta-tags.liquid`, `locales/en.default.json` and `locales/en.default.schema.json` WITHOUT the `ripple` key, `assets/page-view.js`, `AGENTS.md` and `DESIGN.md` without generated regions.
2. `node bin/ripple.mjs init --host liquid` with `examples/liquid` as working directory. Expected plan: three regions of `assets/ripple.css`, six JavaScript assets, three snippets, patches `core/patch:head` (already present: the layout contains `{% render 'rp-head' %}`, so the plan line is `patch-skipped`), `core/patch:import-map` (inserts the render line), `core/patch:theme-reference`, `core/patch:settings`, `core/patch:locale`, `core/patch:agents`.
3. `node bin/ripple.mjs add --all` in the same directory.
4. `pnpm theme:css` (section 5.3) to write `assets/styles.min.css`.
5. `node bin/ripple.mjs check` in the same directory MUST exit 0.

The result is committed. CI repeats steps 2 to 5 on a clean copy of the theme-owned files and fails when the result differs from the committed tree (acceptance A-2).

### 4.2 `AGENTS.md`

Theme-owned part (complete; the generated Ripple section follows it between the markers, written by `core/patch:agents`):

```markdown
# Ripple base theme

This theme is built only from Ripple components. Read the Ripple section below before changing anything.

## Rules of this theme

1. No sections, no JSON templates, no presets, no `{% javascript %}`, no `{% stylesheet %}`, no `{% style %}`.
2. Compose pages in `templates/*.liquid` and `layout/*.liquid` with `{% block %}`. Never write `{% block %}` or `{% partial %}` in `blocks/` or `snippets/`.
3. Layout comes from the `container`, `stack`, `inline` and `grid` blocks and their props. Do not add `class:` arguments unless the task asks for a one-off style; utility classes work only after the Canvas or Sidekick compile of `config/styles.css`.
4. Text is the body of a block. Every string is a locale key in `locales/en.default.json` under `theme` (this theme's text) or `ripple` (component text).
5. Links use `routes.*` or a resource URL.
6. A region that refreshes in place is a `{% partial 'rp-<name>' %}` declared in the template, at most once per page. Copy the two forms from an existing template.
7. Never render a block that contains a dialog (`dialog`, `drawer`, `cart-drawer`, `mobile-nav`, `product-gallery`) inside a partial.
8. The cart drawer is not rendered on the cart template.
9. Do not add `snippets/standard-actions-config.liquid`, do not call `Shopify.actions.updateCart.configure`, do not load `@shopify/hydrogen`. Import cart access with `import { getCommerce } from "ripple"`.
10. Change the look in Theme settings (palette, fonts, radius, density, type scale) or in the `core/tokens` region of `assets/ripple.css`. Change one component in its region of `assets/ripple.css`.
11. After any change run `npx <pkg> check`. It must exit 0.
```

`<pkg>` is replaced by the package name at build time (D-052).

### 4.3 `DESIGN.md`

Complete content:

```markdown
# Design

The look of this theme is defined by Ripple tokens. There is no other design source.

| What | Where | How |
|---|---|---|
| Colours | Theme settings, palette `rp_palette` | `surface` page background, `on_surface` text, `interactive` primary buttons, `surface_2` muted surfaces, `accent` links |
| Fonts | Theme settings `rp_font_body`, `rp_font_heading` | font pickers |
| Corner radius | Theme setting `rp_radius` | 0 to 24 px |
| Spacing density | Theme setting `rp_density` | 75 to 125 percent |
| Type scale | Theme setting `rp_text_scale` | 113 to 133 (ratio 1.13 to 1.33) |
| Anything else | `assets/ripple.css`, region `core/tokens` | edit the token, then run `npx <pkg> upgrade` to regenerate derived regions |

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

110 is below the Ripple budget of 150 and the platform limit of 300 (D-038 item 7, F-9). If a component spec changes its number of author-placed parts, the number in this table changes with it; the invariant tested (A-3) is "equal to the count derived from the manifest, and at most 150".

---

## 5. CSS

### 5.1 `assets/ripple.css`

1. Ripple's component CSS on Liquid is ONE unminified, editable asset, `assets/ripple.css` (D-055 item 3). Its exact format, marker regions, trailers and merge behaviour are owned by [07-manifest-registry-cli.md](07-manifest-registry-cli.md) section 4.5. It is written only by the CLI.
2. It MUST be the first stylesheet the page loads (it carries the layer statement of D-025). `rp-head` prints its tag (section 7.3) and the layout renders `rp-head` before the tag of `styles.min.css` (section 10.2).
3. It needs no compiler. A theme edited only in "Edit Code", or installed from a zip, renders every Ripple component correctly (F-6).
4. It is NOT written into `config/styles.css`. The base-theme research recommended that; D-055 rejected it because Ripple would then depend on a compiler it does not control.
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
2. In the Ripple repository it is produced by the root `package.json` script `theme:css`, exactly: `tailwindcss -i examples/liquid/config/styles.css -o examples/liquid/assets/styles.min.css --minify` (package `@tailwindcss/cli`, a devDependency of the repository, major version 4). The result is committed.
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
        "default": "inter_n4"
      },
      {
        "type": "font_picker",
        "id": "rp_font_heading",
        "label": "t:ripple.settings.font_heading",
        "default": "inter_n4"
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

The second object, byte for byte, is the content of `src/gen/liquid-core/settings.json` (registry `registry/liquid/settings.json`), which `core/patch:settings` appends to or replaces in any theme ([07-manifest-registry-cli.md](07-manifest-registry-cli.md) section 7.6.3). The Ripple theme has no other settings group (ledger section 11 item 11).

### 6.2 Mapping

| Setting | Type | Editor range | Printed as | Dial range ([03-styling-and-tokens.md](03-styling-and-tokens.md) 3.2) | Default equals `tokens.css` default |
|---|---|---|---|---|---|
| `rp_palette.surface` | palette slot | hex | `--rp-background: <hex>` | any sRGB colour | yes (`#FFFFFF` = `oklch(1 0 0)`) |
| `rp_palette.on_surface` | palette slot | hex | `--rp-foreground: <hex>` | any sRGB colour | nearest hex of `oklch(0.21 0.006 286)` |
| `rp_palette.interactive` | palette slot | hex | `--rp-brand: <hex>` | any sRGB colour | nearest hex of `oklch(0.21 0.006 286)` |
| `rp_palette.surface_2` | palette slot | hex | `--color-muted: <hex>` | derived token, overridden directly | nearest hex of the 5 percent mix |
| `rp_palette.accent` | palette slot | hex | `--rp-accent: <hex>` | any colour | yes: equal to `on_surface`, which is what an unset `--rp-accent` resolves to |
| `rp_font_body` | `font_picker` | font library | `--rp-font-body: <family>, <fallback families>` plus `@font-face` | font-family list | no: Liquid default is Inter, `tokens.css` default is the system stack (Ledger issues, item 4) |
| `rp_font_heading` | `font_picker` | font library | `--rp-font-heading: <family>, <fallback families>` plus `@font-face` | font-family list | same |
| `rp_radius` | `range` | 0 to 24 px, step 2 | `--rp-radius: <value / 16>rem` | 0 to 1.5rem | yes (8 px = 0.5rem) |
| `rp_density` | `range` | 75 to 125 percent, step 5 | `--rp-density: <value / 100>` | 0.75 to 1.25 | yes (100 = 1) |
| `rp_text_scale` | `range` | 113 to 133, step 1 | `--rp-text-scale: <value / 100>` | 1.125 to 1.333 | yes (120 = 1.2) |

Rules:

1. The three `range` settings are the "less / more" sliders of Ben's decision 6. Each writes exactly one dial. Their bounds are inside the dial's allowed range, so no clamping is needed in Liquid.
2. Setting ids, palette slot names and target tokens are fixed by D-026 item 5. No other theme setting may write a Ripple token. `--rp-brand-foreground` is never printed; the computed value applies ([03-styling-and-tokens.md](03-styling-and-tokens.md) 3.5).
3. The palette applies to the `light` scheme only (it is printed on `:root, [data-scheme="light"]`). The `dark` scheme keeps the values of `tokens.css`.
4. `core/patch:settings` on a theme that already has a `color_palette` setting with another id (the base theme has `color_palette`): because a theme may hold only one (F-7), the CLI MUST write the Ripple group WITHOUT the `rp_palette` object and print `note: this theme already has a color_palette setting ("<id>"); rp_palette was not added. Ripple colours stay at their tokens.css values until you map them in snippets/rp-tokens.liquid.` `rp-tokens` then prints no colour dials (every colour line is guarded).

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
  {%- if font_body != blank %}
  {{ font_body | font_face: font_display: 'swap' }}
  {%- endif %}
  {%- if font_heading != blank and face_heading != face_body %}
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
    {%- if font_body != blank %}
    --rp-font-body: {{ font_body.family }}, {{ font_body.fallback_families }};
    {%- endif %}
    {%- if font_heading != blank %}
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

Notes: the numeric settings are tested with `!= nil` because `0` is a valid radius. A declaration whose setting is missing is omitted, never printed empty. The font lines follow `theme/snippets/theme-styles.liquid` (`family`, `fallback_families`, `font_face: font_display: 'swap'`). Expected output for the defaults contains `--rp-radius: 0.5rem;`, `--rp-density: 1.0;`, `--rp-text-scale: 1.2;`, `--rp-background: #FFFFFF;`.

---

## 7. JavaScript loading

### 7.1 `snippets/import-map.liquid` (complete, theme-owned)

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

1. Before `ripple init` runs (section 4.1 step 1) the file is the same without the `{% render 'rp-import-map-entries' %}` line; `core/patch:import-map` inserts that line directly after the `"imports": {` line.
2. The `@shopify/standard-events` entry and its URL are those of `theme/snippets/import-map.liquid`. `ripple.js` and `assets/page-view.js` import that specifier.
3. `@shopify/partial-rendering` MUST NOT be added to the map: the platform supplies it (F-5; how is UNVERIFIED, section 15 question V-4). `ripple.js` loads it with a guarded dynamic import and falls back to navigation when it is missing (D-046).
4. The import map MUST contain at least one entry after the render line. `ripple check` layer H reports invalid JSON in the rendered map through RP510 (patch state); acceptance A-6 parses it.

### 7.2 `snippets/rp-import-map-entries.liquid` (complete)

Source: `src/gen/liquid-core/rp-import-map-entries.liquid`. The six entries are fixed by [04-elements.md](04-elements.md) section 5.4. Every line ends with a comma (the joining comma that doc 04 assigns to this document).

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

Source: `src/gen/liquid-core/rp-head.liquid`. Order is fixed by D-054 item 7: stylesheet, tokens, inline polyfill, then the module script. The commerce config element of [05-commerce.md](05-commerce.md) section 10.4 is printed between the polyfill and the module script. The inline script is the one [04-elements.md](04-elements.md) section 3.3 requires byte for byte.

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
<script type="module" src="{{ 'ripple.js' | asset_url }}"></script>
```

Rules:

1. `rp-head` is rendered by BOTH layouts (`theme.liquid`, `password.liquid`).
2. The `src` of the module script and the import-map value of `ripple` are the same filter on the same file name, so the browser creates one module instance ([04-elements.md](04-elements.md) section 5.4 rule 1).
3. Because `rp-head` is installed by `ripple init` before any component, `registry/liquid/locales/core.json` MUST contain the seven locale keys the config element reads (`ripple.product-form.added`, `ripple.cart-lines.updated`, `ripple.cart-lines.removed`, `ripple.discount-code.applied`, `ripple.discount-code.removed`, `ripple.cart-note.saved`, `ripple.cart-lines.error`) with the English texts of [05-commerce.md](05-commerce.md) section 4.3, in addition to the settings labels of section 11.2. The component locale files carry the same keys with the same values; the merge never overwrites (07 section 7.6.4).
4. The lazy chunks (`ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`) are never referenced by a `<script>` tag. `ripple.js` imports them by specifier when a matching `ui-*` tag is present (D-054 item 2).
5. No block, snippet or template prints a `<script>` tag for Ripple code. The base theme's call-site module tags have no equivalent.

### 7.4 What replaces "one custom element per file"

The base theme ships 15 element files and 7 helper modules and prints a module tag per call site. The Ripple theme ships one bundle and four lazy chunks, all library code (D-053): they MUST NOT be edited in the theme, and `ripple upgrade` replaces them whole. In the Ripple source repository the rule "one element per source file" still holds (`src/elements/<tag>.ts`, `src/commerce/<tag>.ts`, D-019 item 7).

### 7.5 `assets/page-view.js` (complete, theme-owned)

The base theme dispatches the Standard Events page view itself (`theme/assets/page-view-event.js`, `theme/assets/page-view-event-init.js`). The Ripple theme keeps that behaviour in one theme-owned module (Ledger issues, item 6).

```js
// Theme-owned. Dispatches the Standard Events page view once per document load.
import { PageViewEvent } from "@shopify/standard-events";

function dispatchPageView() {
  const main = document.querySelector("main[data-template]");
  document.dispatchEvent(
    new PageViewEvent({
      page: {
        template: main ? main.dataset.template : "",
        title: document.title,
        url: window.location.href,
      },
    }),
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", dispatchPageView, { once: true });
} else {
  dispatchPageView();
}
```

It is loaded by the layout with `<script type="module" src="{{ 'page-view.js' | asset_url }}"></script>` after `{{ content_for_header }}`.

---

## 8. Standard Actions and Hydrogen on a theme

The JavaScript is owned by [05-commerce.md](05-commerce.md) (sections 4.5, 5.2, 10.4). What the THEME must do, and nothing more:

1. Render `rp-head` (section 7.3). It prints the config element with `"host": "liquid"`; the adapter derives `backend: "liquid"` from it.
2. NOT contain `snippets/standard-actions-config.liquid`, `assets/standard-actions-override.js`, or the text `updateCart.configure` in any file outside `assets/ripple*.js` (RP307, D-041 item 5). Hydrogen's `createCartStore()` inside `ripple.js` makes the one `Shopify.actions.updateCart.configure` call and, with no cart endpoint configured, its handler calls the platform's default handler.
3. NOT load `@shopify/hydrogen` or any second copy of Ripple (D-041 item 4).
4. Print cart forms in the liquid dialect (D-043). The Ripple blocks do this; a template never writes a cart `<form>`, `<input>` or submit button by hand.
5. Give the CartDrawer `<dialog>` the id `cart-drawer` (T-24). The adapter configures `Shopify.actions.openCart` to open it; on a page without it (the cart template, T-18) `openCart()` navigates to `routes.cart_url` ([05-commerce.md](05-commerce.md) Ledger issues item 12).
6. Declare the cart partials of section 9.

What the platform must provide, all UNVERIFIED on a store (SPIKE-01, SPIKE-02): `window.Shopify.actions` present before the first cart read; `@shopify/partial-rendering` resolvable; `@shopify/standard-events` at the mapped URL.

Failure behaviour the theme relies on (D-041 item 7): when the commerce runtime cannot start, every form posts natively. The markup that makes that work is in section 13.

### Fallback (SPIKE-01)

The theme does not change. The fallback replaces the store implementation inside `adapter-liquid.ts` ([05-commerce.md](05-commerce.md) "Fallback (SPIKE-01)").

---

## 9. Regions and partials

### 9.1 Where each partial is declared

| Region / partial name | Form (T-17) | Region root printed by | Declared in | Refreshed by |
|---|---|---|---|---|
| `rp-cart-lines` | component | `snippets/rp-cart-lines-list.liquid` | `layout/theme.liquid` (inside CartDrawer, all templates except `cart`); `templates/cart.liquid` | cart adapter after any cart mutation settles |
| `rp-cart-summary` | component | `snippets/rp-cart-summary-totals.liquid` | same two files | same |
| `rp-predictive-results` | component | `snippets/rp-predictive-search-results.liquid` | `layout/theme.liquid` (inside the search Dialog) | `rp-predictive-search` on input |
| `rp-product-media` | component | `snippets/rp-product-gallery-media.liquid` | `templates/product.liquid` | VariantPicker (`rp-live`) on variant change |
| `rp-product-buy` | template | `stack` block | `templates/product.liquid` | VariantPicker on variant change |
| `rp-product-recommendations` | component | `snippets/rp-product-recommendations-list.liquid` | `templates/product.liquid` | `rp-recommendations` once, near the viewport (SPIKE-09) |
| `rp-collection-filters` | component | `snippets/rp-filters-groups.liquid` | `templates/collection.liquid`; `templates/search.liquid` | Filters, SortSelect, FilterChips (`rp-live`) |
| `rp-collection-toolbar` | template | `stack` block | `templates/collection.liquid`; `templates/search.liquid` | same three |
| `rp-collection-results` | template | `stack` block | `templates/collection.liquid` | same three |
| `rp-search-results` | template | `stack` block | `templates/search.liquid` | same three, with `refresh: 'rp-search-results rp-collection-filters rp-collection-toolbar'` passed to each |

No template declares any other partial. A project that adds a region uses a name that does not start with `rp-` (D-046 item 1).

### 9.2 Which mutation refreshes which partial

| User action | Element | Request | Partials fetched | URL passed to `partials.fetch` |
|---|---|---|---|---|
| Add to cart | `rp-product-form` | store mutation through Standard Actions | `rp-cart-lines`, `rp-cart-summary` (the drawer's) | none (current page) |
| Change a line quantity, remove a line | `rp-cart` (CartLines) | store mutation, intent `set` with the absolute quantity (D-044) | `rp-cart-lines`, `rp-cart-summary` | none |
| Apply or remove a discount code | `rp-cart` (DiscountCode, CartSummary) | store mutation | `rp-cart-lines`, `rp-cart-summary` | none |
| Save the order note | `rp-cart` (CartNote) | store mutation | `rp-cart-lines`, `rp-cart-summary` | none |
| Choose a variant | `rp-live` (VariantPicker) | none | `rp-product-buy`, `rp-product-media` | the option link's URL (`?variant=<id>`); `history.replaceState` |
| Change a filter, the sort order, remove a chip | `rp-live` | none | `rp-collection-results`, `rp-collection-filters`, `rp-collection-toolbar` | the form URL; `history.pushState` |
| Type in the search dialog | `rp-predictive-search` | none | `rp-predictive-results` | `routes.search_url` + `?q=<terms>` |
| Scroll near recommendations | `rp-recommendations` | none | `rp-product-recommendations` | `routes.product_recommendations_url` + `?product_id=<id>&limit=4&intent=related` |
| Go to another results page | none (Pagination links) | full navigation | none | none |

The cart partial list is not written in the theme: the adapter computes it as the union of the `data-rp-refresh` values of every `rp-cart` root on the page, limited to regions present ([05-commerce.md](05-commerce.md) section 8.4). CartLink (header) carries no `data-rp-refresh`; its count is updated from the store, not from a partial. There is no `rp-cart-count` partial.

### 9.3 Rules

1. T-17, T-18, T-19 apply.
2. When `partials.fetch` or `partials.apply` fails or `@shopify/partial-rendering` cannot be imported, the adapter navigates (`location.assign(url)` or `location.reload()`); the page is then correct ([05-commerce.md](05-commerce.md) section 8.2 step 11). The theme adds no fallback code.
3. `partials.apply` replaces DOM (F-2). Nothing in a template may depend on an element inside a region keeping its identity.
4. The checker enforces this section: RP403 (a `data-rp-refresh` name without a partial; a partial declared twice in one file), RP404 (overlay block inside a partial), RP308 (an `rp-cart` root inside the region it refreshes).

---

## 10. Layout and templates

### 10.1 Chrome components: the interface this theme relies on

[12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) owns the full specification of these components. The layout below uses ONLY the params listed here; doc 12 MUST provide at least these (Ledger issues, item 1).

| Block | Call in the layout | Required behaviour |
|---|---|---|
| `header` | `{% block 'header' %}...{% endblock %}` | Tier `resource`; prints `<header class="rp-header">`; `{{ content }}` replaces its default body |
| `logo` | `{% block 'logo' %}{% endblock %}` | A link to `routes.root_url` showing `shop.name` |
| `navigation-menu` | `{% block 'navigation-menu', id: 'main-nav', menu: main_menu %}{% endblock %}` | `menu` is a `linklist` drop; every item with a URL is a link; children are in `popover` panels opened by `popovertarget` buttons (D-017) |
| `mobile-nav` | `{% block 'mobile-nav', id: 'mobile-nav', menu: main_menu %}{% endblock %}` | A Drawer whose `<dialog>` has the given id; sublevels are nested `<details>` (D-017); it prints its own title and close button |
| `locale-selector` | `{% block 'locale-selector', id: 'header-locale' %}{% endblock %}` | A Popover with `{% form 'localization' %}`; country and language controls; a visible submit button; prints nothing when the shop has one country and one language |
| `account-link` | `{% block 'account-link' %}{% endblock %}` | A link to `routes.account_url` (D-051) |
| `footer` | `{% block 'footer' %}...{% endblock %}` | Tier `resource`; prints `<footer class="rp-footer">`; `{{ content }}` replaces its default body |
| `link-list` | `{% block 'link-list', id: 'footer-menu', menu: main_menu, aria_label: menu_label %}{% endblock %}` | A `<nav>` with the given `id` and accessible name; prints EVERY level of the menu as nested lists of links |

All accept the universal props `hidden` and `span` (ledger section 6.1).

### 10.2 `layout/theme.liquid` (complete)

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}" dir="{{ request.locale.direction | default: 'ltr' }}">
  <head>
    {% render 'import-map' %}
    {% render 'meta-tags' %}
    {% render 'rp-head' %}
    {{ 'styles.min.css' | asset_url | stylesheet_tag }}
    {{ content_for_header }}
    <script type="module" src="{{ 'page-view.js' | asset_url }}"></script>
  </head>

  <body>
    {%- liquid
      assign main_menu = linklists['main-menu']
      assign footer_menu = linklists['footer']
      assign menu_label = 'theme.menu' | t
      assign footer_label = 'theme.footer_menu' | t
      assign search_label = 'theme.search' | t
      assign close_label = 'theme.close' | t
    -%}
    {% block 'skip-link' %}{{ 'theme.skip_to_content' | t }}{% endblock %}

    {% block 'header' %}
      {% block 'icon-button', icon: 'menu', href: '#footer-menu', aria_label: menu_label, attributes: 'data-rp-open="mobile-nav"', hidden: 'false md:true' %}{% endblock %}
      {% block 'logo' %}{% endblock %}
      {% block 'navigation-menu', id: 'main-nav', menu: main_menu, hidden: 'true md:false' %}{% endblock %}
      {% block 'inline', gap: '1', align: 'center', wrap: 'nowrap' %}
        {% block 'locale-selector', id: 'header-locale', hidden: 'true md:false' %}{% endblock %}
        {% block 'icon-button', icon: 'search', href: routes.search_url, aria_label: search_label, attributes: 'data-rp-open="search-dialog"' %}{% endblock %}
        {% block 'account-link' %}{% endblock %}
        {% block 'cart-link', drawer: 'cart-drawer' %}{% endblock %}
      {% endblock %}
    {% endblock %}

    <main id="main" tabindex="-1" data-template="{{ request.page_type }}">
      {{ content_for_layout }}
    </main>

    {% block 'footer' %}
      {% block 'link-list', id: 'footer-menu', menu: main_menu, aria_label: menu_label %}{% endblock %}
      {% block 'link-list', menu: footer_menu, aria_label: footer_label %}{% endblock %}
      {% block 'locale-selector', id: 'footer-locale', hidden: 'false md:true' %}{% endblock %}
      {% block 'text', variant: 'caption', tone: 'muted' %}&copy; {{ 'now' | date: '%Y' }} <bdi>{{ shop.name | escape }}</bdi>{% endblock %}
    {% endblock %}

    {% block 'mobile-nav', id: 'mobile-nav', menu: main_menu %}{% endblock %}

    {% block 'dialog', id: 'search-dialog', size: 'lg' %}
      {% block 'dialog-header' %}
        {% block 'dialog-title', dialog: 'search-dialog' %}{{ 'theme.search' | t }}{% endblock %}
        {% block 'icon-button', icon: 'close', aria_label: close_label, command_for: 'search-dialog', command: 'close' %}{% endblock %}
      {% endblock %}
      {% block 'dialog-body' %}
        {% block 'predictive-search', id: 'predictive-search' %}
          {% partial 'rp-predictive-results' %}{% render 'rp-predictive-search-results', search: search %}{% endpartial %}
        {% endblock %}
      {% endblock %}
    {% endblock %}

    {% unless template.name == 'cart' %}
      {% block 'cart-drawer', id: 'cart-drawer' %}
        {% block 'cart-lines', id: 'cart-drawer-list' %}
          {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
        {% endblock %}
        {% block 'cart-summary', cart_lines: 'cart-drawer-list' %}
          {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart-drawer-list' %}{% endpartial %}
        {% endblock %}
      {% endblock %}
    {% endunless %}

    {% block 'announcer' %}{% endblock %}
    {% block 'toast' %}{% endblock %}
  </body>
</html>
```

Normative points:

1. Head order is exactly: `import-map`, `meta-tags`, `rp-head`, the `styles.min.css` tag, `{{ content_for_header }}`, the `page-view.js` module tag. This satisfies T-6, D-054 item 7 (`rp-head` after the import map, before `content_for_header`) and D-055 (`ripple.css` before `styles.min.css`).
2. `<body>` carries no class. Page background, text colour and font come from `base.css` inside `ripple.css`.
3. The three header openers are links (D-009): menu to `#footer-menu`, search to `routes.search_url`, cart to `routes.cart_url` (printed by `cart-link`). Each carries `data-rp-open` naming a dialog of T-24.
4. The footer's first LinkList renders the MAIN menu under the id `footer-menu`: it is the page equivalent of MobileNav. The second renders the footer menu.
5. Every `<dialog>` is rendered after `</footer>`, outside `<main>` and outside every partial (T-19).
6. `{% block 'toast' %}` is the last statement before `</body>` ([10-components-interactive.md](10-components-interactive.md), Toast host notes).
7. AnnouncementBar is not rendered: the base theme has none. A project adds `{% block 'announcement-bar' %}...{% endblock %}` directly before the `header` block.
8. The file has 64 lines. The base theme layout has 393 (`theme/layout/theme.liquid`).

### 10.3 `templates/product.liquid` (complete)

```liquid
{%- liquid
  assign current_variant = product.selected_or_first_available_variant
  assign rec_url = routes.product_recommendations_url | append: '?product_id=' | append: product.id | append: '&limit=4&intent=related'
-%}
<rp-view-event view-event-trigger="connect" view-event-payload="{{ product | standard_event_data: 'view', context: 'page' | escape }}"></rp-view-event>

{% block 'container', as: 'section', py: '6 md:12' %}
  {% block 'stack', gap: '12' %}
    {% block 'grid', columns: '1 md:2', gap: '6 md:12', align: 'start' %}
      {% block 'product-gallery', id: 'product-gallery', media: product.media, variant: current_variant %}
        {% partial 'rp-product-media' %}{% render 'rp-product-gallery-media', id: 'product-gallery', media: product.media, variant: current_variant %}{% endpartial %}
      {% endblock %}

      {% partial 'rp-product-buy' %}
        {% block 'stack', gap: '6', attributes: 'data-rp-region="rp-product-buy"' %}
          {% block 'stack', gap: '2' %}
            {% if product.vendor != blank %}
              {% block 'text', variant: 'overline', tone: 'muted' %}<bdi>{{ product.vendor | escape }}</bdi>{% endblock %}
            {% endif %}
            {% block 'heading', level: 1 %}{{ product.title | escape }}{% endblock %}
            {% block 'price', price: current_variant.price, compare_at_price: current_variant.compare_at_price, size: 'lg' %}{% endblock %}
          {% endblock %}
          {% block 'variant-picker', id: 'product-options', product: product %}{% endblock %}
          {% block 'product-form', id: 'product-form', product: product, variant: current_variant, accelerated_checkout: true %}{% endblock %}
        {% endblock %}
      {% endpartial %}
    {% endblock %}

    {% if product.description != blank %}
      {% block 'stack', gap: '4' %}
        {% block 'heading', level: 2, size: 'lg' %}{{ 'theme.product.description' | t }}{% endblock %}
        {% block 'rich-text', html: product.description %}{% endblock %}
      {% endblock %}
    {% endif %}

    {% block 'product-recommendations', url: rec_url %}
      {% partial 'rp-product-recommendations' %}{% render 'rp-product-recommendations-list', products: recommendations.products %}{% endpartial %}
    {% endblock %}
  {% endblock %}
{% endblock %}
```

Normative points:

1. VariantPicker is a sibling of ProductForm, both inside region `rp-product-buy` ([11-components-commerce.md](11-components-commerce.md), VariantPicker nesting rules). VariantPicker keeps its default `refresh` (`rp-product-buy rp-product-media`); both partials are declared here.
2. ProductForm is called with an empty body: its default body is QuantityInput plus AddToCartButton, which prints the "Sold out" label and `disabled` when the variant is unavailable.
3. `rp-view-event` is outside both regions, so the product view is reported once per page load and not again after a variant change. `standard_event_data` is the filter the base theme uses (`theme/templates/product.liquid`).
4. The product title and price are inside `rp-product-buy`, so they follow the selected variant (the base theme used a second partial, `product-title`, for this).
5. The file has 39 lines. The base theme template has 225 and two module tags.
6. Not carried over from the base theme: per-variant quantity rules on the quantity input (B2B, ledger section 10 Q12), click-to-load external video (section 12.3), the sticky information column.

### 10.4 `templates/collection.liquid` (complete)

```liquid
{% paginate collection.products by 24 %}
<rp-view-event view-event-trigger="connect" view-event-payload="{{ collection | standard_event_data: 'view' | escape }}"></rp-view-event>

{% block 'container', as: 'section', py: '8 md:12' %}
  {% block 'stack', gap: '8' %}
    {% block 'stack', gap: '2' %}
      {% block 'heading', level: 1 %}{{ collection.title | escape }}{% endblock %}
      {% if collection.description != blank %}
        {% block 'rich-text', html: collection.description %}{% endblock %}
      {% endif %}
    {% endblock %}

    {% block 'grid', columns: '1 lg:4', gap: '8', align: 'start' %}
      {% block 'filters', id: 'collection-filters', span: 'full lg:1' %}
        {% partial 'rp-collection-filters' %}{% render 'rp-filters-groups', collection: collection %}{% endpartial %}
      {% endblock %}

      {% block 'stack', gap: '6', span: 'full lg:3' %}
        {% partial 'rp-collection-toolbar' %}
          {% block 'stack', gap: '3', attributes: 'data-rp-region="rp-collection-toolbar"' %}
            {% block 'inline', gap: '4', justify: 'between', align: 'center' %}
              {% block 'text', tone: 'muted' %}{{ 'theme.collection.count' | t: count: collection.products_count }}{% endblock %}
              {% block 'sort-select', id: 'collection-sort' %}{% endblock %}
            {% endblock %}
            {% block 'filter-chips' %}{% endblock %}
          {% endblock %}
        {% endpartial %}

        {% partial 'rp-collection-results' %}
          {% block 'stack', gap: '8', attributes: 'data-rp-region="rp-collection-results"' %}
            {% if collection.products.size == 0 %}
              {% block 'empty-state', icon: 'search' %}
                {% block 'text' %}{{ 'theme.collection.empty' | t }}{% endblock %}
              {% endblock %}
            {% else %}
              {% block 'grid', as: 'ul', columns: '2 md:3', gap: '4 md:6' %}
                {% for product in collection.products %}
                  {%- liquid
                    assign card_loading = 'lazy'
                    if forloop.index <= 3
                      assign card_loading = 'eager'
                    endif
                  -%}
                  <li>{% block 'product-card', product: product, loading: card_loading %}{% endblock %}</li>
                {% endfor %}
              {% endblock %}
              {% if paginate.pages > 1 %}
                {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
              {% endif %}
            {% endif %}
          {% endblock %}
        {% endpartial %}
      {% endblock %}
    {% endblock %}
  {% endblock %}
{% endblock %}
{% endpaginate %}
```

Normative points:

1. Filters is rendered INLINE (a side column from `lg`, stacked above the results below `lg`), not in a drawer. Reason: D-005 requires Filters to be `full` without JavaScript, and a `<dialog>` cannot be opened without script on browsers without Invoker Commands (RP304). Filter groups are native `<details>`, so the stacked form stays compact.
2. Filters, SortSelect and FilterChips keep their default `refresh` (`rp-collection-results rp-collection-filters rp-collection-toolbar`); the three partials are declared here. SortSelect and FilterChips are INSIDE `rp-collection-toolbar` so their hidden inputs and chips are re-rendered after each change ([11-components-commerce.md](11-components-commerce.md), nesting rules).
3. Pagination is plain links: a page change is a full navigation, which also returns the scroll position to the top.
4. The first three cards load eagerly; this is the only image-loading logic in the template (the base theme needed six to ten lines and a hand-computed `sizes` string per grid; `sizes` now defaults inside ProductCard).
5. The whole template is inside `{% paginate %}`; `paginate collection.products by 24` MUST wrap the region so a partial fetch renders the same page of results.
6. The file has 50 lines and no `{% capture %}`. The base theme template has 86 lines, five captured buttons and a 9-argument snippet call.

### 10.5 `templates/cart.liquid` (complete)

```liquid
<rp-view-event view-event-trigger="connect" view-event-payload="{{ cart | standard_event_data: 'view', context: 'page' | escape }}"></rp-view-event>

{% block 'container', as: 'section', py: '8 md:12' %}
  {% block 'stack', gap: '8' %}
    {% block 'heading', level: 1 %}{{ 'theme.cart.title' | t }}{% endblock %}
    {% block 'grid', columns: '1 lg:3', gap: '8 lg:12', align: 'start' %}
      {% block 'cart-lines', id: 'cart', span: 'full lg:2' %}
        {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
      {% endblock %}
      {% block 'stack', gap: '6', span: 'full lg:1' %}
        {% block 'cart-summary', cart_lines: 'cart', accelerated_checkout: true %}
          {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart' %}{% endpartial %}
        {% endblock %}
        {% if cart.item_count > 0 %}
          {% block 'discount-code', id: 'cart-discount' %}{% endblock %}
          {% block 'cart-note', id: 'cart-note', cart_lines: 'cart' %}{% endblock %}
        {% endif %}
      {% endblock %}
    {% endblock %}
  {% endblock %}
{% endblock %}
```

Normative points:

1. The template has no `{% if cart.item_count > 0 %}` around the lines or the summary. The empty state is printed INSIDE the list region part and the summary's totals part is printed empty for an empty cart ([11-components-commerce.md](11-components-commerce.md), CartLines and CartSummary nesting rules), so removing the last line with JavaScript shows the empty state through the partial refresh.
2. CartLines prints the one cart form, id `cart-form`. The checkout button (inside the summary region part) and the note field join it through `cart_lines: 'cart'`, which prints `form="cart-form"`.
3. DiscountCode and CartNote are rendered only for a non-empty cart at page load. Known limitation: after the last line is removed with JavaScript they stay visible until the next page load. This is accepted in V1.
4. The file has 20 lines. The base theme template has 94 lines, four captures per cart line, and no working quantity change without JavaScript.

### 10.6 `layout/password.liquid` (complete)

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
    {% block 'skip-link' %}{{ 'theme.skip_to_content' | t }}{% endblock %}
    <main id="main" tabindex="-1" data-template="{{ request.page_type }}">
      {{ content_for_layout }}
    </main>
  </body>
</html>
```

`templates/password.liquid` starts with `{% layout 'password' %}`; `templates/gift_card.liquid` starts with `{% layout none %}` and prints its own document shell with the same four head lines (`import-map`, `meta-tags`, `rp-head`, the `styles.min.css` tag), as in the base theme.

### 10.7 The other templates

Their source is the Liquid form of the blueprint named in the file tree, specified in [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md). Every one of them MUST obey T-1 to T-25 and the call-site rules of section 3, and MUST use the region table of section 9.1. `templates/search.liquid` MUST pass `search: search` to `filters`, `sort-select`, `filter-chips` and to `rp-filters-groups`, and `refresh: 'rp-search-results rp-collection-filters rp-collection-toolbar'` to the three blocks.

---

## 11. Locales

The Ripple theme ships exactly two locale files: `locales/en.default.json` and `locales/en.default.schema.json` (Ledger issues, item 5). A project adds a language by adding `locales/<code>.json`; the next `ripple add` or `ripple upgrade` fills the `ripple` key with English text for missing keys (07 section 7.6.4).

### 11.1 `locales/en.default.json`, theme-owned part

The key `theme` holds every string the templates of this document print. Doc 12's templates add their keys under the same namespace. The key `ripple` is written by the CLI and MUST NOT be hand-written.

```json
{
  "theme": {
    "skip_to_content": "Skip to content",
    "menu": "Menu",
    "footer_menu": "Footer",
    "search": "Search",
    "close": "Close",
    "product": {
      "description": "Description"
    },
    "collection": {
      "count": {
        "one": "{{ count }} product",
        "other": "{{ count }} products"
      },
      "empty": "No products found."
    },
    "cart": {
      "title": "Cart"
    }
  }
}
```

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

(merged as `ripple.settings.*`). Block names and prop labels (`ripple.<component id>.name`, `ripple.props.*`) come from the component locale files ([06-bindings.md](06-bindings.md) L-17).

### 11.3 Money

Every Ripple Liquid file prints money with the `money` filter and nothing else ([11-components-commerce.md](11-components-commerce.md) CV-1). The shop's currency format in the Shopify admin decides whether a currency code is shown. The theme has no money snippet and no "show currency" setting (Ledger issues, item 7).

---

## 12. Replacement of every base theme file

### 12.1 Blocks (22)

Ledger section 8.6, with the call that replaces the most common use.

| Base theme block | Ripple | Replacement call |
|---|---|---|
| `basic-menu` | LinkList | `{% block 'link-list', menu: footer_menu, aria_label: footer_label %}{% endblock %}` |
| `button` | Button (IconButton when the content is only an icon) | `{% block 'button', variant: 'outline', href: routes.cart_url %}...{% endblock %}`; `commandfor` / `command` become `command_for` / `command`; `url` becomes `href`; the `inert` and `background_color` params have no equivalent |
| `card` | Card; with a product, collection or article: ProductCard, CollectionCard, ArticleCard | `{% block 'product-card', product: product %}{% endblock %}` |
| `container` | Container | `{% block 'container', as: 'section', py: '12 md:20' %}...{% endblock %}`; the background image case is Hero |
| `featured-collection` | FeaturedCollection | one resource block; doc 12 |
| `footer` | Footer | section 10.2 |
| `gift-card` | blueprint `gift-card` | `templates/gift_card.liquid`; no block |
| `header` | Header | section 10.2 |
| `heading` | Heading | `tag: 'h1', variant: 'lg'` becomes `level: 1` (optional `size`) |
| `image` | Image; Placeholder when there is no image | `{% block 'image', image: product.featured_image, ratio: '4/5' %}{% endblock %}`; `loading` and `fetch_priority` are params, never `attributes` |
| `link` | Link | `{% block 'link', href: url %}...{% endblock %}` |
| `logo` | Logo | `{% block 'logo' %}{% endblock %}` |
| `main-menu` | NavigationMenu (desktop) and MobileNav (drawer), two separate blocks | section 10.2 |
| `overline` | Text | `{% block 'text', variant: 'overline' %}...{% endblock %}` |
| `pagination` | Pagination | `{% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}` |
| `predictive-search` | PredictiveSearch inside a Dialog | section 10.2 |
| `price` | Price | `{% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}` |
| `quantity-selector` | QuantityInput | `{% block 'quantity-input', id: 'qty', default_value: 1, min: 1 %}{% endblock %}` |
| `richtext` | RichText | `{% block 'rich-text', html: product.description %}{% endblock %}` |
| `text` | Text | `{% block 'text', tone: 'muted' %}...{% endblock %}` |
| `variant-picker` | VariantPicker (one block for all options; no loop in the template) | `{% block 'variant-picker', id: 'product-options', product: product %}{% endblock %}` |
| `video` | Video | `{% block 'video', ratio: '16/9', aria_label: label %}<source ...>{% endblock %}` |

### 12.2 Snippets (22)

| Base theme snippet | Fate | Replacement |
|---|---|---|
| `cart-discount-code` | removed | DiscountCode: `{% block 'discount-code', id: 'cart-discount' %}{% endblock %}` |
| `cart-discount-list` | removed | discount rows inside `snippets/rp-cart-summary-totals.liquid` (CartSummary) |
| `cart-drawer` | removed | CartDrawer block (section 10.2) |
| `cart-line-item` | removed | CartLine: `snippets/rp-cart-line.liquid`, rendered by `rp-cart-lines-list`; no captures |
| `command-polyfill` | removed | inline script in `snippets/rp-head.liquid` plus the copy inside `ripple.js` (D-008 item 3) |
| `drawer` | removed | Drawer blocks: `drawer`, `drawer-header`, `drawer-title`, `drawer-description`, `drawer-body`, `drawer-footer` |
| `filter-group` | removed | FilterGroup: `snippets/rp-filter-group.liquid`; price ranges: `snippets/rp-price-range.liquid` |
| `filter-value` | removed | Checkbox and Swatch markup inside `rp-filter-group` |
| `filters` | removed | Filters, SortSelect, FilterChips blocks (section 10.4); no captured buttons |
| `import-map` | kept, rewritten | `snippets/import-map.liquid` (section 7.1) |
| `lcp-preload` | removed | Image props `loading: 'eager'` and `fetch_priority: 'high'` on the first image; no preload link |
| `localization-form` | removed | LocaleSelector: `{% block 'locale-selector', id: 'header-locale' %}{% endblock %}` |
| `meta-tags` | kept unchanged | `snippets/meta-tags.liquid` (theme-owned; SEO is a host concern outside Ripple) |
| `mobile-nav-drawer` | removed | MobileNav block |
| `notification-host` | removed | Toast: `{% block 'toast' %}{% endblock %}` |
| `placeholder-texture` | removed | Placeholder: `{% block 'placeholder', ratio: '4/5' %}{% endblock %}` |
| `skip-link` | removed | SkipLink: `{% block 'skip-link' %}...{% endblock %}` |
| `sr-announcer` | removed | Announcer: `{% block 'announcer' %}{% endblock %}`; cart messages come from the `strings` of the `rp-commerce` config element |
| `standard-actions-config` | removed, MUST NOT exist (RP307) | Hydrogen inside `ripple.js` (section 8) |
| `swatch` | removed | Swatch: `snippets/rp-swatch.liquid` and block `swatch` |
| `theme-scripts` | removed | the one module tag in `rp-head`; `assets/page-view.js` tag in the layout |
| `theme-styles` | removed | `snippets/rp-tokens.liquid` (section 6.3) |

### 12.3 Custom elements and JavaScript assets (22 files)

| Base theme file | Lines | Fate | Replacement |
|---|---|---|---|
| `s-cart.js` (`<s-cart>`) | 517 | removed | `rp-cart` on the Hydrogen cart store; partial refresh in the Liquid adapter |
| `s-live-form.js` (`<s-live-form>`) | 393 | removed | `rp-live` (Filters, SortSelect, FilterChips, LiveForm) |
| `s-variant-picker.js` (`<s-variant-picker>`) | 341 | removed | `rp-live` (VariantPicker): option values are links with `?variant=` |
| `s-product-form.js` (`<s-product-form>`) | 197 | removed | `rp-product-form` |
| `s-dialog.js` (`<s-dialog>`) | 189 | removed | `rp-dialog` |
| `s-notification.js` (`<s-notification>`) | 302 | removed | `ui-toast-region` and `toast()` from `ripple`; feedback inside an open dialog is a FormMessage or the dialog's status part (D-008 item 7) |
| `s-mobile-nav.js` (`<s-mobile-nav>`) | 263 | removed | no element: MobileNav is `rp-dialog` plus nested `<details>` |
| `s-nav-dropdown.js` (`<s-nav-dropdown>`) | 145 | removed | `rp-navigation-menu` plus native `popover` |
| `s-predictive-search.js` (`<s-predictive-search>`) | 187 | removed | `rp-predictive-search` (search field plus list of links, not a combobox, D-048) |
| `s-quantity-selector.js` (`<s-quantity-selector>`) | 146 | removed | `rp-quantity` |
| `s-localization-dropdown.js` (`<s-localization-dropdown>`) | 144 | removed | no element: native `popover` (LocaleSelector) |
| `s-video.js` (`<s-video>`) | 200 | removed | no element: Video is a native `<video controls>`. Click-to-load YouTube / Vimeo is not in V1 |
| `s-product-image-zoom.js` (`<s-product-image-zoom>`) | 72 | removed | lightbox Dialog inside ProductGallery (`rp-dialog`, `rp-carousel`) |
| `s-gift-card.js` (`<s-gift-card>`) | 159 | removed | no element: the gift-card blueprint shows the code as selectable text; the copy button and pointer tilt are not in V1 |
| `s-view-event.js` (`<s-view-event>`) | 7 | removed | `rp-view-event`, defined by the Liquid adapter from `@shopify/standard-events` ([05-commerce.md](05-commerce.md) section 12) |
| `standard-actions-override.js` | - | removed, MUST NOT exist | section 8 |
| `cart-feedback.js` | - | removed | announcements by `rp-cart` and the adapter |
| `live-region.js` | - | removed | `announce()` from `@ui-sdk/core` inside `ripple.js`; Announcer block |
| `quantity-rules.js` | - | removed | `rp-quantity` (min, max, step from the input's attributes) |
| `view-transition.js` | - | removed | none: region refresh does not use View Transitions in V1 |
| `page-view-event.js`, `page-view-event-init.js` | - | replaced | `assets/page-view.js` (section 7.5) |

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
| `border_radius_buttons`, `border_radius_cards`, `border_radius_forms` (three selects) | one slider `rp_radius`; a project that needs different shapes per kind overrides `--radius-control`, `--radius-field`, `--radius-surface` in the `core/tokens` region |
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
| G-3 | Order note is saved only by script | The note `textarea name="note"` belongs to the cart form (`form="cart-form"`); Update or Checkout saves it | CartNote | A-15 |
| G-4 | Discount code needs script | Still needs script on Liquid: the platform has no no-JS discount form. The discount form is `data-rp-js="inflow"` and therefore not shown without script; the buyer enters the code at checkout | D-043, D-005 (DiscountCode is `degraded` on Liquid) | A-15 |
| G-5 | Variant selection: radios change, the hidden `id` does not; the first available variant is added | Each option value is a link to the variant URL (`?variant=<id>`); the server renders the form with that variant's id | VariantPicker (D-047) | A-16 |
| G-6 | Header cart, search and menu buttons are `commandfor` buttons: dead without script on browsers without Invoker Commands; no link to `/cart` or `/search` | The three openers are links: `routes.cart_url`, `routes.search_url`, `#footer-menu` | D-009; section 10.2 | A-14 |
| G-7 | Mobile navigation below the first level needs push-panel script | The footer LinkList with id `footer-menu` prints every menu level as links; inside the drawer, sublevels are native `<details>` | LinkList, MobileNav (D-017) | A-14 |
| G-8 | Desktop submenus need `s-nav-dropdown` for keyboard users | Submenus are native `popover` panels opened by `popovertarget` buttons, which work without script | NavigationMenu (D-017) | A-14 |
| G-9 | Desktop country / currency panel is a `hidden` div opened only by script | The panel is a native `popover` with a real `{% form 'localization' %}` and a visible submit button | LocaleSelector | A-14 |
| G-10 | Filters live in a `<dialog>` drawer | Filters are inline; the form has a visible "Apply filters" submit button (`data-rp-js="fallback"`) | section 10.4 point 1 | A-17 |
| G-11 | Sort has a `<noscript>` submit button | Same result with one mechanism: a `data-rp-js="fallback"` submit button; no `<noscript>` | SortSelect | A-17 |
| G-12 | Predictive search dialog is unreachable | The search opener navigates to the search page, which has a plain GET SearchForm | D-009, D-048 | A-14 |
| G-13 | Image zoom dialogs need `commandfor` | The zoom opener is a link to the full image URL | ProductGallery ([11-components-commerce.md](11-components-commerce.md) Ledger issues item 13) | A-16 |
| G-14 | External video iframe is inside a `<template>` | Not in V1 (section 12.3) | none | none |
| G-15 | Toasts and gift-card copy need script | Toasts are `none` by design (D-005); every message a toast would show is also in the page after the form post (the cart page shows the cart). Gift-card code is selectable text | D-005 | none |

Not a gap but a behaviour change: without JavaScript, add to cart posts to `routes.cart_add_url` and the platform answers with its own redirect (to the cart page by default). With JavaScript the cart drawer opens.

---

## 14. Acceptance criteria

Tests live in `test/liquid/` (ledger section 5.1). "Shim" is the liquidjs renderer of [13-testing.md](13-testing.md). "The theme" is `examples/liquid/`. Every criterion is pass or fail.

Structure:

- **A-1** `ripple check` (layers S, H on shim-rendered pages, P) run in the theme exits 0 with 0 errors and 0 warnings.
- **A-2** Reproducibility: applying section 4.1 steps 2 to 4 to a copy holding only the theme-owned files produces a tree byte-identical to the committed theme.
- **A-3** `blocks/` holds exactly the number of files derived from the manifest (sum over components of 1 for tier `block` and `resource`, of the number of author-placed parts plus 1 for tier `parts`, of 0 for tier `snippet`), and that number is at most 150. With the tiers of section 4.4 it is 110.
- **A-4** None of the forbidden paths of section 4 exists. `grep -rE "s-(cart|dialog|live-form|variant-picker|product-form|notification|mobile-nav|nav-dropdown|predictive-search|quantity-selector|localization-dropdown|video|product-image-zoom|gift-card|view-event)\b" examples/liquid` finds nothing. `grep -r "inline_asset_content" examples/liquid` finds nothing. `grep -r "updateCart.configure" examples/liquid --exclude="ripple*.js"` finds nothing.
- **A-5** Theme Check (`themeCheckRun` from `@shopify/theme-check-node`, config `theme-check:recommended`) on the theme reports 0 offenses of severity error and 0 of severity warning.

Loading:

- **A-6** For every template rendered inside its layout with the shim: the first element child of `<head>` is `<script type="importmap">`; its text parses as JSON; `imports` has exactly the keys `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`, `@shopify/standard-events`; the page has exactly one import map.
- **A-7** In the same output, in document order: the `<link>` for `ripple.css`, one `<style>` containing `--rp-radius`, one classic inline `<script>` containing `rpCommandsPolyfill`, `script#rp-commerce` whose text parses as JSON with `host === "liquid"` and `cartDrawer === "cart-drawer"`, `<script type="module">` whose `src` equals the import-map value of `ripple`, the `<link>` for `styles.min.css`. No other `<script>` element exists in the document except `page-view.js` and JSON payload scripts.
- **A-8** Token bridge: rendering `rp-tokens` with the default settings prints `--rp-radius: 0.5rem`, `--rp-density: 1.0`, `--rp-text-scale: 1.2`, `--rp-background: #FFFFFF`, `--rp-foreground: #18181B`, `--rp-brand: #18181B`, `--rp-accent: #18181B`, `--color-muted: #F4F4F5`. With `rp_radius` 0 it prints `--rp-radius: 0.0rem` (or `0rem`); with `rp_radius` 24, `--rp-radius: 1.5rem`. With `rp_palette` absent it prints no colour declaration and no empty declaration.
- **A-9** `config/settings_schema.json` parses; it has exactly two objects; the second equals `registry/liquid/settings.json`; every `default` of a `range` setting divided as in section 6.2 equals the dial default in `css/tokens.css`.

Templates:

- **A-10** Static rules on `layout/*.liquid` and `templates/*.liquid`: no `{% capture %}` (T-21); no `class:` argument and no `class="` text (T-20); every `attributes:` argument matches `^'data-rp-(region|open)="[a-z0-9-]+"'$` (T-22); no `{% section`, `{% style`, `{% javascript`, `{% stylesheet`; no literal path matching `href="/` or `action="/` (T-4).
- **A-11** Size limits (lines, counted with `wc -l`): `layout/theme.liquid` at most 80; `templates/product.liquid` at most 50; `templates/collection.liquid` at most 60; `templates/cart.liquid` at most 30.
- **A-12** No dependence on utilities: every `class` attribute value in the shim-rendered HTML of every template consists only of tokens that start with `rp-` (plus platform classes inside masked opaque markup).
- **A-13** Regions: for every template rendered inside the layout, every partial name appears at most once; every partial's content is exactly one element whose `data-rp-region` equals the partial name; the set of declared partials per template equals section 9.1; no `<dialog>` is inside a `[data-rp-region]` element. Rendering `templates/cart.liquid` inside the layout yields no element with id `cart-drawer`.

No-JS structure (shim-rendered HTML, parsed; no browser needed):

- **A-14** Layout: the header contains `a[href][data-rp-open="mobile-nav"]` with `href="#footer-menu"`, `a[data-rp-open="search-dialog"]` whose `href` is the search route, and `a[data-rp-open="cart-drawer"]` whose `href` is the cart route; an element with id `footer-menu` exists and contains one `a[href]` for every link of every level of the fixture menu; every NavigationMenu disclosure is `button[popovertarget]` whose target id exists and has the `popover` attribute; the LocaleSelector contains a `form` with `method="post"` and a submit button that has no `data-rp-js` attribute.
- **A-15** Cart template with fixture `cart.two-lines`: exactly one `form[method="post"]` whose `action` is the cart route and whose id is `cart-form`; it contains two `input[name="updates[]"]`; its first submit button has `name="update"` and `data-rp-js="fallback"`; a `button[name="checkout"]` exists and has `form="cart-form"` or is inside that form; each `[data-rp-line]` contains `a[data-rp-part="remove"][href]`; `textarea[name="note"]` has `form="cart-form"`; every discount form has `data-rp-js="inflow"`. With fixture `cart.empty`: the list region contains the empty state and no `[data-rp-line]`.
- **A-16** Product template with fixture `product.options`: `rp-product-form` contains exactly one `form[method="post"]` with `input[type="hidden"][name="id"]` whose value is the selected variant id, and one `button[type="submit"][name="add"]`; the VariantPicker is not a descendant of that form; every existing option value is an `a[href]` whose URL contains `variant=`; the zoom opener is `a[href]`.
- **A-17** Collection template with fixture `filters.basic`: the Filters form is `form[method="get"]` whose `action` is the collection URL, is not inside a `<dialog>`, and contains a submit button with `data-rp-js="fallback"`; the SortSelect form is a separate `form[method="get"]` with a `select[name="sort_by"]` and a `data-rp-js="fallback"` submit button; pagination links are plain `a[href]`.

Behaviour (browser, static server serving shim-rendered pages and the built assets; commerce runtime not usable in this setup, which is the "script failure" case):

- **A-18** Upgrade stability (D-063 tier 3): loading each rendered template with `ripple.js` records zero mutations inside component roots outside the allow-lists.
- **A-19** With no `window.Shopify.actions` present, `getCommerce().usable` is `false` after `ready`, no form submission is prevented, and clicking the header cart link opens the drawer (the opener listener does not depend on commerce).

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
| V-2 | Is a schema setting readable by bare name when the caller passes nothing? What does a block see for a `select` value outside its options? | Readable; any value reaches the guard | No change needed: every enumeration is guarded ([06-bindings.md](06-bindings.md) L-15). Record the answer |
| V-3 | Is the body rendered before the block, in the caller's scope? | Yes | Report to doc 06; ProductForm's shape is unaffected |
| V-4 | How does `@shopify/partial-rendering` resolve? Does it resolve on a store without the preview? | Supplied by the platform; absent without the preview | If the platform expects a theme import-map entry, add that entry to `snippets/import-map.liquid` after the `@shopify/standard-events` line and record the URL here |
| V-5 | Exact `partials` API: `fetch` options and return type, `apply` return value, emitted events, behaviour for an unknown name and for a duplicate name | As in F-2; unknown name rejects | Report to doc 05 (`refresh-liquid.ts`). If a duplicate name is refreshed correctly in all instances, T-18 MAY be relaxed by a ledger update |
| V-6 | Does `{% partial %}` work inside a block file or a snippet rendered by a block? | Not used | No change: T-17 stays. Record the answer for a later simplification |
| V-7 | Does `{% render %}` inside `<script type="importmap">` output valid JSON? | Yes | "Fallback (SPIKE-02)" item 3 |
| V-8 | What does `{% form 'product' %}` print on the preview (extra hidden inputs), and what does a failed no-JS add show? | As in `ripple/docs/research/liquid-blocks-partials.md` 2.6 | Update the ProductForm masks in doc 11 |
| V-9 | Is `window.Shopify.actions` defined before module scripts run? | Yes | Report to doc 05: the Liquid adapter MUST then wait for `DOMContentLoaded` before the first cart read |
| V-10 | After Hydrogen's handler calls the default `updateCart` handler, does the platform reload the page ("falls back to a full page reload" on a theme it does not recognise)? | No reload when a handler is configured (the base theme relies on this) | This is SPIKE-01 territory: report to doc 05 |
| V-11 | Does the platform publish the page view itself? | No (the base theme dispatches it) | If yes: delete `assets/page-view.js` and its tag |
| V-12 | Which drop lists applied discount codes, and is `discount_application.type` equal to `discount_code`? | `cart.cart_level_discount_applications`, `type == 'discount_code'` | Correct `snippets/rp-cart-summary-totals.liquid` (doc 11, CartSummary) |
| V-13 | How does a `boolean` filter expose its value; are `filter.min_value.value` and `filter.range_max` in subunits for every currency? | Through `filter.values`; yes | Correct `rp-filter-group` / `rp-price-range` (doc 11) |
| V-14 | Does the theme editor let a merchant select a block rendered with `{% block %}` without `block.shopify_attributes`? | Yes | Report to doc 06; a root attribute would be added to every block by the generator |
| V-15 | Do `font_picker` defaults `inter_n4` and the `color_palette` id `rp_palette` validate on upload? | Yes | Correct section 6.1 |
| V-16 | Are `additional_checkout_buttons` and `content_for_additional_checkout_buttons` readable inside a block file? | Yes | Move the accelerated part to the template through a named slot param (D-037 exception) and record it in doc 11 |

### Fallback (SPIKE-02)

Applies only to the findings named.

1. **Wrapper element around block or partial output (V-1).** Record the wrapper's selector in this section. `css/base.css` gains `:where(<selector>) { display: contents; }` ([03-styling-and-tokens.md](03-styling-and-tokens.md) section 4.3); the canonicaliser unwraps it ([02-html-contract.md](02-html-contract.md) section 15); region lookup in `refresh-liquid.ts` is by partial name, which a wrapper does not affect. Theme files do not change. A-13's "exactly one element" is evaluated after unwrapping.
2. **Comment markers only.** No change (the canonicaliser removes comments).
3. **`{% render %}` not allowed inside the import map (V-7).** `snippets/import-map.liquid` contains the six Ripple lines of section 7.2 literally instead of the render line, and `snippets/rp-import-map-entries.liquid` is not installed ([07-manifest-registry-cli.md](07-manifest-registry-cli.md) "Fallback (SPIKE-02)").

### Fallback (SPIKE-09)

When recommendations cannot be fetched as a partial ([11-components-commerce.md](11-components-commerce.md), ProductRecommendations fallback):

1. `templates/product.liquid`: delete the `assign rec_url` line and replace the `product-recommendations` block (three lines) by:

   ```liquid
   {% if settings.rp_related_collection != blank %}
     {% block 'featured-collection', collection: settings.rp_related_collection %}{{ 'ripple.product-recommendations.title' | t }}{% endblock %}
   {% endif %}
   ```

2. `config/settings_schema.json` gains a third object: `{ "name": "t:ripple.settings.product", "settings": [ { "type": "collection", "id": "rp_related_collection", "label": "t:ripple.settings.related_collection" } ] }`, and the schema locale gains `ripple.settings.product` = `Product page` and `ripple.settings.related_collection` = `Related products collection`.
3. Section 9.1 loses the row `rp-product-recommendations`.

---

## 16. Evidence and UNVERIFIED

Evidence read for this document:

- Base theme: `ripple/theme/AGENTS.md`; `ripple/theme/layout/theme.liquid`; `ripple/theme/templates/product.liquid`, `collection.liquid`, `cart.liquid`; `ripple/theme/snippets/import-map.liquid`, `theme-scripts.liquid`, `theme-styles.liquid`, `command-polyfill.liquid`; `ripple/theme/config/settings_schema.json`; `ripple/theme/assets/page-view-event.js`, `page-view-event-init.js`, `s-view-event.js`; the file list of `ripple/theme/` (22 blocks, 22 snippets, 13 templates, 22 JavaScript assets, 14 icon assets, 35 storefront and 22 schema locale files).
- Research: `ripple/docs/research/base-theme.md` (inventory, weaknesses 3.1 to 3.5, section 4); `ripple/docs/research/liquid-blocks-partials.md` (sections 2, 4, 6, 7, 8, 12; spike `ripple/docs/research/spikes/liquid/`).
- Shopify docs, through the docs search tool in this session: `range` and `color_palette` input settings (F-7, F-8).
- Sibling documents: 03 (3.2, 3.8, 5.3), 04 (3.3, 5.4), 05 (4.2 to 4.5, 5.2, 6.2, 8, 10.4, 12), 06 (section 8), 07 (4.4, 4.5, 7.4, 7.6, 9.6), 09 and 10 (Liquid host notes), 11 (section 0, Liquid host notes and usage examples).

Nothing in this document was rendered by Shopify. Nothing was run for this document: the templates of section 10 were not rendered through the shim, because the block files they call do not exist yet. They MUST be rendered and checked (A-1, A-5, A-10 to A-17) as soon as the components exist.

UNVERIFIED items and their spike:

| Item | Spike |
|---|---|
| Everything in the "Default assumed" column of section 15 | SPIKE-02 |
| Hydrogen's default cart handler on the real Standard Actions runtime | SPIKE-01 |
| The Canvas / Sidekick compiler accepts the `config/styles.css` of section 5.2 | SPIKE-03 |
| `standard_event_data` output is accepted by the element created by `createViewEventElement()` when given in the attribute `view-event-payload` on `rp-view-event` (the base theme does exactly this with `s-view-event`) | SPIKE-02, V-11 |
| `linklists['main-menu']` and `linklists['footer']` exist on the test store (they are the default menu handles of a new Shopify store; the base theme reads its menus through schema settings instead) | SPIKE-02 |
| The hex values `#18181B` and `#F4F4F5` are the nearest sRGB hex of the `tokens.css` defaults (computed by hand, not by a tool) | none: A-9 MUST compute them with the token generator and this document MUST be corrected if they differ |
| Recommendations as a partial | SPIKE-09 |

---

## Ledger issues

Decisions this document had to make because the ledger or a sibling document is silent or contradictory. Each is applied above.

1. **Doc 12 did not exist when this document was written.** The layout uses chrome components through the minimum interface of section 10.1 (`header`, `footer`, `logo`, `navigation-menu`, `mobile-nav`, `locale-selector`, `account-link`, `link-list`). Doc 12 MUST provide at least those params and behaviours. The header is composed explicitly in the layout (the body replaces Header's default body), so that every fixed id of T-24 is visible in one file.
2. **Scope line "how Ripple CSS is installed into `config/styles.css`".** D-055 decides the opposite: component CSS is the asset `assets/ripple.css`; `config/styles.css` receives only the `@theme reference` marker region. Section 5 follows D-055.
3. **Six import-map entries, six JavaScript assets.** D-054 item 3 and [07-manifest-registry-cli.md](07-manifest-registry-cli.md) section 4.4 list five specifiers and five assets; [04-elements.md](04-elements.md) section 5.4 (owner of loading) requires a sixth, `ripple/shared` / `assets/ripple-shared.js`. This document follows doc 04. Doc 07's `CORE_FILES` table and its SPIKE-02 fallback list need the sixth entry. The joining comma: every Ripple entry ends with a comma and the theme map MUST keep one entry after the render line (section 7.1).
4. **Font default differs between hosts.** A `font_picker` needs a font handle as default; no handle is known to equal the system stack of `tokens.css`. Defaults are `inter_n4` (the handle the base theme uses for headings), so the Liquid default look uses Inter while other hosts use the system stack. D-026 says nothing about defaults.
5. **Locales shipped.** D-038 item 6 does not say which locale files the Ripple theme ships. The base theme ships 35 storefront and 22 schema locale files. This document ships English only, because Ripple's component strings exist only in English and a half-translated locale file is worse than none. Open question for Ben (research question 12 recommended shipping all).
6. **Page view analytics.** [05-commerce.md](05-commerce.md) section 12 item 2 says the platform publishes page views on Liquid; the base theme dispatches `PageViewEvent` itself. This document keeps one theme-owned module (`assets/page-view.js`) and makes it a SPIKE-02 question (V-11).
7. **Money snippet.** [05-commerce.md](05-commerce.md) section 11.2 assigns "one snippet that decides between `money` and `money_with_currency`" to this document; [11-components-commerce.md](11-components-commerce.md) CV-1 prints `| money` directly in every binding. This document follows doc 11: no snippet, `money` everywhere.
8. **One `color_palette` per theme (F-7).** D-026 item 5 and doc 07's settings patch do not handle a theme that already has a palette. Section 6.2 rule 4 defines the behaviour (omit `rp_palette`, print a note).
9. **Config element location.** [05-commerce.md](05-commerce.md) section 10.4 places `script#rp-commerce` "in `layout/theme.liquid`". This document prints it inside `snippets/rp-head.liquid`, so that `ripple init` stays a one-line patch and both layouts get it. `registry/liquid/locales/core.json` therefore carries the seven commerce string keys.
10. **Range settings use integers.** D-026 names the setting types but not their bounds or units. Section 6.1 fixes integer sliders (px, percent, hundredths) and section 6.3 divides them; the bounds stay inside the dial ranges of doc 03.
11. **Template regions.** D-046 says the region root carries `data-rp-region` but not which element that is for regions that wrap whole components. T-17 form 2 fixes it: a `stack` block with `attributes: 'data-rp-region="<name>"'`. This is one of only two uses of `attributes` allowed in the theme's templates (T-22).
12. **Filters are inline, not in a drawer.** The base theme and the research's "after" example put filters in a drawer. D-005 requires Filters to be `full` without JavaScript, which a dialog cannot guarantee; section 10.4 renders them inline.
13. **Infrastructure snippet filters.** `asset_url`, `stylesheet_tag`, `font_face`, `divided_by`, `json` are needed by `rp-head` and `rp-tokens` and are not in the subset of [06-bindings.md](06-bindings.md) L-13 (which lists `json` and not the others). Section 3 adds them for the three infrastructure snippets only.
14. **AnnouncementBar** is in the `layout` blueprint list of ledger section 8.5 but not in this theme's layout (the base theme has none). It is one line to add (section 10.2 point 7).
15. **Features of the base theme not carried over** (no ledger component covers them): click-to-load external video, gift-card copy button and tilt, View Transitions around partial refresh, per-variant quantity rules, the sticky product information column, the per-kind radius selects, the LCP preload link.
