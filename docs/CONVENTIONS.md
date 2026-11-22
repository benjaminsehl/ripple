# Ripple conventions (digest)

Read this file before every task. It restates the ledger `docs/00-decisions.md` and adds nothing. Citations: `D-nnn` a decision; `L4.4` ledger section 4.4; `doc 13 §2.3` the owning doc section a decision delegates to. The ledger wins on any conflict (L0, D-069). `<pkg>` is the package placeholder `ripple-kit`, written only in `src/identity.ts`; the binary is `ripple`; `<id>` is a component id (D-052).

## 1. Vocabulary

- Render hosts: `html`, `react`, `remix`, `liquid`. "Host" alone means render host (D-001).
- Commerce backends: `hydrogen` (hosts `html`, `react`, `remix`; endpoint `/api/cart`) and `liquid` (Standard Actions) (D-001).
- One HTML contract: every host prints the same upgrade-stable DOM. Elements mutate (attribute value write, child add or remove, text change) only what manifest `upgradeAllow[]` lists (D-002, D-071).
- The manifest `components/<id>/<id>.json` is the source; never edit a file `pnpm gen` writes (D-003, D-058).
- Light DOM only (D-004). `noJs.level` is `full`, `degraded` or `none` (D-005).
- Component `kind`: `static`, `native`, `ui`, `commerce`. Liquid tier: `block`, `parts`, `resource`, `snippet` (Icon only) (D-006, D-037).

## 2. Names (L4.1, L4.2)

| Thing | Rule | Example |
|---|---|---|
| Component name | PascalCase singular noun | `ProductCard` |
| Component id | kebab-case of the name; used for files, classes, manifest `name` | `product-card` |
| Part export (TSX) | `<Component><Part>`, flat named export, no dot notation | `DialogTitle` (D-035) |
| CSS class | root `rp-<id>`, part `rp-<id>-<part>`; no other class; QuantityInput uses `rp-quantity` (D-015) | `rp-dialog-title` (D-024) |
| Composed class | composed component's class first, then own | `class="rp-drawer rp-cart-drawer"` (D-070) |
| Ripple element tag | `rp-<name>`; primitive name equals tag | `rp-dialog` (D-019) |
| UI SDK tag | `ui-<name>`; only Tabs, Tooltip, Toast families | `ui-tabs` (D-007, D-022) |
| Locale key | `ripple.<id>.<key>`, key snake_case; blueprints `ripple.blueprints.<blueprint id>.<key>`; Liquid schema labels `ripple.props.<prop or value>`; theme settings `ripple.settings.<key>` | `ripple.cart-line.remove` (D-038) |
| Component rule id | kebab-case starting with the component id; in manifest `rules[]`; reported by RP113 | `dialog-needs-title` |
| Manifest prop, TSX prop | camelCase | `fullWidth` |
| Liquid param, setting id | snake_case | `full_width` |
| HTML attribute | `data-` + kebab-case | `data-full-width` |

- The case mapping is mechanical; no component defines an exception. Global exceptions only: React `className` for `class`; TSX rest props for Liquid `attributes` (L4.2).

## 3. Props to attributes (L4.3)

- Enumerated prop: `data-<prop>="<value>"`; the default value IS printed unless the spec says "omitted at default" (D-073).
- Boolean prop: `data-<prop>=""` when true, nothing when false. Responsive `hidden` prints `data-hidden="true"` or `data-hidden="true md:false"`.
- A prop that is a native attribute prints that attribute, not `data-`: `id href target rel type name value checked disabled required placeholder min max step pattern autocomplete rows alt width height loading fetchpriority sizes poster autoplay muted loop for form commandfor command popovertarget open aria-label aria-describedby aria-current aria-invalid`.
- `as` and `level` select the element and print no attribute.
- An unset prop prints nothing; an empty string is unset; an invalid enum value prints the default, in every host (D-073).
- TSX: rest props are spread FIRST. Liquid: `{{ attributes }}` is printed LAST. Text content is children, never a prop. Initial values use `default<X>` props; controlled props exist only in React (Dialog, Drawer `open`; Tabs, QuantityInput `value`) (D-035, D-036).

## 4. Hook attributes: the complete list (L4.4)

