# Ripple documentation index

Ripple is a design system and component library for Shopify storefronts with one HTML contract per component and four render hosts (`html`, `react`, `remix`, `liquid`). This directory holds the complete specification and the implementation plan. Paths below are relative to `docs/`.

## Rules

1. `00-decisions.md` (the decision ledger) wins on any conflict with any other document, including this one, `CONVENTIONS.md` and `PLAN.md`. After the ledger, the owning document of a fact wins (ledger section 12), then the research reports.
2. Never read a numbered document (`01` to `14`) or the ledger in full. They are 100 kB to 320 kB each. Open only the section a task names, by searching for its heading.
3. A document MUST NOT be edited by an implementation task, with three exceptions: a spike task appends one sentence to its row in ledger section 3; any task may append an entry under `## Ledger issues` at the end of the owning document; a task adds its done file under `plan/done/`.
4. `research/` and the repository directory `theme/` (the Shopify base theme) are reference material. They are never edited and never copied as a model, except where a spec names a file to copy.

## Reading order for a new agent

1. `../AGENTS.md` (repository root): how to work here. 2 minutes.
2. `CONVENTIONS.md`: names, attributes, props, file layout, commands, definition of done, never-do list.
3. `PLAN.md` sections 1 to 3, the recipe of section 5 for your task's kind, and your task's one row of section 6.
4. Your task's detail: `plan/<milestone file>`, section `## <task id>`.
5. Only the files and sections that detail names. Nothing else.

## Process documents

| File | What it is |
|---|---|
| `CONVENTIONS.md` | Digest of the ledger that every task reads first; every line cites its decision |
| `PLAN.md` | Master plan: how to pick a task, branch and pull request rules, definition of done, milestones and gates, recipes, the table of all 297 tasks, risk register |
| `README.md` | This index |
| `plan/M0-bootstrap.md` | Task details for M0: repository, build, generator, test harness in four hosts |
| `plan/M1-golden-path.md` | Task details for M1: golden-path vertical slice (21 components, commerce core) and local spikes |
| `plan/M2-foundations.md` | Task details for M2: the remaining foundation components and three checker families |
| `plan/M3-interactive.md` | Task details for M3: Popover, Accordion, Tabs, Tooltip, Toast, Carousel |
| `plan/M4-commerce.md` | Task details for M4: the remaining commerce components and elements |
| `plan/M5-chrome.md` | Task details for M5: chrome components; strict build |
| `plan/M6-cli-registry-checker.md` | Task details for M6: registry, CLI commands, remaining checker families |
| `plan/M7-blueprints-examples.md` | Task details for M7: 14 blueprints and the four example storefronts, including the Ripple Liquid theme |
| `plan/M8-agent-kit-evals.md` | Task details for M8: guides, skills, eval harness, eval tasks, eval gates |
| `plan/M9-release.md` | Task details for M9: release checks |
| `plan/M10-liquid-live.md` | Task details for M10: work that needs Ben's Liquid preview store (BLOCKED-ON-BEN) |
| `plan/done/<task id>.md` | One short file per finished task: the handover between sessions |

The `plan/M*.md` files are written from the task table of `PLAN.md` section 6. If one is missing, the milestone has not been detailed yet; do not start its tasks.

## Specification documents

Sizes are approximate. "Owns" follows ledger section 12.

| File | Size | Owns |
|---|---|---|
| `00-decisions.md` | 300 kB | The decision ledger: decisions D-001 to D-113, risks, spikes, naming, directory layout, prop vocabulary, component template, component list, open questions, non-goals, document ownership. LAW |
| `01-architecture.md` | 107 kB | Hosts, backends, layers and import rules, page lifecycle, repository layout, root `package.json` and `tsconfig.json`, the published package, build pipeline, pinned versions |
| `02-html-contract.md` | 156 kB | Contract rules, ids, prop-to-attribute mapping, responsive grammar, upgrade allow-lists, fixtures and masks, the canonicalisation algorithm and its reference code |
| `03-styling-and-tokens.md` | 145 kB | Cascade layers, tokens, dials, schemes, `base.css`, `theme.css`, `props.css` generation, component CSS rules, the CSS linter, browser floor for CSS |
| `04-elements.md` | 189 kB | Runtime, rules for writing an `rp-*` element, `rp-quantity`, `rp-dialog`, `rp-carousel`, `rp-navigation-menu`, UI SDK usage, lazy loading, browser bundles, Invoker Commands polyfill |
| `05-commerce.md` | 150 kB | Commerce adapter, `CommerceOptions`, cart store per backend, form dialects, commerce elements, regions and refresh strategies, resource types, money, images, analytics |
| `06-bindings.md` | 147 kB | React rules and hooks, Remix rules, TSX conventions, Liquid tiers and rules, generated versus hand-written files, the `html` host, per-host conformance rules |
| `07-manifest-registry-cli.md` | 321 kB | Manifest schema, contract template language, generator, registry, provenance trailers, project configuration, CLI commands, upgrade merge, the checker and its rule list, release policy |
| `08-agent-kit-and-evals.md` | 187 kB | Package docs, the `AGENTS.md` section, 14 skills, checker rule text, development warnings, in-page agent surface, eval suite and gates |
| `09-components-foundation.md` | 25 kB | Rules shared by the 37 foundation components; icon path data; pointers to the specs |
| `10-components-interactive.md` | 13 kB | Rules shared by the 9 interactive components; pointers to the specs |
| `11-components-commerce.md` | 43 kB | Rules shared by the 26 commerce components: index, embedded markup, region parts, backend fixtures, resource fixtures |
| `12-components-chrome-and-blueprints.md` | 76 kB | Rules shared by the 12 chrome components; blueprint conventions (files, targets, host forms, data loading, routes, shared tests) |
| `13-testing.md` | 262 kB | Test tiers, runner, `src/testing/` (fixtures, resources, Liquid shim, theme server), browser support code, every tier's test files, size budgets, CI, definition of done for a component |
| `14-liquid-theme.md` | 115 kB | The Ripple Liquid theme: rules, file tree and build procedure, CSS, settings, JavaScript loading, regions, locales, what replaces each base theme file, acceptance, SPIKE-02 |

## Component specifications (`components/`, 84 files)

One file per component, in the template of ledger section 7. The column "Task" is the task of `PLAN.md` that builds it.

### Foundation (rules shared by the group: `09-components-foundation.md` section 0)