Read by JavaScript and tests. CSS MUST NOT select them, except the generated `data-rp-js` script-state rules (`css/base.css`, layer `rp.props`, no `!important`, nearest owner; D-021 (b), D-125). The two `!important` rules (`[hidden]`, Tabs `@media (scripting: none)`) are in `@layer ui-sdk` (D-021 (d)). Any other `data-rp-*` name is checker error RP118 (L4.4).

| Attribute | On | Value |
|---|---|---|
| `data-slot` | `rp-*` roots | the tag name (D-019) |
| `data-slot` | UI SDK family elements | `tabs tabs-list tabs-tab tabs-panel tooltip-trigger tooltip-content toast-region` (L4.4) |
| `data-rp-part` | native descendants of an `rp-*` root | part name; shared names `count error status input increment decrement prev next viewport item results submit remove trigger` (L4.4) |
| `data-rp-field` | commerce form controls | `merchandise-id quantity line-id selling-plan note discount-code` (D-043) |
| `data-rp-line` | cart line root | line id (hydrogen) or line key (liquid) (L4.4) |
| `data-rp-open`, `data-rp-close` | `<a href>` openers; `<button>` on the SPIKE-05 fallback path only | dialog id; `data-rp-open` is printed only by prop `dialog`, CartLink prop `drawer`, the ProductGallery zoom link, the Header default body (D-009, L4.4) |
| `data-rp-refresh` | forms and links inside an `rp-live` or `rp-cart` root; `rp-live`, `rp-cart`, `rp-predictive-search`, `rp-recommendations` roots; not `rp-product-form` | space-separated region names (D-046) |
| `data-rp-region` | region root | region name (D-046, D-091) |
| `data-rp-js` | controls, forms | `inflow`, `overlay`, `fallback` (D-021) |
| `data-default-open` | `<dialog>` | empty (D-008) |
| `data-url` | `rp-recommendations` root | URL (D-046) |
| `view-event-trigger`, `view-event-payload`, `data-view-event-payload` | `rp-view-event` and its JSON child | (D-089) |
| `data-template` | `<main>` in the Liquid layout | page type (D-089) |
| `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden` | controls | sentence or empty (D-065) |
| `data-rmx-key`, `data-rmx-preserve-attrs`, `data-rmx-document` | Remix only | (D-034) |
| `data-rp-case`, `data-rp-fixture`, `data-rp-test-raw` | test pages only | never in shipped files (L4.4) |

- Reserved element id: `rp-commerce`, the config element `<script type="application/json" id="rp-commerce">` (D-087).
- Regions: `rp-cart-lines rp-cart-summary rp-product-buy rp-product-media rp-product-recommendations rp-collection-results rp-collection-filters rp-collection-toolbar rp-search-results rp-predictive-results` (D-046).

## 5. State, events, ids

- State attributes: native attributes, ARIA attributes, and `data-open data-closed data-disabled data-pending data-selected data-checked data-active data-current`. There is NO `data-state` (D-021).
- Element events: `openchange`, `valuechange`, `indexchange`, `action`; lowercase, non-bubbling, dispatched on the root (D-023).
- Document events: `rp:refresh` (cancelable; detail `{regions, url, reason}`) and `rp:refreshed`; reasons `cart variant filter predictive recommendations manual` (D-023).
- React callbacks `onOpenChange`, `onValueChange`, `onIndexChange`, `onAction` receive `(value, detail)`. No attribute or prop matching `/^on/i` outside React (D-023).
- Ids are explicit props, never generated (no `useId`, no `block.id`); the spec's "Requires `id`" field says when (D-020).
- Derived id suffixes: `-title -description -error -trigger -content -tab-<value> -panel-<value> -item-<value> -list -live -form` (D-020).
- Props that take another component's root id are named after the target: `dialog drawer tabs popover field tooltip accordion cartLines` (D-020).

## 6. Prop vocabulary (L6)

These names and values are reserved; a component spec's Props table is authoritative for its component (L6).

- Universal: `id`; `class` (React `className`); rest props (Liquid `attributes`); `span` (`1 2 3 4 5 6 full`, responsive); `hidden` (`true false`, responsive); `rmxKey` (Remix); `strings` (TSX) (L6.1, D-066).
- Layout: `gap gapX gapY p px py pt pb` (space steps); `direction` (`row column`); `wrap` (`wrap nowrap`); `align` (`start center end stretch baseline`); `justify` (`start center end between`); `columns` (`1 2 3 4 5 6 12`); `width` (`page prose full`) (L6.2).
- Space steps: `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24 32` (D-029).
- Button `variant`: `primary secondary outline ghost link destructive`; control `size`: `sm md lg`; no `tone` on Button (D-031).
- Text `variant`: `body lead caption overline`. Link `variant`: `inline plain`. Other `variant`: `solid soft outline plain elevated`.
- `tone`: `neutral muted primary info success warning destructive sale` (D-027).
- Text `size`: `xs sm base lg xl 2xl 3xl 4xl 5xl 6xl`. Overlay `size`: `sm md lg full`. `level`: 1 to 6.
- `weight`: `normal medium semibold bold`. `textAlign`: `start center end`. `side`: `top bottom start end`.
- `ratio`: `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9`. `fit`: `cover contain`. `radius`: `none sm md lg xl full`. `scheme`: `light dark`.
- `loading`: `lazy eager`. `fetchPriority`: `auto high low`. `type`: `button submit reset`. `command`: `show-modal close show-popover hide-popover toggle-popover`.
- Shared booleans and strings: `disabled pending fullWidth invalid required current icon href ariaLabel htmlFor formId rpField dialog tooltip describedBy commandFor popoverTarget`, `defaultOpen defaultValue defaultChecked`, `closeLabel` (D-124) (L6.4).
- Commerce and chrome props: `refresh layout fill showVendor from locale search cartLines drawer count action predictive open params chips clearUrl sortBy query limit rows acceleratedCheckout links status`; attributes `data-sold-out data-swatch data-layout data-show-vendor data-row` (L6.4). `action` is TSX-only on the cart forms; blueprints pass `cartAction` (D-118). QuantityInput has `required` (D-116).
- Prohibited names: `loading` meaning busy, `color`, `kind`, `intent`, `appearance`, `theme`, `isOpen`, `isDisabled`, `label` or `text` as content props, `left`, `right`, `m mx my mt mb`, `asChild`, `for`, `form`, `describedBy` on Dialog or Drawer, `defaultIndex`, any `/^on/i` name outside React (L6.5).

## 7. Responsive grammar (D-028)

- One attribute, space-separated tokens; `token := value | breakpoint ":" value`; breakpoints `sm md lg xl 2xl`; mobile-first; at most one token per breakpoint (D-028).
- Example: `gap="2 md:4"` prints `data-gap="2 md:4"` (D-028).
- TSX type is `T | (string & {})` (scale props also accept a number). Liquid values are always quoted strings. Object form is rejected (D-028).
- There are no margin props (D-028).

## 8. CSS (D-024 to D-030)

- Plain CSS, one file `components/<id>/<id>.css`, one `@layer rp.components` block; at most 6,000 bytes minified (D-024, D-064).
- Modifier rules (`[data-variant=...]`) set custom properties only (D-024).
- Variables: dials `--rp-<name>` (list in D-026); public `--rp-<id>-<name>`; private `--_<name>`; colour slots `--_bg --_fg --_border` (D-024, L4.5).
- CSS MUST NOT select `data-rp-*` (except the script-state rules of section 4) or `data-slot`; a UI SDK state attribute (`data-open`, `data-side`) is selected only together with a component class. JavaScript MUST NOT select classes (D-024, L4.3).
- No Tailwind utility classes in Ripple markup; Tailwind is optional for projects; no `@tailwindcss/browser` (D-024, D-030).
- Layer statement first: `@layer ui-sdk, theme, base, rp, components, rmx, utilities;` then `@layer rp.tokens, rp.base, rp.components, rp.props;` (D-025).
- `css/tokens.css` is the only token source; `theme.css` and `props.css` are generated; colour roles use shadcn names (red is `destructive`); schemes `light`, `dark` via `data-scheme` (D-026, D-027).
- Logical properties only (`inline-start`, never `left`); WCAG 2.2 AA (D-066).
- Every `rp-*` root is `display: block` before upgrade, after upgrade and without scripts (D-080).
- Budget `css-tokens-base`: 2,500 bytes (D-125).

## 9. Files per component (L4.6, L5.1, D-040, D-094)