| File | Task | Purpose |
|---|---|---|
| `components/container.md` | M2-T01 | A full-width band whose content is centred and limited to the page or prose width. |
| `components/stack.md` | M1-T02 | A one-dimensional flex layout, vertical by default, that never wraps. |
| `components/inline.md` | M2-T02 | A horizontal flex row that wraps onto new lines, with children centred on the cross axis. |
| `components/grid.md` | M2-T03 | An equal-column CSS grid. |
| `components/card.md` | M2-T04 | A surface that groups related content: a bordered, tinted or raised box with padding and a radius. |
| `components/separator.md` | M2-T05 | A thin rule that separates content, horizontal by default. |
| `components/heading.md` | M2-T06 | A heading. |
| `components/text.md` | M2-T07 | A run of body text with a variant, an optional size, a tone and a weight. |
| `components/rich-text.md` | M2-T08 | A wrapper that styles HTML Ripple did not author: product descriptions, page and article bodies, policy text. |
| `components/link.md` | M1-T05 | A text link. |
| `components/image.md` | M1-T08 | A responsive image from a Shopify image object. |
| `components/video.md` | M2-T09 | A native `<video>` with controls. |
| `components/icon.md` | M1-T03 | A decorative inline SVG icon from Ripple's own set of 24 icons (section 0.6), drawn in the current text colour (D-068). |
| `components/placeholder.md` | M1-T09 | A neutral box with a fixed aspect ratio that stands in for a missing image, so that grids keep their shape. |
| `components/button.md` | M1-T01 | The standard action control with a text label. |
| `components/icon-button.md` | M1-T04 | A square action control whose only content is one icon. |
| `components/field.md` | M2-T17 | A wrapper that lays out one form control with its label, description and error message, and fixes the ids that link them: the control has `id="<id>... |
| `components/label.md` | M2-T10 | A native `<label>` for one form control. |
| `components/input.md` | M2-T11 | A native single-line text input. |
| `components/textarea.md` | M2-T12 | A native multi-line text input. |
| `components/select.md` | M2-T13 | A native single-choice `<select>`. |
| `components/checkbox.md` | M2-T14 | A native checkbox. |
| `components/radio-group.md` | M2-T15 | A `<fieldset>` of native radio buttons with a legend: exactly one option of the group is chosen. |
| `components/switch.md` | M2-T16 | A native checkbox presented as an on/off switch (`role="switch"`). |
| `components/form-message.md` | M1-T06 | A short message about a form or a control: an error, a success note or a hint, printed by the server in the response to a form post (`02-html-contr... |
| `components/badge.md` | M2-T18 | A short, non-interactive label attached to another object: "Sale", "New", "Sold out", a count. |
| `components/banner.md` | M2-T19 | A prominent in-page message about the page or a section: an error summary after a form post, a shipping notice, a success confirmation. |
| `components/spinner.md` | M2-T20 | An indeterminate activity indicator for a region whose content is loading. |
| `components/skeleton.md` | M2-T21 | A grey block that reserves the box of content that script will load, so that the layout does not shift when the content arrives. |
| `components/progress.md` | M2-T22 | A horizontal bar that shows how much of a measurable quantity is complete, on the native `<progress>` element. |
| `components/empty-state.md` | M2-T23 | A centred block that explains that a list or region has nothing in it and offers the next step: an empty cart, a search with no results, an empty c... |
| `components/rating.md` | M2-T24 | A read-only display of an average rating as five stars filled in half-star steps, with an optional review count after it. |
| `components/skip-link.md` | M2-T25 | The first focusable element of the page: a link that is off-screen until it receives keyboard focus and that jumps past the header to the main cont... |
| `components/visually-hidden.md` | M1-T07 | Text that assistive technology reads and that is not painted: extra context for a link or a count ("items in cart", "reviews"). |
| `components/announcer.md` | M2-T26 | An empty, visually hidden live region placed inside a modal dialog or an `rp-*` root (D-079). |
| `components/breadcrumb.md` | M2-T27 | The trail of links from the home page to the current page. |
| `components/pagination.md` | M2-T28 | Links to the previous and next page of a paginated list (collection, search results, blog). |

### Interactive (`10-components-interactive.md` section 0)

| File | Task | Purpose |
|---|---|---|
| `components/dialog.md` | M1-T17 | A modal window centred over the page, built on the native `<dialog>` element inside one `rp-dialog` wrapper. |
| `components/drawer.md` | M1-T18 | A modal panel that slides in from an edge of the screen. |
| `components/popover.md` | M3-T01 | A small non-modal panel that opens next to the button that controls it and closes on Escape or on a press outside. |
| `components/tooltip.md` | M3-T05 | A one-line text hint that appears next to a button on hover and on keyboard focus. |
| `components/toast.md` | M3-T07 | The page's single, empty notification region plus the `toast()` function that shows a short, self-dismissing message in it after a client-side action. |
| `components/tabs.md` | M3-T04 | A row of tab buttons that shows one panel of content at a time. |
| `components/accordion.md` | M3-T02 | A vertical list of headings that each show or hide a section of content. |
| `components/carousel.md` | M3-T09 | A horizontally scrolling list of items with CSS scroll snapping, plus Previous and Next buttons added by `rp-carousel` (D-016). |
| `components/quantity-input.md` | M1-T15 | A native number input with a Decrease and an Increase button, wrapped in `rp-quantity` (D-015). |

### Commerce (`11-components-commerce.md` section 0)