```text
components/<id>/<id>.json  <id>.css  <id>.test.ts  notes.md (optional)
components/<id>/fixtures/<fixture>.html
components/<id>/html/<id>.html   fixtures delimited by <!-- ripple:fixture <name> -->
components/<id>/react/<id>.tsx   (+ <id>.data.ts: pure data helpers)
components/<id>/remix/<id>.tsx
components/<id>/liquid/blocks/<id>.liquid, blocks/<id>-<part>.liquid
components/<id>/liquid/snippets/rp-<id>.liquid, snippets/rp-<id>-<part>.liquid
```

- Element source: one element per file, `src/elements/<tag>.ts` or `src/commerce/<tag>.ts`, test next to it (L4.6, D-019).
- Per host (D-072): `static` all generated; `native`, `ui`: `react` hand below the generated header, the rest generated; `commerce`: `html` generated from the fixture files, the rest hand.
- Binding paths (D-139): `image rich-text field pagination swatch logo account-link link-list hero footer newsletter-form locale-selector featured-collection header navigation-menu mobile-nav tabs` have no `template`, hand fixtures, `html` from the fixtures, hand bindings; `accordion` has a hand React file. The spec's line wins.
- A `static` component that needs a loop, a derived value or backend tags is hand-written like `commerce`; its spec says so (D-072).
- Hand-written files keep generated regions byte-identical: TSX header; Liquid `{% doc %}`, `{% schema %}`, enum guards (D-072).
- React: `"use client"` if and only if the file calls a hook; such a file exports components and their props types (D-134 item 10); behaviour is wired with `useElement(ref, {props, events})` (D-033, D-094).
- TSX helpers are `rv()` and `cx()` only; sibling imports are `./<id>` in React and `./<id>.tsx` in Remix. Remix bindings are plain server components with `data-rmx-key`, `data-rmx-preserve-attrs` and prop `rmxKey` (D-034, D-035); a bare `data-*`/`aria-*` prints `="true"`, presence attributes `=""`, `popover={true}` (D-133 row 5); Button and IconButton with `tooltip` and no `href` print `data-rmx-preserve-attrs="style"` (D-132).
- Liquid: block files are unprefixed (`blocks/dialog-title.liquid`); snippets are always `rp-<id>`; internal reuse is `{% render 'rp-<id>' %}` (D-037, D-038).
- Liquid: `{% block %}` appears only in templates and layouts; markup is not passed between files with `capture` (exceptions in D-097, D-110) (D-037).
- Liquid: params snake_case, never `true false nil blank empty content block section form settings for`; booleans compared with `== true`; every block has `{% doc %}` and `{% schema %}`; at most 3 schema settings (D-038).
- Icons: 24 fixed names; Liquid `{% render 'rp-icon', name: 'cart' %}`; Liquid tags and filters only from the subset of D-097 (D-068, D-097).
- Blueprints import components as `@components/<id>`; aliases `@components/ @styles/ @public/ @pages/` (D-096, D-101).

## 10. Elements and UI SDK

- Mechanisms: `<dialog>` with Invoker Commands inside `rp-dialog`; `popover`; `<details>`; native form controls; `rp-quantity`, `rp-carousel`, `rp-navigation-menu`; commerce `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`; `rp-view-event` (D-007, D-089).
- An `rp-*` element is written with `definePrimitive` (`@ui-sdk/core`) and `createParts` (`@ui-sdk/web`): root only, parts are `data-rp-part`, `data-slot="<tag>"`, one delegated listener set, DOM read at event time; announcements via `announce(text, {from})` of `src/runtime/announcer.ts` (D-019, D-079).
- UI SDK is pinned to exactly `0.1.0-beta.14`; one copy of `@ui-sdk/core` per page (D-022).
- Dialog: `<rp-dialog class="rp-dialog" data-slot="rp-dialog">` contains one `<dialog id="<id>" class="rp-dialog-panel" aria-labelledby="<id>-title">`. Drawer: same tag, root class `rp-drawer`, panel `rp-drawer-panel`, prop `side` (`start end bottom`, default `end`). Never print `open`; `defaultOpen` prints `data-default-open=""` (D-008).
- Openers are Button or IconButton with `commandFor` + `command`, or a link with prop `dialog` (prints `data-rp-open`) (D-008, D-009).

## 11. Commerce