| File | Task | Purpose |
|---|---|---|
| `components/product-card.md` | M4-T03 | A product summary for grids and carousels: image, optional badge, optional vendor, title link and price. |
| `components/collection-card.md` | M4-T04 | A collection summary: image and title link. |
| `components/article-card.md` | M4-T05 | A blog article summary: image, date, title link and excerpt. |
| `components/price.md` | M1-T10 | Prints a price formatted by the server, with an optional struck-through compare-at price. |
| `components/product-gallery.md` | M4-T13 | The product page image gallery: a scroll-snap Carousel of product images, each of which opens a full-size lightbox Dialog. |
| `components/product-form.md` | M1-T33 | The add-to-cart form for one product variant. |
| `components/variant-picker.md` | M4-T12 | Lets the buyer choose a product variant. |
| `components/swatch.md` | M4-T01 | A small decorative sample of a colour or an image, used inside option values and filter values. |
| `components/add-to-cart-button.md` | M1-T31 | The submit button of a ProductForm. |
| `components/product-recommendations.md` | M4-T19 | A titled grid of recommended products for a product. |
| `components/cart-link.md` | M1-T34 | The link to the cart with a live item count. |
| `components/cart-drawer.md` | M1-T38 | The cart in a modal drawer. |
| `components/cart-lines.md` | M1-T37 | The editable list of cart lines, with the cart-level error message and the status region for announcements. |
| `components/cart-line.md` | M1-T35 | One line of the cart: image, title link, variant, line attributes, quantity control, remove control, line price and the line's error message. |
| `components/cart-summary.md` | M1-T36 | The cart totals: subtotal, applied discount codes (each removable), total, the tax and shipping note, and the checkout button. |
| `components/cart-note.md` | M4-T14 | A textarea for the order note, saved to the cart. |
| `components/discount-code.md` | M4-T15 | A form to apply one discount code to the cart. |
| `components/checkout-button.md` | M1-T32 | The control that takes the buyer to Shopify checkout (D-050). |
| `components/filters.md` | M4-T09 | The filter form of a collection or search page: one GET form whose controls are the storefront filters. |
| `components/filter-group.md` | M4-T07 | One filter inside a Filters form: a native disclosure whose content is a list of checkboxes, or a PriceRange for the price filter. |
| `components/filter-chips.md` | M4-T10 | The list of active filters as removable chips, with a "Clear all" link. |
| `components/price-range.md` | M4-T06 | Two number inputs, minimum and maximum price, for the price filter of a Filters form. |
| `components/sort-select.md` | M4-T11 | A select that changes the sort order of a collection or search page. |
| `components/search-form.md` | M4-T02 | A search form: one search input and a submit button, sending `q` to the search page with GET. |
| `components/predictive-search.md` | M4-T17 | A search form that shows product results in a panel while the buyer types (D-048). |
| `components/live-form.md` | M4-T08 | A wrapper that turns the GET forms and links inside it into in-place refreshes of named regions (D-047). |

### Chrome (`12-components-chrome-and-blueprints.md` sections 0 and 1)

| File | Task | Purpose |
|---|---|---|
| `components/header.md` | M5-T13 | The site header bar: a `<header>` landmark with a width-limited inner row. |
| `components/footer.md` | M5-T06 | The site footer: a `<footer>` landmark with a width-limited inner column. |
| `components/announcement-bar.md` | M5-T04 | A full-width band above the Header for one short message (shipping threshold, sale notice), optionally containing a Link. |
| `components/navigation-menu.md` | M5-T11 | The desktop primary navigation: a row of top-level links; an item with children also has a disclosure button that opens a native `popover` panel li... |
| `components/mobile-nav.md` | M5-T12 | The small-screen navigation: a Drawer (native modal `<dialog>` inside `rp-dialog`, D-008) that lists the whole menu, with nested `<details>` for su... |
| `components/link-list.md` | M5-T03 | A one-level list of links from a menu, inside a named `<nav>` landmark. |
| `components/logo.md` | M5-T01 | The shop's brand mark as a link to the home page: the logo image when one exists, otherwise the shop name as text. |
| `components/locale-selector.md` | M5-T08 | Lets the shopper change country (and with it currency) and language. |
| `components/account-link.md` | M5-T02 | A link to the Shopify-hosted customer account (D-051): an account icon and a text label. |
| `components/newsletter-form.md` | M5-T07 | An email sign-up form: one email field and a submit button, with a server-rendered success or error message after the post. |
| `components/hero.md` | M5-T05 | A large introductory band: optional full-bleed background image with content (heading, text, buttons) laid over it. |
| `components/featured-collection.md` | M5-T09 | A titled band of products from one collection, as a grid or as a carousel, with a "View all" link to the collection. |

## Blueprint specifications (`blueprints/`, 14 files)

One file per blueprint. Shared conventions: `12-components-chrome-and-blueprints.md` section 2. Tasks: M7-T05 to M7-T19.

| File | Purpose |
|---|---|
| `blueprints/layout.md` | The document shell that every storefront page is rendered in: skip link, announcement bar, header, the `<main>` element, footer with newsletter for... |
| `blueprints/home.md` | The storefront home page: a hero, one featured collection, and a short list of collections. |
| `blueprints/collection.md` | A collection page: title and description, filters, sort, active filter chips, a product grid and pagination. |
| `blueprints/collections-list.md` | The list of all collections. |
| `blueprints/product.md` | A product page: gallery, vendor, title, variant picker, price, add-to-cart form, description and recommendations. |
| `blueprints/search.md` | The search results page: a search form, the result count, product results and pagination. |
| `blueprints/cart.md` | The cart page: lines with quantity controls, summary, discount code, note and checkout. |
| `blueprints/blog.md` | A blog index: the blog title and a paginated grid of article cards. |
| `blueprints/article.md` | One blog article: title, date and author, lead image, body, and a link back to the blog. |
| `blueprints/page.md` | A content page (About, FAQ, policies written as pages): title and rich text body in a reading-width column. |
| `blueprints/contact.md` | A contact page: the page's title and body, then a form with name, email and message. |
| `blueprints/not-found.md` | The page shown for an unknown URL (HTTP 404): a message and ways forward. |
| `blueprints/password.md` | The page a visitor sees when the storefront is password protected: the shop name, a message, and a password form. |
| `blueprints/gift-card.md` | The page a buyer opens from a gift card email: the balance, the code, its state, and a link to start shopping. |

## Research (`research/`, reference only)

Evidence behind the ledger. Read a report only when a task detail names a section of it.

| File | Subject |
|---|---|
| `research/agent-kit-and-distribution.md` | Manifest, registry, CLI, checker, skills, evals, package |
| `research/base-theme.md` | The Shopify base theme (`theme/`): findings |
| `research/hydrogen-core.md` | Hydrogen core: what the commerce layer binds to |
| `research/liquid-blocks-partials.md` | Rendering from Liquid: blocks, partials, loading, conformance |
| `research/react-and-custom-elements.md` | React 19 and UI SDK custom elements (risk R1) |
| `research/remix-3.md` | Remix 3 binding findings |
| `research/styling-spike.md` | Props, tokens, dials, component CSS, pre-upgrade styling |
| `research/uisdk-web-elements.md` | The UI SDK web-components adapter `@ui-sdk/web` |

Spike directories (`research/spikes/<name>/`). Those marked "reference implementation" hold code that a spec tells a task to copy.

| Directory | Content |
|---|---|
| `research/spikes/agent-kit/` | Checker, generator, manifest and three-way merge prototypes (used by M6-T18) |
| `research/spikes/bindings/` | Evidence for `06-bindings.md` |
| `research/spikes/commerce/` | Reference implementation of `src/commerce/*.ts` and `fake-sa.js` (`05-commerce.md` section 1) |
| `research/spikes/components-interactive/` | Measured upgrade snapshots for the interactive components |
| `research/spikes/elements-runtime/` | Runtime and `rp-quantity` prototype; default path of SPIKE-04 |
| `research/spikes/hydrogen-core/` | Hydrogen core experiments |
| `research/spikes/liquid/` | Liquid block spike |
| `research/spikes/react-ce/` | React with custom elements experiments |
| `research/spikes/remix/` | Remix 3 binding spike |
| `research/spikes/styling/` | Styling spike |
| `research/spikes/styling-doc03/` | Historical styling files; MUST NOT be copied (`03-styling-and-tokens.md` is the source) |
| `research/spikes/testing/` | Test runner, Liquid shim, theme server and size check as run for `13-testing.md` |
| `research/spikes/uisdk-web/` | `@ui-sdk/web` 0.1.0-beta.14 upgrade behaviour |

New spike reports are added by spike tasks as `research/spikes/<spike name>/README.md` (names in ledger section 3); the eval baseline goes to `research/spikes/evals-baseline/README.md`.