- Elements reach commerce only through `getCommerce()` (`<pkg>/commerce`) and never branch on backend or host (D-042).
- Form dialects: hydrogen fields `merchandiseId quantity sellingPlanId attributes.<key> intent lineId note discountCode`; liquid fields `id quantity selling_plan properties[<key>] updates[] note attributes[<key>]` (D-043).
- No optimistic structural updates outside React; no client-side templating of commerce markup; the error part is `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` (D-045, L11 item 6).
- Variant, filter and sort are URL-driven through `rp-live`; money is formatted on the server; images use `imageUrl`, `imageSrcSet` (D-047, D-049).
- Hydrogen cart forms post to `cartAction` (`<locale prefix>/api/cart`, D-118); `submitCart` resolves `boolean` (D-126); Liquid `probe` awaits `window.rpDomReady` (D-122).
- The only `@shopify/hydrogen` value imports allowed in bindings and blueprints: `formatMoney renderShopPayButton buildProductSelectionSearchParams parseCollectionParams serializeCollectionParams isFilterInputActive getFilterRemovalUrl` (D-094).

## 12. Fixtures and tests

- Fixture files: `components/<id>/fixtures/<name>.html`; `default` is first; reserved names `default class invalid-enum-falls-back responsive escaping` (D-074).
- Resources are referenced as `{ "$resource": "<type>.<name>" }`, never inlined; a missing one is added under RS-2 (D-074, D-140).
- Canonicalisation is `src/testing/canonicalize.ts` only (D-075). Spec code marked NOT RUN is the required starting text; its gates are normative (D-113).
- Runner: `node:test` via `test/run.ts`; never add `vitest`, `jest`, `mocha`, `@playwright/test`, `jsdom` (D-063; doc 13 R-1).
- Test name pattern: `[T<n>] <subject>: <statement>`; flat `test()` calls, no `describe`; acceptance tests carry `AT-<n>`; a plan name `<prefix> ...` fixes the prefix (D-104, D-141; doc 13 N-1, N-4).

## 13. Commands (D-103; doc 13 §2.3; Node `>=22.18`, CI on Node 24)

Sessions use Node 24.22.3 (`PNPM_HOME`, `pnpm env use --global 24.22.3`; PLAN 3.1, D-136) and export `RIPPLE_NETWORK=1` before `pnpm ci` from M1-T15 on (doc 13 T-5).

- `pnpm install --frozen-lockfile` once per checkout; `pnpm gen` after editing a manifest, `css/tokens.css`, an icon or a locale string; `pnpm build` then `pnpm examples:install` before any tier other than 1; `pnpm test:component --component=<id>` while working; `pnpm ci` last (PLAN 3.1 steps 2 to 6).

## 14. Definition of done

Every task: PLAN 3.1. A component: `docs/13-testing.md` §18.1 read through PLAN 3.2 (D-104).

## 15. Never do

- No shadow DOM, CSS-in-JS, runtime Tailwind, runtime dependency beyond UI SDK and `@shopify/hydrogen` (L11 item 1, D-052).
- No Ajax Cart API, Section Rendering API, sections, JSON templates, theme presets, `{% javascript %}`, `{% stylesheet %}` (L11 item 2).
- No `@ui-sdk/react`, `@ui-sdk/core/web.css`, `@ui-sdk/core/internal/*`, upstream autoloader, or any `ui-*` tag outside Tabs, Tooltip, Toast (D-022).
- No `@remix-run/ui`, `clientEntry`, `on()`, `ref()`, `css()` in Remix bindings (D-034).
- No `CartProvider`, `createProductFormStore`, `createCollectionStore`; no `configureCartEndpoint` on Liquid (D-033, D-041, D-047).
- No ARIA `menu`, `combobox`, `listbox`, custom select, slider, date picker or other widget outside D-007 (L11 item 7, D-018, D-048).
- No per-component colour props, Tabs `orientation="vertical"`, toast actions, tooltip on a link (L11 items 10, 18).
- No customer account UI, checkout UI, consent banner, `ShopPayButton`, subscriptions, B2B, bundles, reviews, wishlists, store locator (L11 items 8, 9, D-050).
- No `checkout` agent action unless SPIKE-08 passes; no checker suppression comments; English only (L11 item 19).
- No edit of `theme/` or `docs/research/` (reference only); no theme-owned JavaScript module in the Ripple theme (L11 items 17, 20).
- No new manifest key, hook attribute, prop name, enum value, rule id or region name without a ledger change (L4.4, L4.8, L6, D-046, D-059).
- No interactive prompt in the CLI; exit codes are 0, 1, 2 (D-057).
