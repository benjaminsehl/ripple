# M5 Chrome components: task detail

Status: detail file for the 15 rows of milestone M5 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no API. Where it fixes a process choice the specs leave open, the choice is marked "Plan reading" and is listed in section 0.9.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and the recipe of your task's kind (PLAN section 5), then section 0 of this file, then ONLY your task's section `## <task id>`. Do not read other task sections. Do not read `docs/plan/M1-golden-path.md`, `docs/plan/M2-foundations.md` or `docs/plan/M3-interactive.md`: every rule you need from them is restated in section 0.

Contents: 0 Rules for every M5 task. Then M5-T01 to M5-T15 in table order.

---

## 0. Rules for every M5 task

### 0.1 Finding what to read

- **M5-R1** Spec files are large. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 9.3 ` in `docs/04-elements.md`) and read up to the next heading of the same or a higher level.
- **M5-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file.
- **M5-R3** "the spec" in a component task is `docs/components/<id>.md`. Its section order is fixed (PLAN 5.1 item 2). The spec's "HTML contract" section is the oracle for every fixture. `docs/12-components-chrome-and-blueprints.md` is "doc 12"; read only the sections a task names.

### 0.2 Values every M5 task uses

| Thing | Value | Source |
|---|---|---|
| Manifest `since` | `"0.1.0"` | `docs/07-manifest-registry-cli.md` section 1.7 |
| Manifest `status` | `"stable"` (all M5 components are kind `static` or `native`) | PLAN 3.2 |
| Render hosts | `html`, `react`, `remix`, `liquid` (Liquid is the shim of `src/testing/liquid-shim.ts`) | CONVENTIONS 1 |
| Bring-up mode | `BRINGUP_SUBSET` is `true` until M5-T14 | PLAN 4.4 |
| Test name | `[T<tier>] <subject>: <ID> <statement>`; flat `test()` from `node:test`; no `describe` | `docs/13-testing.md` section 2.4 |
| Test style | `openPage()` per test, closed in `finally`; no fixed delay except a duration a spec states; last assertion `assert.deepEqual(opened.errors, [])` | `docs/13-testing.md` section 2.5 |
| `[chromium]` tag | allowed only for a Chromium-only API or a computed-style snapshot, with the comment line `// [chromium]: <reason>` above the test. A feature above the browser floor is feature-detected inside the test and the test returns early with a passing assertion; that is not a skip | `docs/13-testing.md` N-2; D-081 |
| Shim globals (Liquid host) | `routes.root_url` `/`, `routes.search_url` `/search`, `routes.account_login_url` `/account/login`; `customer` nil; `linklists['main-menu']` = `menu.main`; `linklists.footer` = `menu.footer`; `shop.policies` empty; `shop.brand.logo` nil | `src/testing/liquid-shim.ts` |

The M5 components are `logo`, `account-link`, `link-list`, `announcement-bar`, `hero`, `footer`, `newsletter-form`, `locale-selector`, `featured-collection`, `navigation-menu`, `mobile-nav`, `header`.

### 0.3 Component tasks

A component task says "Recipe: S" (or N, C, R). Do every step of that recipe in `docs/PLAN.md` section 5, in order. The task section lists only what is specific.

- **M5-R4 Manifest.** Copy every value from the spec: field table, Props, Anatomy, Content model, State and attributes, upgrade allow-list (`upgradeAllow`), Behaviour without JavaScript (`noJs.*`), Accessibility (`a11y.*`), Agent surface (`agent.*`), Checker rules (`rules[]`, see 0.5), fixtures, masks. Use only the manifest key names of ledger section "4.8" (search ``Component: `name` `` in `docs/00-decisions.md`; 3 kB). For the JSON SHAPE of each key copy the same key of an existing entry in the repository: `components/button/button.json` (`liquid.snippet`, `liquid.embeddedBy`, enum props, Liquid settings), `components/dialog/dialog.json` (`state[]`, `events[]`, `upgradeAllow[]`, `rules[]`, `noJs`), `components/price/price.json` (a hand-written component: no `template`, `generated: false`, `{ "$resource": ... }` fixture props, masks). When the spec gives no value for a REQUIRED manifest key, stop guessing: record it under `## Ledger issues` of doc 12, mention it in the pull request, take the smallest value that keeps `pnpm gen --check` green.
- **M5-R5 The hand-written path** (ledger D-072 row 2; `docs/07-manifest-registry-cli.md` section 2.1: "A component that needs more is hand-written"). A task that says "Path: hand-written" does this:
  1. The manifest has NO `template` key (root and parts); every fixture has `"generated": "hand"`; every entry of `files.react`, `files.remix`, `files.liquid` has `"generated": false`.
  2. Write each `components/<id>/fixtures/<name>.html` by hand. Where the spec prints a fenced block for the fixture, copy it. Where the spec describes the fixture as a difference from another ("equal to `default`", "root class is ..."), copy that other fixture and apply exactly the stated difference. A fixture whose reference HTML is "the empty string" is an empty file after the marker line the other fixture files of the repository start with.
  3. Run `pnpm gen` (it writes `html/<id>.html` from the fixture files, and the generated regions of the binding files: the TSX header, the Liquid `{% doc %}` and `{% schema %}` regions, the enum guards). Then write the bindings BELOW the generated regions: PLAN recipe C (section 5.6) steps 2 to 5 without the commerce keys. Where the spec prints complete Liquid or CSS, copy it unchanged.
  4. TSX rules: rest props spread FIRST on the root; helpers `rv()` and `cx()` only; an embedded component is rendered by importing the sibling binding (`../../<embedded id>/react/<embedded id>` in React, the `.tsx` file in Remix; copy the import form of `components/price/react/price.tsx` or of any merged binding that embeds Icon), never by copying its markup; no hook unless the task section names one, so no `"use client"`. Liquid: `{{ attributes }}` LAST in the root's opening tag; embedded components through `{% render 'rp-<id>' %}`; only the Liquid subset of D-097.
  5. Say in the pull request, under "Deviations and ledger issues", that the component is hand-written and why (the sentence the task section gives).
  6. Extra reading on this path: `docs/07-manifest-registry-cli.md` `### 3.3 Generated regions inside hand-written files` (4 kB); `docs/06-bindings.md` `## 3. Generated versus hand-written` (3 kB); repository files `components/price/react/price.tsx`, `components/price/remix/price.tsx`, `components/price/liquid/snippets/rp-price.liquid` (the code pattern).
- **M5-R6 Locale keys.** Add to `locales/en.default.json`, under the top-level key `ripple`, only the keys the task section lists (they are the keys of the spec's Host notes). Keep the file's key order. Never add `ripple.props.*` keys (the generator writes them). List every key a binding reads in `dependencies.locale`. TSX hosts do not read locale files: the English text is the default of the `strings` prop key (doc 12 section 1.4).
- **M5-R7 Embedding** (build check MB-1: `dependencies.embeds` and `liquid.embeddedBy` are inverses). When the task section says "embeddedBy: add `<this id>` to `<x>`": open `components/<x>/<x>.json`, add this component's id to `liquid.embeddedBy` (create the key and the `liquid.snippet` entry in the shape of `components/button/button.json` when absent), add `<x>` to this component's `dependencies.embeds` and `dependencies.components`, run `pnpm gen`, commit the regenerated Liquid files of `<x>`. Change nothing else in `<x>`.
- **M5-R8 Fixture resources** (`docs/02-html-contract.md` F-4: an `object` prop in a fixture is `{ "$resource": "<type>.<name>" }`, never inline data; `docs/13-testing.md` RS-2 to RS-5). Use an existing resource where the task section names one. Where the task section says "new resource", add it in ONE commit of its own, first in the task:
  1. one entry in `RESOURCES` of `src/testing/resources.ts` with the two sides (`hydrogen`, `liquid`) the task section gives, built with the helpers that file already has (`img`, `menu`, `item`, `productResource`, `liquidCollection`);
  2. one row in the resource table of `docs/13-testing.md` section 4.2 (search `**RS-2**`; the table is directly above the rules);
  3. the value under `### 1.6 Fixture resources` of doc 12, in the form the other entries there have;
  4. one line under `## Ledger issues` of doc 12: `<resource name>: name and value supplied by docs/plan/M5-chrome.md (the spec gives the data inline in a fixture description).`
  A prop that only TSX hosts have carries `hosts: ["html", "react", "remix"]` in the manifest; the Liquid adapter then skips it (`docs/13-testing.md` FX-4). A resource of type `cart`, `shop`, `locale` or `search` ALSO replaces the Liquid global `cart`, `shop`, `localization`, `search` for that render (RS-3).
- **M5-R9 Masks** (`docs/02-html-contract.md` F-19). A mask rule with `op` `attr`, `srcset`, `text` or `children` that matches no element in a fixture's reference HTML fails the build. Put such a rule only on the fixtures in which it matches. Rules with `op` `drop-attr` or `remove` go on every fixture the spec's mask list applies to. A fixture that contains another component's subtree copies that component's mask rules (from `components/<embedded id>/<embedded id>.json`) with the same selectors.
- **M5-R10 The `scheme` prop** (AnnouncementBar, Hero, Footer, Header; Plan reading PR-M5-4). Declare `type: "enum"`, `values: ["light", "dark"]`, no `default`, not `required`, Liquid `surface: "param"` (not a schema setting: build check MB-3 rejects a select setting without a default). An unset or unknown value prints no `data-scheme` attribute. If `pnpm gen --check` reports MB-5 for the prop, look for the line `MB-5 accepts an optional enum without default` in `git log --oneline`; when it is absent, stop and open a draft pull request (the change belongs to M2, rule M2-R13a).
- **M5-R11 F-11** (`docs/02-html-contract.md`: every prop has a non-default value in at least one fixture). The specs' fixture lists do not satisfy it for some props (the task section names them). Do NOT add a fixture the spec does not list. If `pnpm gen --check` reports F-11 for a prop the task section names: set the prop on the fixture the task section names with the value it gives (the reference HTML of that fixture then changes as the task section states). If it reports F-11 for any other prop: stop, draft pull request.
- **M5-R12 Generated output that differs from the spec.** A generated file that differs from HTML or code a spec prints is a defect of the manifest first: fix the manifest. An M5 component task MUST NOT change `src/gen/**` or `test/**`. It changes `src/testing/**` only as M5-R8 and its own task section say, and `src/check/rules/RP113.ts` only as 0.5 says. If the generator is wrong: stop, open a draft pull request naming the generator file and the smallest failing manifest. Never edit generated output by hand.
- **M5-R13 Proof commands for a component**, in this order, all exit 0:

  ```bash
  pnpm gen && pnpm typecheck && pnpm gen --check
  pnpm build && pnpm examples:install
  pnpm test:visual --component=<id> --update      # first time only; look at the snapshots, commit them
  pnpm test:component --component=<id> --no-skips
  pnpm test:size
  pnpm ci
  ```

### 0.4 Tests in `components/<id>/<id>.test.ts`

- **M5-R14 Acceptance coverage** (`docs/13-testing.md` section 18.2). The file MUST contain, for every numbered item `n` of the spec's "Acceptance tests", either a test whose name contains `AT-<n> ` or one comment line. The task section says which. Comment forms, exact:

  | Case | Line |
  |---|---|
  | generic tier 2, 3, 4 or 6 matrix | `// AT-<n>: generic (<files>)` with the files that apply out of `test/conformance/conformance.test.ts`, `test/upgrade/upgrade.test.ts`, `test/hydration/react.test.ts`, `test/hydration/remix.test.ts`, `test/nojs/render.test.ts` |
  | the generator check | `// AT-<n>: generic (pnpm gen --check)` |
  | tier 9 | `// AT-<n>: generic (pnpm test:webkit and pnpm test:firefox re-run AT-<a>, AT-<b>)`; the named tests MUST NOT carry `[chromium]` |
  | needs an example application or a blueprint with scripting disabled | `// AT-<n>: generic (test/nojs/blueprints.test.ts NJ-F<k>, added by M7-T25)` with the NJ-F number the task section gives |
  | tier 8 (Liquid live store) | `// AT-<n>: generic (test/liquid/live.test.ts, added by M10-T01)` (Plan reading PR-M5-9) |

  Every other item is a real test, never skipped, never `todo`.
- **M5-R15 Rule tests.** For every manifest `rules[]` entry one test `[T1] <id>: rule <rule id> reports RP113`: run the checker (`src/check/index.ts`, layer H; copy the call from `components/dialog/dialog.test.ts`) on a failing HTML string and assert exactly one diagnostic `RP113` whose message contains `[<rule id>]`. Plus one test `[T1] <id>: default fixture reports no RP113`. The failing string is the `default` fixture with the smallest change that breaks the rule (the task section gives it).
- **M5-R16 Pages that are not a fixture page.** `fixturePageUrl("<id>/<fixture>")` (`test/support/server.ts`) serves one fixture. A test that needs other markup builds its own page: after `const opened = await openPage(...)`, call `opened.page.route("**/*", handler)`. The handler fulfils `GET http://localhost/` with the page HTML string (`content-type: text/html; charset=utf-8`); `GET /ripple.css` with the file `pkg/browser/ripple.css`; any `GET /ripple*.js` with the file of the same name in `pkg/browser/`; everything else with status `404`, unless the task section names a route. Then `await opened.page.goto("http://localhost/")`. A working copy of this handler is in `src/elements/rp-dialog.test.ts`: copy it.
- **M5-R17** The page is `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><link rel="stylesheet" href="/ripple.css"><script type="module" src="/ripple.elements.js"></script></head><body><main id="rp-test-root">…</main></body></html>`. Markup comes from fixture files read at test time (`components/<id>/fixtures/<name>.html`, path relative to `process.cwd()`), with the string replacements the task section states, or from the block of a spec the task names. Never invent component markup. A plain native element with no `rp-` class MAY be added where the task section gives it. A component that MUST be outside `main` (Header, Footer) is placed directly in `<body>`, before or after `<main>`.
- **M5-R18** An image request of a `[T5]` test is fulfilled by the route handler with `content-type: image/svg+xml` and the body `<svg xmlns="http://www.w3.org/2000/svg" width="W" height="H"/>`, W and H being the `width` and `height` attributes of the `<img>` (a missing image has no intrinsic ratio and a `404` puts a message into `opened.errors`).
- **M5-R19** Wait with `page.waitForFunction`, `customElements.whenDefined`, or `settled(page)` of `test/support/browser.ts`. A duration that a spec states ("for 200 ms", "for 400 ms") is one `page.waitForTimeout(<ms>)` with the comment `// duration stated by <spec id>`.
- **M5-R20 Accessible name.** "The computed accessible name is X" is asserted with `await opened.page.getByRole("<role>", { name: "X", exact: true }).count()` equal to `1`.

### 0.5 Component rules (`rules[]`) and `CUSTOM_RULES`

- **M5-R21** Every structure rule of the chrome specs is stated only as a sentence. Such a rule is kind `custom` (ledger D-111; `docs/07-manifest-registry-cli.md` section 9.5.3): the manifest entry has only `id`, `kind: "custom"`, `message`, `fix`; its detection is a function `(root: Element) => Element[]` (the violating elements; an empty array passes) stored under the rule id in `CUSTOM_RULES` of `src/check/rules/RP113.ts`. The component task writes the function: when the key already exists (as a stub that throws), replace its body; otherwise add the key. Implement exactly the detection sentence the task section prints. Use only the element API the other functions in that file use. A rule "at most one per document" returns `[root]` when `root` is not the first element in `root.ownerDocument` that matches the selector, otherwise `[]` (Plan reading PR-M5-5: kind `max-count` counts per root and cannot express it).
- **M5-R22** The specs give no `message` and `fix` text. The task sections print the texts to use. For each rule add one line under `## Ledger issues` of doc 12: `<rule id>: kind custom; message and fix text supplied by docs/plan/M5-chrome.md (spec gives only the detection sentence).`
- **M5-R23** `src/check/rules/RP113.ts` is edited by ten M5 tasks. On a rebase conflict keep both sides' keys.

### 0.6 Shared files that several M5 tasks edit

Edit only the lines your task names. When `git rebase origin/main` conflicts in one of them, keep both sides' lines, run `pnpm gen`, re-run the proof commands.

| File | Rule |
|---|---|
| `locales/en.default.json` | M5-R6 |
| `src/check/rules/RP113.ts` | M5-R21, M5-R23 |
| `src/testing/resources.ts`, `docs/13-testing.md` (resource table), doc 12 (`### 1.6 `, `## Ledger issues`) | M5-R8; tasks M5-T01, M5-T05, M5-T06, M5-T08, M5-T09, M5-T12 |
| `components/<embedded id>/<embedded id>.json` and its generated Liquid files | M5-R7 |
| `src/elements/index.ts` | only M5-T10 (one import line; text fixed by `docs/04-elements.md` section 4.1) |
| `src/runtime/index.test.ts` | only M5-T11 (page P item 10) |
| `src/gen/index.ts`, `src/gen/build.ts`, `src/gen/size.ts`, `src/gen/size.test.ts` | only M5-T14 |
| generated files | never edited by hand; run `pnpm gen` |

A bring-up line in a source file carries the comment `// PLAN 4.4: <what replaces it and which task>`.

### 0.7 Spikes that M5 tasks depend on

| Spike | Report on `main` | Tasks | Rule |
|---|---|---|---|
| SPIKE-07 (popover panels for the desktop menu) | `docs/research/spikes/navigation-menu-popover/README.md` (M1-T43) | M5-T10, M5-T11 | Verdict `DEFAULT holds`: build the default path. Verdict `FALLBACK required`: do not start; a follow-up row applies the spec's "Fallback (SPIKE-07)" first (PLAN 7.2). No report: M1-T43 is not done; pick another task |
| SPIKE-05 (`commandfor` / `command` / `popovertarget` printed unchanged by hosts) | `docs/research/spikes/invoker-commands-hosts/README.md` | M5-T08, M5-T11, M5-T12 | Same three cases. In a fallback verdict only the attribute named by the spec's "Fallback (SPIKE-05)" section changes |

### 0.8 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" in a task section lists what is specific; PLAN section 3.1 (and 3.2 for components) always applies. Do not edit `theme/` or `docs/research/`.

### 0.9 Plan readings made by this file

| # | Topic | Reading |
|---|---|---|
| PR-M5-1 | PLAN's table says "S or C" for the static chrome components; the specs of Logo and AccountLink say "generated from the contract template" | The template language has no `object` prop in scope, no loop, no host-dependent default and no host-only attribute (`docs/07-manifest-registry-cli.md` section 2.3). Only AnnouncementBar is generated (recipe S). Every other M5 component takes the hand-written path M5-R5 |
| PR-M5-2 | PLAN says "N+R" for NavigationMenu and MobileNav | Recipe N for the manifest keys and tests (`state[]`, `upgradeAllow`, tier 3, tier 4); the bindings are hand-written (loops over a menu) |
| PR-M5-3 | Fixture data the specs give inline, which F-4 forbids | New resources added by the component task (M5-R8): `image.logo`, `image.hero`, `menu.policies`, `shop.policies`, `locale.multi-countries`, `locale.multi-languages`, `locale.one-language-countries`, `locale.one-language-languages`, `locale.single-countries`, `locale.single-languages`, `collection.featured`, `collection.featured-empty`, `products.one` |
| PR-M5-4 | `scheme`: the specs list it as an enum with "project scheme names" and no default | M5-R10 |
| PR-M5-5 | Kind, message, fix and "per document" detection of the chrome structure rules | M5-R21, M5-R22 and the texts in the task sections |
| PR-M5-6 | `hero-once` is "warning, not error"; the manifest rule schema has no severity key | Reported as RP113 like every other rule; the Ledger-issues line of M5-R22 for `hero-once` ends with `; spec says warning, no severity key exists.` |
| PR-M5-7 | `featured-collection-carousel-needs-id` is "source layer"; `CUSTOM_RULES` works on HTML | HTML detection in M5-T09 |
| PR-M5-8 | NewsletterForm fixtures `success` and `error` cannot be rendered on Liquid by the conformance adapter (it cannot set `form_state`) | Those two fixtures carry `hosts: ["html", "react", "remix"]`; M5-T07 adds two `[T2]` tests that render the block through the shim with `form_state.customer` set |
| PR-M5-9 | Comment form for tier 8 acceptance items (no precedent) | The last row of the table in M5-R14 |
| PR-M5-10 | Acceptance items that need hydrogen routes of doc 12 sections 2.6 and 2.7 (M7) | The test plays the server with `page.route` (M5-T07 AT-3, AT-4; M5-T08 AT-3); the blueprint is covered by the NJ-F comment the task gives |
| PR-M5-11 | Owner of row E-15 and of the NavigationMenu clauses of E-01, E-18, E-19 (`docs/04-elements.md` section 13) | E-15: M5-T10. Page P item 10 and the clauses: M5-T11 |
| PR-M5-12 | NavigationMenu AT-10 needs two triggers; fixture `default` has one | The test page duplicates the first item of fixture `default` with the id `main-nav-item-2` (M5-T11) |
| PR-M5-13 | AccountLink AT-3 needs a Remix page; the morph test routes exist only for kinds `native`, `ui`, `commerce` | M5-T02 asserts the attribute on the Remix render; the navigation half is recorded as `FOLLOW-UP NEEDED` |
| PR-M5-14 | `mobile-nav-needs-opener` is violated by MobileNav's own fixtures (they contain no opener) | M5-T12: the default-fixture rule test asserts exactly this one diagnostic and that adding the opener removes it |
| PR-M5-15 | A component with a snippet file whose embedder does not exist yet (Logo, AccountLink, LinkList, NavigationMenu) | The component declares `liquid.snippet` itself with an empty `liquid.embeddedBy`; the embedder task fills the list (M5-R7) |
| PR-M5-16 | What M5-T14 removes | Only markers that name M5-T14; build skips owned by other tasks stay |

---

## M5-T01 Logo (`logo`)

- **Goal:** Ship Logo (a home link that shows the shop name as text or as an image) in all four hosts.
- **Depends on:** M1-T07, M2-T32.
- **Kind / recipe:** `static`, Liquid tier `block`. Path: hand-written (M5-R5, PR-M5-1). Reason sentence: `the image prop is an object and the href default differs by host`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/logo.md` | whole file | 7 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.3 `, `### 1.6 ` (only `shop.logo`) | 2 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/image/image.json`, `components/image/react/image.tsx` | how `imageUrl` is imported and how an image mask is written | 4 kB |

### Files

Create by hand: `components/logo/logo.json`, `logo.css`, `logo.test.ts`, `react/logo.tsx`, `remix/logo.tsx`, `liquid/blocks/logo.liquid`, `liquid/snippets/rp-logo.liquid`, `fixtures/default.html`, `image.html`, `invalid-enum-falls-back.html`, `class.html`. Generated (commit): `html/logo.html`, `liquid/locales/logo.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/testing/resources.ts`, `docs/13-testing.md`, doc 12 (M5-R8).

### Steps

1. Branch `task/M5-T01-logo`.
2. New resource (M5-R8) `image.logo`: both sides are the existing constant `LOGO` of `src/testing/resources.ts` (`"image.logo": LOGO`). Value: url `https://cdn.shopify.com/s/files/1/0000/0001/files/logo.png`, altText null, width 400, height 100.
3. Manifest (M5-R4, M5-R5). Props `href` (url), `image` (object), `size` (enum `sm`, `md`, `lg`, default `md`, prints `data-size`, Liquid setting). Part `image` (`img`, class `rp-logo-image`, printed by the component). `upgradeAllow` `[]`. `liquid.snippet` declared, `liquid.embeddedBy` `[]` (PR-M5-15).
4. Fixtures (4, hand): copy the two fenced blocks of the spec; `invalid-enum-falls-back` equals `default`; `class` is `default` with root class `rp-logo custom-a custom-b`. Fixture `image` props: `image: { "$resource": "image.logo" }`, `size: "lg"`, `href: "/fr-ca"`, children `Mock Shop`. Mask `{ "select": "img", "op": "attr", "name": "src" }` on fixture `image` only (M5-R9).
5. CSS: copy the block of the spec's `### Styling`.
6. Bindings, below the generated regions. TSX: `href` default `/`; with `image`: the `img` (src `imageUrl(image.url, { width: 400 })`, `alt=""`, intrinsic `width` and `height`, no `loading`) followed by the children inside the VisuallyHidden markup the fixture prints (`<span class="rp-visually-hidden">`); without `image`: the children. Liquid: the block and snippet as the spec's Host notes state; `href` default `routes.root_url`; `image` default `shop.brand.logo`; the content is TEXT and is printed with `| escape`.
7. Tests, then M5-R13 with `<id>` = `logo`.

### Names and values

- Locale key: `ripple.logo.name`.
- F-11 (M5-R11): none expected (`href`, `image`, `size` are set in fixture `image`).
- Trap: on Liquid the fixture `default` has no `image` prop; the shim's `shop.brand.logo` is nil, so no image is printed. Do not pass `shop.logo` in `default`.
- Rules: none (`rules: []`).

### Tests (`components/logo/logo.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (`test/conformance/conformance.test.ts`) |
| AT-2 | `[T5] logo: AT-2 ...` on `fixturePageUrl("logo/image")`, image request per M5-R18 (W 400, H 100): image height 40, width 160 |
| AT-3 | `[T5] logo: AT-3 ...`: M5-R20 with role `link`, name `Mock Shop`, on fixture `image` |
| rules | `[T1] logo: default fixture reports no RP113` |

### Acceptance

M5-R13. `ls components/logo/fixtures | wc -l` prints `4`. `grep -c '"template"' components/logo/logo.json` prints `0`. `grep -c 'loading=' components/logo/fixtures/image.html` prints `0`.

### Out of scope

Header. A `width` prop. Reading `shop` in TSX (the caller passes `image`).

### If blocked

`pnpm gen --check` rejects a declared snippet with an empty `embeddedBy` (a message naming MB-1 or `embeddedBy`): keep the snippet FILE, remove the `liquid.snippet` declaration, make the block print the markup itself, and write `FOLLOW-UP NEEDED: M5-T13 declares the logo snippet` in the done file. `fixturePageUrl` cannot attach the M5-R18 route: use an M5-R16 page built from `fixtures/image.html`.

---

## M5-T02 AccountLink (`account-link`)

- **Goal:** Ship AccountLink (a link to the account page with an icon and a label) in all four hosts.
- **Depends on:** M1-T03, M2-T32.
- **Kind / recipe:** `static`, Liquid tier `block`. Path: hand-written (M5-R5, PR-M5-1). Reason sentence: `the href default differs by host and Remix prints data-rmx-document`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/account-link.md` | whole file | 7 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/icon/icon.json`; one merged binding that embeds Icon, for example `components/quantity-input/react/quantity-input.tsx` | how Icon is embedded | 4 kB |

### Files

Create by hand: `components/account-link/account-link.json`, `account-link.css`, `account-link.test.ts`, `react/account-link.tsx`, `remix/account-link.tsx`, `liquid/blocks/account-link.liquid`, `liquid/snippets/rp-account-link.liquid`, `fixtures/default.html`, `icon-only.html`, `class.html`. Generated (commit): `html/account-link.html`, `liquid/locales/account-link.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `components/icon/icon.json` and its regenerated Liquid files (M5-R7).

### Steps

1. Branch `task/M5-T02-account-link`.
2. Manifest. Props `href` (url), `iconOnly` (boolean, Liquid param `icon_only`, prints `data-icon-only=""`). Part `label` (`span`, class `rp-account-link-label`). embeddedBy: add `account-link` to `icon` (M5-R7). `liquid.snippet` declared, `liquid.embeddedBy` `[]` (PR-M5-15). `upgradeAllow` `[]`.
3. Fixtures (3, hand): the two fenced blocks; `class` is `default` with root class `rp-account-link custom-a custom-b`. Mask `{ "select": "a.rp-account-link", "op": "attr", "name": "href" }` on all three.
4. CSS from the spec.
5. Bindings. TSX `href` default `/account`. Remix additionally prints `data-rmx-document` on the root (write it as the spec's Host notes print it; the HTML contract does not contain it, so check how `test/conformance/` treats `data-rmx-*` attributes by running step 6 before changing anything). Liquid `href` default: `routes.account_url` when `customer` is set, otherwise `routes.account_login_url`. Icon name `account`. Children default: the locale key `ripple.account-link.label`.
6. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.account-link.name`, `ripple.account-link.label` ("Account").
- F-11: none expected.

### Tests (`components/account-link/account-link.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] account-link: AT-2 ...` on fixture `icon-only`: link box 44 by 44, `.rp-account-link-label` box 1 by 1, M5-R20 role `link` name `Account` |
| AT-3 | `[T4] account-link: AT-3 the Remix link carries data-rmx-document` (PR-M5-13): render fixture `default` with the Remix render function that `test/conformance/conformance.test.ts` uses for the host `remix`; assert the output string contains `data-rmx-document` on the `a.rp-account-link` tag |
| rules | `[T1] account-link: default fixture reports no RP113` |

### Acceptance

M5-R13. `grep -c 'data-rmx-document' components/account-link/remix/account-link.tsx` prints at least `1`. `grep -c 'data-rmx-document' components/account-link/react/account-link.tsx` prints `0`. The done file contains the line `FOLLOW-UP NEEDED: account-link AT-3 "document navigation, no X-Remix-Frame request" needs a route in examples/remix; no task provides one.`

### Out of scope

A logged-in state, a customer name, a menu. Routes in `examples/remix`.

### If blocked

Tier 2 fails on Remix because of `data-rmx-document`: do not add a mask and do not remove the attribute; draft pull request quoting the diff (the conformance harness must ignore `data-rmx-*`; that is a defect of M1-T02).

---

## M5-T03 LinkList (`link-list`)

- **Goal:** Ship LinkList (a labelled `nav` that lists the top-level links of a menu) in all four hosts.
- **Depends on:** M2-T32.
- **Kind / recipe:** `static`, Liquid tier `resource`; recipe C steps for the bindings plus R. Path: hand-written (M5-R5). Reason sentence: `the body is a loop over an object prop`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/link-list.md` | whole file | 9 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.2 `, `### 1.6 ` (the four `menu.*` resources) | 4 kB |
| `docs/PLAN.md` | `### 5.7 ` (recipe R) | 2 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `src/check/rules/RP113.ts` | whole file | 5 kB |

### Files

Create by hand: `components/link-list/link-list.json`, `link-list.css`, `link-list.test.ts`, `react/link-list.tsx`, `remix/link-list.tsx`, `liquid/blocks/link-list.liquid`, `liquid/snippets/rp-link-list.liquid`, and six fixture files `default`, `current`, `skips-items-without-url`, `invalid-enum-falls-back`, `escaping`, `class`. Generated (commit): `html/link-list.html`, `liquid/locales/link-list.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, doc 12 `## Ledger issues`.

### Steps

1. Branch `task/M5-T03-link-list`.
2. Manifest. Props `id`, `menu` (object), `links` (object, `hosts: ["liquid"]`), `ariaLabel` (default `{ "t": "ripple.link-list.label" }`), `orientation` (enum `vertical`, `horizontal`, default `vertical`, prints `data-orientation`, Liquid setting). Parts `list`, `item`, `link` as the Anatomy table. `liquid.snippet` declared, `embeddedBy` `[]` (PR-M5-15). `upgradeAllow` `[]`.
3. Fixtures (6, hand). Resources, all existing: `menu.footer` (`default`, `invalid-enum-falls-back`), `menu.main` (`current`), `menu.deep` (`skips-items-without-url`), `menu.empty` (`escaping`, `class`). No masks.
4. Liquid: copy the complete snippet `rp-link-list.liquid` of the spec unchanged; the block renders the snippet. TSX: render one `item` per top-level menu item whose `url` is not null; `aria-current="page"` when `current`.
5. Rule function and texts (0.5). CSS from the spec. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.link-list.name`, `ripple.link-list.label` ("Links").
- Rule `link-list-not-in-nav`. Detection: `.rp-link-list` MUST NOT have a `nav` ancestor; the function returns `[root]` when `root.parentElement?.closest("nav")` is not null. Message `A LinkList is inside a nav element.` Fix `Move the LinkList out of the nav element; LinkList prints its own nav.` Failing string: the `default` fixture wrapped in `<nav aria-label="x">…</nav>`.
- F-11 (M5-R11): `links` has no fixture. If reported: stop (a Liquid-only array of `{title, url}` has no resource; needs Ben).
- Trap: on Liquid a link without URL has `url` `#` (rule MN-1 of doc 12); the spec's snippet skips it. Do not change the snippet.

### Tests (`components/link-list/link-list.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T5] link-list: AT-3 ...`, viewport 1280 by 800: fixture `current` (horizontal): the two links have equal `top`; fixture `default` (vertical): equal `left` |
| AT-4 | `[T5] link-list: AT-4 ...` on fixtures `default` and `current`: every `a.rp-link-list-link` box at least 24 by 24 |
| rules | one M5-R15 test plus the default-fixture test |

### Acceptance

M5-R13. `ls components/link-list/fixtures | wc -l` prints `6`. `grep -c 'rp-link-list-item' components/link-list/fixtures/skips-items-without-url.html` prints `0`.

### Out of scope

Nested lists (LinkList prints top-level items only). Footer. `shop.policies` handling (M5-T06).

### If blocked

`pnpm gen --check` rejects a prop with `hosts: ["liquid"]` only: draft pull request quoting the message; do not remove the `links` param from the snippet (Footer needs it).

---

## M5-T04 AnnouncementBar (`announcement-bar`)

- **Goal:** Ship AnnouncementBar (a labelled region with one line of text) in all four hosts, generated from the contract template.
- **Depends on:** M2-T32.
- **Kind / recipe:** `static`, Liquid tier `block`; recipe S. All bindings generated.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/announcement-bar.md` | whole file | 6 kB |
| `docs/07-manifest-registry-cli.md` | `### 2.3 ` (template forms) | 6 kB |
| repository: `components/button/button.json`; `src/check/rules/RP113.ts` | a template manifest; the rule functions | 8 kB |

### Files

Create: `components/announcement-bar/announcement-bar.json`, `announcement-bar.css`, `announcement-bar.test.ts`. Generated (commit): `fixtures/*.html` (4), `html/announcement-bar.html`, `react/announcement-bar.tsx`, `remix/announcement-bar.tsx`, `liquid/blocks/announcement-bar.liquid`, `liquid/locales/announcement-bar.json`, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, doc 12 `## Ledger issues`.

### Steps

1. Branch `task/M5-T04-announcement-bar`. Recipe S.
2. Manifest. Props `scheme` (M5-R10), `ariaLabel` (string, default `{ "t": "ripple.announcement-bar.label" }`). Template root: `div`, attributes in this order: `class`, `role` (literal `region`), `aria-label`, `data-scheme`; one child `p` with class `rp-announcement-bar-inner` holding the children. `upgradeAllow` `[]`.
3. Fixtures (4), all `generated: "template"`: `default` (children `Free shipping over $50`), `scheme` (`scheme: "dark"`), `escaping` (`ariaLabel: "Say \"hi\" & <go>"`), `class` (`class: "custom-a custom-b"`); the last three have the same children.
4. CSS from the spec. `pnpm gen`. Compare `fixtures/default.html`, `scheme.html`, `escaping.html` with the three fenced blocks of the spec (canonical equality).
5. Rule function and texts. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.announcement-bar.name`, `ripple.announcement-bar.label` ("Announcement").
- Rule `announcement-bar-not-empty`. Detection: `.rp-announcement-bar-inner` MUST have non-whitespace text; the function returns the `.rp-announcement-bar-inner` elements inside `root` whose `textContent` is empty after trimming. Message `An AnnouncementBar has no text.` Fix `Pass the text as the children of AnnouncementBar, or do not render it.` Failing string: the `default` fixture with the text removed.

### Tests (`components/announcement-bar/announcement-bar.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generator-check form of M5-R14 |
| AT-3 | `[T5] announcement-bar: AT-3 ...`: viewports 375 by 667 and 1280 by 800; root width equals `document.documentElement.clientWidth`; computed `text-align` of `.rp-announcement-bar-inner` is `center` |
| rules | one M5-R15 test plus the default-fixture test |

### Acceptance

M5-R13. `grep -c '"template"' components/announcement-bar/announcement-bar.json` prints at least `1`. `grep -c 'data-scheme' components/announcement-bar/fixtures/default.html` prints `0`.

### Out of scope

A dismiss button, a link prop, rotation of messages, `aria-live`.

### If blocked

MB-5 on `scheme`: M5-R10. MB-3 or another check rejects an enum prop with `surface: "param"`: declare `scheme` as `type: "string"` printed as `data-scheme` when not blank (Container of M2 does this; copy the prop entry of `components/container/container.json` when it has `scheme`), record one Ledger-issues line in doc 12.

---

## M5-T05 Hero (`hero`)

- **Goal:** Ship Hero (a page-top section with optional background image and a content column) in all four hosts.
- **Depends on:** M2-T32.
- **Kind / recipe:** `static`, Liquid tier `block`. Path: hand-written (M5-R5, PR-M5-1). Reason sentence: `the image prop is an object and its src and srcset are derived values`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/hero.md` | whole file | 10 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/image/image.json`, `components/image/react/image.tsx`, `components/image/liquid/blocks/image.liquid`; `src/check/rules/RP113.ts` | `imageUrl`, `imageSrcSet`, the Liquid `image_url` form, mask shapes | 9 kB |

### Files

Create by hand: `components/hero/hero.json`, `hero.css`, `hero.test.ts`, `react/hero.tsx`, `remix/hero.tsx`, `liquid/blocks/hero.liquid`, and five fixture files `default`, `image`, `invalid-enum-falls-back`, `escaping`, `class`. Generated (commit): `html/hero.html`, `liquid/locales/hero.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, `src/testing/resources.ts`, `docs/13-testing.md`, doc 12.

### Steps

1. Branch `task/M5-T05-hero`.
2. New resource (M5-R8) `image.hero`: `img("https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg", null, 2400, 1200)`.
3. Manifest. Props `image` (object), `alt` (string, default `""`), `size` (enum `sm`, `md`, `lg`, `full`, default `md`), `align` (enum `start`, `center`, `end`, default `start`), `scheme` (M5-R10). `size` and `align` print `data-size`, `data-align` (default printed) and are Liquid settings. Parts `media`, `image`, `content` as the Anatomy table. `upgradeAllow` `[]`.
4. Fixtures (5, hand). `default`: the fenced block. `image`: the fenced block; props `image: { "$resource": "image.hero" }`, `alt: "Model wearing a linen shirt"`, `size: "lg"`, `align: "center"`, `scheme: "dark"`. `invalid-enum-falls-back` (`size: "huge"`) equals `default`. `escaping`: fixture `image` with `alt: "Say \"hi\" & <go>"`. `class`: `default` with root class `rp-hero custom-a custom-b`. Masks `{ "select": "img", "op": "attr", "name": "src" }` and `{ "select": "img", "op": "srcset", "name": "srcset" }` on `image` and `escaping` only.
5. Bindings: the image rules of the spec (`src` width 1600; `srcset` widths 800, 1200, 1600, 2400; `sizes="100vw"`; intrinsic `width`, `height`; `loading="eager"`, `fetchpriority="high"`). The `media` part is printed only when `image` is set. CSS from the spec.
6. Rule function and texts. Tests, then M5-R13.

### Names and values

- Locale key: `ripple.hero.name`.
- Rule `hero-once` (PR-M5-6). Detection: more than one `.rp-hero` with an image in a document; the function returns `[root]` when `root` contains `.rp-hero-image` and `root` is not the first `.rp-hero` in `root.ownerDocument` that contains `.rp-hero-image`. Message `A document has more than one Hero with an image.` Fix `Keep the image on the first Hero only; two images with fetchpriority="high" compete.` Failing string: the `image` fixture twice.
- F-11: none expected.

### Tests (`components/hero/hero.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] hero: AT-2 ...`: M5-R16 page with fixture `default` in which `data-size="md"` is replaced by `data-size="full"`; viewports 375 by 667 and 1280 by 800; root height within 1 px of `window.innerHeight` |
| AT-3 | `[T5] hero: AT-3 ...` on fixture `image` (M5-R18, W 2400, H 1200): left and right offsets of the first child of `.rp-hero-content` inside the root differ by at most 1 px |
| AT-4 | `[T5] hero: AT-4 ...` on fixture `image` (M5-R18): the four box values of `img` equal the root's within 0.5 px |
| AT-5 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| rules | one M5-R15 test plus the default-fixture test |

### Acceptance

M5-R13. `ls components/hero/fixtures | wc -l` prints `5`. `grep -c 'fetchpriority="high"' components/hero/fixtures/image.html` prints `1`. `grep -c 'rp-hero-media' components/hero/fixtures/default.html` prints `0`.

### Out of scope

Video backgrounds, a `focalPoint` prop, a heading or button prop (content is children), art direction with `<picture>`.

### If blocked

The Liquid shim has no `image_url` filter form the block needs: draft pull request naming the filter call; do not print a hand-built URL. `scheme`: as M5-T04 "If blocked".

---

## M5-T06 Footer (`footer`)

- **Goal:** Ship Footer (the page `footer` landmark with a default body of menu, copyright line and policy links) in all four hosts.
- **Depends on:** M2-T32, M5-T03.
- **Kind / recipe:** `static`, Liquid tier `resource`; recipe C steps plus R. Path: hand-written (M5-R5). Reason sentence: `the default body embeds LinkList with object props`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/footer.md` | whole file | 11 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.1 `, `### 1.3 `, `### 1.4 `, `### 1.5 ` | 5 kB |
| `docs/PLAN.md` | `### 5.7 ` | 2 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/link-list/link-list.json`, `components/link-list/react/link-list.tsx`, `components/link-list/liquid/snippets/rp-link-list.liquid`; `src/check/rules/RP113.ts`; `src/testing/resources.ts` (the `menu`, `item` helpers and the `shop.*` entries) | | 12 kB |

### Files

Create by hand: `components/footer/footer.json`, `footer.css`, `footer.test.ts`, `react/footer.tsx`, `remix/footer.tsx`, `liquid/blocks/footer.liquid`, `liquid/snippets/rp-footer.liquid`, and five fixture files `default`, `default-body`, `policies`, `scheme`, `class`. Generated (commit): `html/footer.html`, `liquid/locales/footer.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, `src/testing/resources.ts`, `docs/13-testing.md`, doc 12, `components/link-list/link-list.json` and its regenerated Liquid files.

### Steps

1. Branch `task/M5-T06-footer`.
2. New resources (M5-R8):
   - `menu.policies`: `menu("gid://shopify/Menu/4", [item(6, "Privacy policy", "/policies/privacy-policy")])`.
   - `shop.policies`: `hydrogen` side equal to the `hydrogen` side of `shop.basic`; `liquid` side `{ name: "Mock Shop", brand: { logo: null }, policies: [{ title: "Privacy policy", url: "/policies/privacy-policy" }] }`.
3. Manifest. Props `scheme` (M5-R10), `menu` (object), `policies` (object, `hosts: ["html", "react", "remix"]`), `shop` (object, `hosts: ["html", "react", "remix"]`), `year` (number), `linkList` (id, Liquid param `link_list`, default `footer-menu`), `strings` (object, `hosts: ["html", "react", "remix"]`). Parts `inner`, `bottom`, `copyright`. embeddedBy: add `footer` to `link-list` (M5-R7). `upgradeAllow` `[]`.
4. Fixtures (5, hand): the fenced blocks of the spec. Props: `default` children `<p>Contact us</p>`; `default-body` `menu: { "$resource": "menu.footer" }`, `shop: { "$resource": "shop.basic" }`, `year: 2026`; `policies` as `default-body` with `shop: { "$resource": "shop.policies" }` and `policies: { "$resource": "menu.policies" }`; `scheme` (`scheme: "dark"`, children as `default`); `class`. No masks.
5. Liquid: copy the default body of `snippets/rp-footer.liquid` from the spec unchanged (it reads `shop`, uses `date: '%Y'` and passes `links: shop.policies` to `rp-link-list`). The fixture `year: 2026` is passed as the param `year`. TSX: the default body renders the sibling LinkList binding twice (menu: `id` = `linkList`, `ariaLabel` = `strings.menu`, vertical; policies, only when `policies` has items: `ariaLabel` = `strings.policies`, horizontal). The copyright text is the `strings.copyright` pattern with `year` and `shop.name` (`© 2026 Mock Shop`).
6. Rule functions and texts. CSS from the spec. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.footer.name`, `ripple.footer.menu` ("Footer"), `ripple.footer.policies` ("Policies"), `ripple.footer.copyright` ("© {{ year }} {{ name }}").
- Rules (2). `footer-once`: at most one `.rp-footer` per document (M5-R21 last sentence). Message `A document has more than one Footer.` Fix `Render Footer once, in the layout.` Failing string: the `default` fixture twice. `footer-outside-main`: `.rp-footer` MUST NOT have a `main` ancestor; returns `[root]` when `root.closest("main")` is not null. Message `A Footer is inside the main element.` Fix `Move the Footer after the main element.` Failing string: `<main>` + the `default` fixture + `</main>`.
- F-11 (M5-R11): `linkList`, `strings`. If reported for `linkList`: set `linkList: "site-links"` on fixture `policies` (its menu `nav` then has `id="site-links"`). If reported for `strings`: stop.
- UNVERIFIED: that the Liquid adapter binds the global `shop` from a `shop.*` resource whose prop is not passed to Liquid (RS-3 with FX-4). See "If blocked".

### Tests (`components/footer/footer.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | comment, NJ-F form with `NJ-F14` |
| AT-4 | `[T5] footer: AT-4 ...`: M5-R16 page, viewport 1280 by 800; `<main>` holds `components/container/fixtures/default.html` (a Container with `width="page"`: check its `data-width`; when the default is another width, replace the attribute value by `page`); the `default` fixture of Footer directly in `<body>` after `<main>`; left and right of `.rp-footer-inner` equal those of the Container within 0.5 px |
| rules | two M5-R15 tests plus the default-fixture test |

### Acceptance

M5-R13. `ls components/footer/fixtures | wc -l` prints `5`. `grep -c 'id="footer-menu"' components/footer/fixtures/default-body.html` prints `1`. `grep -c '"footer"' components/link-list/link-list.json` prints at least `1`.

### Out of scope

LocaleSelector, NewsletterForm or payment icons inside the default body (the spec's default body has none). The `layout` blueprint (M7).

### If blocked

Fixture `policies` fails on Liquid because `shop.policies` is not bound as the global: draft pull request naming `renderLiquidCase` in `src/testing/` and RS-3; mark the fixture `hosts: ["html", "react", "remix"]` only if Ben says so. The page-level checker of tier 2 reports `footer-outside-main` on a fixture page: the fixture page wraps fixtures in `<main>`; draft pull request (the rule or the page must change; needs a ledger line).

---

## M5-T07 NewsletterForm (`newsletter-form`)

- **Goal:** Ship NewsletterForm (an email field, a submit button and a status message that work as a plain form post) in all four hosts.
- **Depends on:** M1-T01, M1-T06, M2-T11, M2-T32.
- **Kind / recipe:** `static`, Liquid tier `resource`; recipe C steps plus R. Path: hand-written (M5-R5). Reason sentence: `the message depends on status and the Liquid body is a form tag`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/newsletter-form.md` | whole file | 12 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.1 `, `### 1.4 `; in `## 3.` only row X-5 | 4 kB |
| `docs/PLAN.md` | `### 5.7 ` | 2 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/input/input.json`, `components/button/button.json`, `components/form-message/form-message.json`; `src/testing/liquid-shim.ts` (search `form_state`); `src/check/rules/RP113.ts` | | 10 kB |

### Files

Create by hand: `components/newsletter-form/newsletter-form.json`, `newsletter-form.css`, `newsletter-form.test.ts`, `react/newsletter-form.tsx`, `remix/newsletter-form.tsx`, `liquid/blocks/newsletter-form.liquid`, and four fixture files `default`, `success`, `error`, `class`. Generated (commit): `html/newsletter-form.html`, `liquid/locales/newsletter-form.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, doc 12 `## Ledger issues`, `components/button/button.json` and `components/input/input.json` with their regenerated Liquid files.

### Steps

1. Branch `task/M5-T07-newsletter-form`.
2. Manifest. `root.requiresId` true. Props `id` (required), `action` (url), `status` (enum `idle`, `success`, `error`, default `idle`, prints no attribute), `defaultValue` (string), `strings` (object); `action`, `status`, `defaultValue`, `strings` carry `hosts: ["html", "react", "remix"]`. Part `row`. embeddedBy: add `newsletter-form` to `button` and to `input` (M5-R7). `dependencies.components` additionally lists `form-message` when the Liquid block prints its markup directly. `upgradeAllow` `[]`.
3. Fixtures (4, hand): the fenced blocks of the spec; all have `id: "newsletter"`, `action: "/api/newsletter"`. `success` and `error` carry `hosts: ["html", "react", "remix"]` (PR-M5-8). The five mask rules of the spec on every fixture (M5-R9: the two `op: "attr"` rules match in all four).
4. Liquid: copy the complete block body of the spec unchanged (`{% form 'customer' %}`, field `contact[email]`, hidden `contact[tags]`). TSX: `<form method="post" action={action}>`; field name `email`; `status` chooses the FormMessage (`success`: tone `success`, `role="status"`; `error`: the message with id `<id>-error`, and the input gets `aria-invalid="true"` and `aria-describedby`).
5. Rule function and texts. CSS from the spec. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.newsletter-form.name`, `.email` ("Email address"), `.submit` ("Subscribe"), `.success` ("Thanks for subscribing."), `.error` ("Enter a valid email address.").
- Rule `newsletter-form-not-in-form`. Detection: `.rp-newsletter-form` MUST NOT have a `form` ancestor; returns `[root]` when `root.parentElement?.closest("form")` is not null. Message `A NewsletterForm is inside another form.` Fix `Move the NewsletterForm out of the form; forms cannot be nested.` Failing string: `<form>` + the `default` fixture + `</form>` parsed as the checker parses it; when the HTML parser drops the nested form and no diagnostic comes out, build the failing tree with the DOM API the tests of `src/check/rules/RP113.test.ts` use.
- F-11 (M5-R11): `strings`. If reported: stop.
- Shim form state (doc 12 X-5): the scope variable `form_state.customer` with the keys `posted`, `errors`, `email`.

### Tests (`components/newsletter-form/newsletter-form.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance), plus two real tests (PR-M5-8): `[T2] newsletter-form: AT-1 liquid prints the success markup when the form was posted` and `[T2] newsletter-form: AT-1 liquid prints the error markup when the form has errors`: render `liquid/blocks/newsletter-form.liquid` through the shim (the render call `test/conformance/` uses for the host `liquid`) with `form_state: { customer: { posted: true, errors: null, email: "" } }` and `{ customer: { posted: false, errors: ["email"], email: "not-an-email" } }`; apply the fixture masks; compare with `fixtures/success.html` and `fixtures/error.html` (canonical equality, the comparison function the conformance test uses) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T6] newsletter-form: AT-3 ...` (PR-M5-10), `openPage({ scripts: "disabled" })`, M5-R16 page with fixture `default`; extra routes: `POST /api/newsletter` answers `303` with `location: /?subscribed=1#newsletter`; `GET /?subscribed=1` answers the page with fixture `success`. Type `shopper@example.com`, press the button; assert the selector of the spec and that the URL ends with `#newsletter`. Second line: comment, NJ-F form with `NJ-F15`, written as `// AT-3 (blueprint): generic (...)` |
| AT-4 | `[T6] newsletter-form: AT-4 ...`: same page; `POST /api/newsletter` answers `200` with the page holding fixture `error`; assert `aria-invalid="true"` and that the id in `aria-describedby` resolves |
| AT-5 | `[T6] newsletter-form: AT-5 ...`: count requests to `/api/newsletter` after pressing the button with an empty field; expect `0` |
| AT-6 | comment, tier 8 form |
| rules | one M5-R15 test plus the default-fixture test |

### Acceptance

M5-R13. `grep -c "contact\[email\]" components/newsletter-form/liquid/blocks/newsletter-form.liquid` prints at least `1`. `grep -c 'name="email"' components/newsletter-form/fixtures/default.html` prints `1`.

### Out of scope

The route `/api/newsletter` of the examples (doc 12 section 2.7, M7). Client-side submission, `rp-*` elements, a consent checkbox.

### If blocked

`pnpm gen --check` rejects `hosts` on a fixture record: remove the key from the two fixtures and mark them in the pull request; then tier 2 fails for `liquid` on `success` and `error`; open a draft pull request (needs a ledger line: PR-M5-8). The shim's `{% form 'customer' %}` does not read `form_state.customer`: defect of the shim (doc 12 X-5), draft pull request.

---

## M5-T08 LocaleSelector (`locale-selector`)

- **Goal:** Ship LocaleSelector (a popover with one submit button per country and per language, posting a plain form) in all four hosts.
- **Depends on:** M1-T01, M1-T03, M2-T32, M3-T01.
- **Kind / recipe:** `static`, Liquid tier `resource`; recipe C steps plus R. Path: hand-written (M5-R5). Reason sentence: `the body is two loops over object props and the Liquid body is a form tag`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/locale-selector.md` | whole file | 18 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.1 `, `### 1.4 `, `### 1.6 ` (only `locale.multi`) | 4 kB |
| `docs/PLAN.md` | `### 5.7 ` | 2 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/popover/popover.json`, `components/popover/remix/popover.tsx` (how `popover` is printed in Remix); `components/button/button.json`; `src/testing/resources.ts` (the entry `locale.multi`); `src/check/rules/RP113.ts` | | 10 kB |
| `docs/research/spikes/invoker-commands-hosts/README.md` | `## Verdict` | 1 kB |

### Files

Create by hand: `components/locale-selector/locale-selector.json`, `locale-selector.css`, `locale-selector.test.ts`, `react/locale-selector.tsx`, `remix/locale-selector.tsx`, `liquid/blocks/locale-selector.liquid`, and five fixture files `default`, `countries-only`, `single-locale`, `invalid-enum-falls-back`, `class`. Generated (commit): `html/locale-selector.html`, `liquid/locales/locale-selector.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, `src/testing/resources.ts`, `docs/13-testing.md`, doc 12, `components/button/button.json` and `components/icon/icon.json` with their regenerated Liquid files.

### Steps

1. Branch `task/M5-T08-locale-selector`.
2. New resources (M5-R8, PR-M5-3). One resource feeds one prop, so each scenario is a pair whose `liquid` sides are IDENTICAL (the whole `localization` stand-in; type `locale` replaces the global `localization`, RS-3) and whose `hydrogen` sides are the `countries` array and the `languages` array. Data: CA = `{ code: "CA", name: "Canada", currency: "CAD $", current: true }`, US = `{ code: "US", name: "United States", currency: "USD $", current: false }`, EN = `{ code: "EN", name: "English", current: true }`, FR = `{ code: "FR", name: "français", current: false }`.

   | Resource | `hydrogen` side | `liquid` side |
   |---|---|---|
   | `locale.multi-countries` | `[CA, US]` | the `liquid` side of `locale.multi` |
   | `locale.multi-languages` | `[EN, FR]` | the `liquid` side of `locale.multi` |
   | `locale.one-language-countries` | `[CA, US]` | the `liquid` side of `locale.multi` with `available_languages` holding only the `en` entry |
   | `locale.one-language-languages` | `[EN]` | the same |
   | `locale.single-countries` | `[CA]` | the `liquid` side of `locale.multi` with `available_countries` holding only CA and `available_languages` holding only `en` |
   | `locale.single-languages` | `[EN]` | the same |

3. Manifest. `root.requiresId` true. Props `id`, `countries`, `languages`, `action` (default `/api/locale`), `returnTo`, `side` (enum `top`, `bottom`, `start`, `end`, default `bottom`), `align` (enum `start`, `center`, `end`, default `start`), `strings`; `countries`, `languages`, `action`, `returnTo`, `strings` carry `hosts: ["html", "react", "remix"]`. `side`, `align` print `data-side`, `data-align` on the panel and are Liquid settings. Parts as the Anatomy table. embeddedBy: add `locale-selector` to `button` and to `icon` (M5-R7). `upgradeAllow` `[]`.
4. Fixtures (5, hand). `default` (`id: "footer-locale"`, `countries` = `locale.multi-countries`, `languages` = `locale.multi-languages`, `returnTo: "/"`): the fenced block. `countries-only` (the `one-language` pair, `side: "top"`, `align: "end"`): built from `default` by the stated differences (opener text `Canada (CAD $)`; only the country heading and list). `single-locale` (the `single` pair): empty. `invalid-enum-falls-back` (`side: "left"`): equals `default`. `class`: `default` with root class `rp-locale-selector custom-a custom-b`. Masks: the five rules of the spec on `default`, `countries-only`, `invalid-enum-falls-back`, `class`; on `single-locale` only the `drop-attr` and `remove` rules (M5-R9).
5. Liquid: copy the complete block body of the spec unchanged (`{% form 'localization' %}`). TSX: a group is printed when its array has more than one entry; nothing at all is printed when neither group is; opener text per the spec's "Opener text rule"; the form `<form method="post" action={action}>` with the hidden input `return_to`; Remix prints `data-rmx-document` on the form and the `popover` attribute the way `components/popover/remix/popover.tsx` prints it.
6. Rule function and texts. CSS from the spec. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.locale-selector.name`, `.country` ("Country/region"), `.language` ("Language").
- Rule `locale-selector-not-in-form`. Detection: `.rp-locale-selector` MUST NOT have a `form` ancestor; returns `[root]` when `root.parentElement?.closest("form")` is not null. Message `A LocaleSelector is inside a form.` Fix `Move the LocaleSelector out of the form; it prints its own form.` Failing tree: as M5-T07 (nested forms: build with the DOM API when the parser drops the inner form).
- F-11 (M5-R11): `action`, `align`, `strings`. `align` is set in `countries-only`. If reported for `action`: set `action: "/locale"` on fixture `class` (the reference HTML does not change under the `action` mask; check that the `html` fixture file prints `action="/locale"`). If reported for `strings`: stop.
- Field values: hydrogen backend `country_code` = `CA`, `locale_code` = `FR`; Liquid `locale_code` = `fr` (masked).

### Tests (`components/locale-selector/locale-selector.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T6] locale-selector: AT-3 ...` (PR-M5-10), `scripts: "disabled"`, M5-R16 page with fixture `default`; extra routes: `POST /api/locale` answers `303` with `location: /en-us`; `GET /en-us` answers `200` with a page holding `<p>ok</p>`. First statement: when `!("popover" in HTMLElement.prototype)`, assert the option is visible in flow and continue. Open the panel, press `United States (USD $)`; assert the captured POST body contains `country_code=US` and `return_to=`, and the final URL path is `/en-us`. Second line: `// AT-3 (blueprint): generic (...)` in the NJ-F form with `NJ-F16` |
| AT-4 | comment, tier 8 form |
| AT-5 | `[T5] locale-selector: AT-5 ...` on fixture `default`: M5-R20 role `button`, name `Canada (CAD $) / English`; the current options have `aria-current="true"` |
| AT-6 | `[T5] locale-selector: AT-6 ...`: open the panel; every `.rp-locale-selector-option` box at least 24 px high |
| rules | one M5-R15 test plus the default-fixture test |

### Acceptance

M5-R13. `ls components/locale-selector/fixtures | wc -l` prints `5`. The file `components/locale-selector/fixtures/single-locale.html` contains no element (`grep -c '<div' ...` prints `0`). `grep -c 'name="country_code"' components/locale-selector/fixtures/default.html` prints `2`.

### Out of scope

The route `/api/locale` of the examples (doc 12 section 2.6, M7). A `<select>` variant, flags, currency conversion, auto-submit on change.

### If blocked

SPIKE-05: section 0.7. `pnpm gen --check` rejects two fixture props that resolve to resources with the same Liquid global: draft pull request naming RS-3 (the pair model is PR-M5-3). The accessible name of AT-5 differs because the icon contributes text: the Icon MUST be `aria-hidden`; fix the binding, not the test.

---

## M5-T09 FeaturedCollection (`featured-collection`)

- **Goal:** Ship FeaturedCollection (a titled section that shows a collection's products in a Grid or a Carousel, with a "View all" link) in all four hosts.
- **Depends on:** M1-T05, M2-T03, M2-T32, M3-T09, M4-T03.
- **Kind / recipe:** `static`, Liquid tier `resource`; recipe C steps plus R. Path: hand-written (M5-R5). Reason sentence: `the default body is a loop over products that embeds ProductCard, Grid and Carousel`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/featured-collection.md` | whole file | 15 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.1 `, `### 1.4 ` | 3 kB |
| `docs/PLAN.md` | `### 5.7 ` | 2 kB |
| M5-R5 item 6 files | | 12 kB |
| repository: `components/product-card/product-card.json` (masks, `liquid.snippet`), `components/product-card/fixtures/default.html`, `components/carousel/carousel.json` (`upgradeAllow`, `liquid`), `components/carousel/fixtures/default.html`, `components/carousel/liquid/` (file list), `components/grid/grid.json`; `src/testing/resources.ts` (`collection.basic`, `productResource`, `liquidCollection`); `src/check/rules/RP113.ts` | | 20 kB |

### Files

Create by hand: `components/featured-collection/featured-collection.json`, `featured-collection.css`, `featured-collection.test.ts`, `react/featured-collection.tsx`, `remix/featured-collection.tsx`, `liquid/blocks/featured-collection.liquid`, and seven fixture files `default`, `default-body`, `carousel`, `empty`, `invalid-enum-falls-back`, `responsive`, `class`. Generated (commit): `html/featured-collection.html`, `liquid/locales/featured-collection.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, `src/testing/resources.ts`, `docs/13-testing.md`, doc 12, `components/product-card/product-card.json` and `components/carousel/carousel.json` with their regenerated Liquid files.

### Steps

1. Branch `task/M5-T09-featured-collection`.
2. New resources (M5-R8, PR-M5-3):
   - `collection.featured`: `hydrogen` side = the `hydrogen` side of `collection.basic` with `title` `Featured` and `url` `/collections/featured`; `liquid` side = the `liquid` side of `collection.basic` with `title` `Featured`, `url` `/collections/featured` and `products` holding only the Liquid form of `product.basic`.
   - `collection.featured-empty`: the same with `products` `[]` on the `liquid` side.
   - `products.one`: `hydrogen` side `[<hydrogen side of product.basic>]`; `liquid` side `[<liquid side of product.basic>]` (never read: the prop is TSX-only).
3. Manifest. Props `collection` (object, required), `products` (object, `hosts: ["html", "react", "remix"]`), `limit` (number, default `4`), `layout` (enum `grid`, `carousel`, default `grid`, prints `data-layout`, Liquid setting), `columns` (scale, responsive, default `2 lg:4`), `carousel` (id), `level` (enum `1` to `6`, default `2`), `strings` (object, TSX hosts). Parts `header`, `title`, `link` as the Anatomy table. `dependencies.embeds` `["grid", "product-card", "carousel"]`; `dependencies.components` additionally `link`. embeddedBy: add `featured-collection` to `product-card` and to `carousel` (doc 12 X-1). Add it to `grid` too ONLY when `pnpm gen --check` reports MB-1 for `grid`; say so in the pull request. `upgradeAllow` `[]` (see the trap on AT-2).
4. Fixtures (7, hand): the fenced blocks of the spec. Props: `default` (`collection` = `collection.featured`, children `<p>Item</p>`); `default-body` (`collection.featured`, `products` = `products.one`, `level: 3`, `columns: "2 md:3"`); `carousel` (`collection.featured`, `products.one`, `layout: "carousel"`, `carousel: "featured"`); `empty` (`collection` = `collection.featured-empty`, no `products`, no children; empty file); `invalid-enum-falls-back` (`layout: "masonry"`), `responsive` (`columns: "1 sm:2 lg:4"`), `class`: children as `default`. The ProductCard subtree of `default-body` and `carousel` is a copy of `components/product-card/fixtures/default.html`; the Carousel markup of `carousel` is `components/carousel/fixtures/default.html` with the id `featured`, the `aria-label` `Featured` and one item. Masks: ProductCard's mask rules on `default-body` and `carousel` only (M5-R9).
5. Liquid: the block as the spec's Host notes state. The grid default body is printed in the spec ("Liquid default body for the grid layout"): copy it. The carousel branch is NOT printed in the spec: write it so that its output equals fixture `carousel`, rendering `rp-carousel` with the params that `components/carousel/liquid/` files document in their `{% doc %}` region and `rp-product-card` per item; when the Carousel snippet cannot take item markup, print the Carousel markup directly from the fixture structure and record one Ledger-issues line in doc 12. TSX: `products.slice(0, limit)`; nothing is printed when there are no children and no products; the title tag is `h<level>`.
6. Rule function and texts. CSS from the spec. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.featured-collection.name`, `ripple.featured-collection.view_all` ("View all").
- Rule `featured-collection-carousel-needs-id` (PR-M5-7). Detection in HTML: a root with `data-layout="carousel"` that contains no `.rp-carousel` element with a non-empty `id`; returns `[root]`. Message `A FeaturedCollection with the carousel layout has no carousel id.` Fix `Pass the carousel prop (an id that is unique in the document).` Failing string: fixture `carousel` with ` id="featured"` removed from the Carousel root.
- F-11 (M5-R11): `limit`, `strings`. If reported for `limit`: set `limit: 1` on fixture `default-body` (reference HTML unchanged: one product). If reported for `strings`: stop.
- Trap, AT-2: the generic tier 3 test applies only THIS component's `upgradeAllow` to fixture `carousel`, which contains `rp-carousel`. When `pnpm test:upgrade --grep="featured-collection/"` fails on mutations inside `rp-carousel`: copy the entries of `components/carousel/carousel.json` `upgradeAllow` into this manifest's `upgradeAllow` with the same selectors, and say so in the pull request.

### Tests (`components/featured-collection/featured-collection.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T5] featured-collection: AT-3 ...`: M5-R16 page from fixture `default` with the string `<p>Item</p>` replaced by four copies of itself; viewports 375 by 667 and 1280 by 800; count the distinct `left` values of the four paragraphs: 2, then 4 |
| AT-4 | `[T6] featured-collection: AT-4 ...`, `scripts: "disabled"`, viewport 375 by 667: M5-R16 page from fixture `carousel` with the one `li.rp-carousel-item` repeated six times (M5-R18 for the product images); the viewport part has `scrollWidth > clientWidth`; both control buttons have computed `visibility: hidden` |
| AT-5 | `[T6] featured-collection: AT-5 ...`, `scripts: "disabled"`, fixture `default-body` in an M5-R16 page; route `GET /collections/featured` answers `200`; click `.rp-featured-collection-link`; the URL path is `/collections/featured` |
| rules | one M5-R15 test plus the default-fixture test |

### Acceptance

M5-R13. `ls components/featured-collection/fixtures | wc -l` prints `7`. `grep -c 'data-columns="2 lg:4"' components/featured-collection/fixtures/default.html` prints `1`. `grep -c 'rp-carousel' components/featured-collection/fixtures/default.html` prints `0`.

### Out of scope

Fetching products (the caller passes them). A "quick add" on the card. Any prop passed to ProductCard other than `product`. The `home` blueprint.

### If blocked

`components/product-card/` or `components/carousel/` is missing: a dependency (M4-T03, M3-T09) is not done; pick another task. The Liquid carousel branch cannot equal the fixture: draft pull request with the diff (the spec prints no Liquid for it).

---

## M5-T10 Element `rp-navigation-menu`

- **Goal:** Add the custom element `rp-navigation-menu` (hover intent and arrow keys for popover submenus) and its test.
- **Depends on:** M1-T43.
- **Kind / recipe:** `element`; recipe E (PLAN 5.5).

### Read first

| File | Section | Size |
|---|---|---|
| `docs/04-elements.md` | `## 7. ` (rules R-1 to R-17) | 6 kB |
| `docs/04-elements.md` | `### 9.3 ` | 10 kB |
| `docs/04-elements.md` | `### 10.15 `; in `## 13. ` only the paragraph that defines page P and row `E-15` | 4 kB |
| `docs/04-elements.md` | `### 4.1 ` (the block "`src/elements/index.ts` (complete)") | 2 kB |
| `docs/research/spikes/navigation-menu-popover/README.md` | `## Verdict` and the list of checks | 3 kB |
| repository: `src/elements/rp-carousel.ts`, `src/elements/rp-carousel.test.ts`, `src/elements/index.ts`, `src/gen/elements.json` | | 14 kB |

### Files

Create: `src/elements/rp-navigation-menu.ts`, `src/elements/rp-navigation-menu.test.ts`. Change: `src/elements/index.ts` (one import line). Change only when the entry is absent: `src/gen/elements.json` (the `rp-navigation-menu` entry, in the shape of the `rp-carousel` entry: display `block`, api `["close"]`).

### Steps

1. Branch `task/M5-T10-rp-navigation-menu`. Check the SPIKE-07 verdict (section 0.7).
2. `src/elements/rp-navigation-menu.ts`: copy the block "`src/elements/rp-navigation-menu.ts` (complete)" of section 9.3 unchanged. Where an import path of the block does not resolve, use the path `src/elements/rp-carousel.ts` uses for the same name.
3. `src/elements/index.ts`: add `import "./rp-navigation-menu"` as the LAST of the four `import "./rp-<name>"` lines (order of section 4.1: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`). When all four lines now exist, delete the comment line `// PLAN 4.4: each rp-* element task adds its import "./rp-<name>" line here ...`. Then compare the file with the block of section 4.1: no other difference is allowed.
4. Tests (below). Proof:

   ```bash
   pnpm typecheck && pnpm build
   pnpm test:run --tiers=3,5 --files=src/elements/rp-navigation-menu --no-skips
   pnpm test:size
   pnpm ci
   ```

### Tests (`src/elements/rp-navigation-menu.test.ts`)

Page: M5-R16 with `<main>` holding the HTML block of `docs/04-elements.md` section 10.15, copied into the test file as a string constant with the comment `// markup: docs/04-elements.md 10.15`. No component CSS exists yet; do not add a `<style>`.

| Id | Form |
|---|---|
| E-15 | `[T5] rp-navigation-menu: E-15 hover, arrow keys, the disclosure button and api.close() open and close the panel`: every action and every expected result of row E-15, in the row's order. First statement: when `!("popover" in HTMLElement.prototype)`, assert the panel is in flow and return. Durations 200 ms and 300 ms per M5-R19 (`// duration stated by E-15`). The last clause (no attribute inside the element changed; no `openchange`, `valuechange`, `indexchange` event) uses a `MutationObserver` and three listeners installed before the first action |
| none | `[T3] rp-navigation-menu: upgrade writes nothing` (the pattern of the `[T3]` test in `src/elements/rp-carousel.test.ts`, with an empty allow-list) |
| none | `[T5] rp-navigation-menu: api.close() with no open panel does nothing and throws nothing` |

No test carries `[chromium]`.

### Acceptance

The commands of step 4 exit 0. `grep -c 'import "./rp-navigation-menu"' src/elements/index.ts` prints `1`. `grep -c "PLAN 4.4" src/elements/index.ts` prints `0`. `grep -rn "E-15 " src/ | wc -l` prints at least `1`. The gzip size of `pkg/browser/ripple.elements.js` printed by `pnpm test:size` is in the done file.

### Out of scope

The component `navigation-menu` (M5-T11), its CSS, page P (M5-T11). The SPIKE-07 fallback behaviour (`aria-expanded` toggling). Changing `OPEN_DELAY` (120) or `CLOSE_DELAY` (250).

### If blocked

SPIKE-07: section 0.7. `pnpm test:size` fails for `ripple.elements.js`: do not raise a budget; draft pull request with the measured size. A clause of E-15 fails with the copied source: do not change the source; draft pull request naming the clause (the source of 9.3 is normative and was run in the spike).

---

## M5-T11 NavigationMenu (`navigation-menu`)

- **Goal:** Ship NavigationMenu (the desktop main navigation with popover submenus, upgraded by `rp-navigation-menu`) in all four hosts.
- **Depends on:** M1-T03, M2-T32, M5-T10.
- **Kind / recipe:** `native`, Liquid tier `resource`; recipe N for manifest keys and tests, R; bindings hand-written (M5-R5, PR-M5-2). Reason sentence: `the body is a nested loop over a menu and panel ids are derived from the position`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/navigation-menu.md` | whole file | 27 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.2 ` | 2 kB |
| `docs/PLAN.md` | `### 5.3 ` (recipe N), `### 5.7 ` | 4 kB |
| `docs/04-elements.md` | in `## 13. `: the definition of page P and rows `E-01`, `E-18`, `E-19` | 3 kB |
| `docs/13-testing.md` | `### 9.2 ` (Remix morph test) | 2 kB |
| M5-R5 item 6 files (skip `docs/06-bindings.md` section 3 when over budget) | | 9 kB |
| repository: `components/carousel/carousel.json` (a `native` manifest), `src/runtime/index.test.ts` (page P), `src/check/rules/RP113.ts`, `docs/research/spikes/navigation-menu-popover/README.md` (`## Verdict`) | | 12 kB |

### Files

Create by hand: `components/navigation-menu/navigation-menu.json`, `navigation-menu.css`, `navigation-menu.test.ts`, `react/navigation-menu.tsx`, `remix/navigation-menu.tsx`, `liquid/blocks/navigation-menu.liquid`, `liquid/snippets/rp-navigation-menu.liquid`, and five fixture files `default`, `deep`, `empty`, `escaping`, `class`. Generated (commit): `html/navigation-menu.html`, `liquid/locales/navigation-menu.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, doc 12 `## Ledger issues`, `components/icon/icon.json` and its regenerated Liquid files, `src/runtime/index.test.ts`.

### Steps

1. Branch `task/M5-T11-navigation-menu`. Check SPIKE-07 and SPIKE-05 (section 0.7).
2. Manifest. `kind` `native`; `root.elements` `rp-navigation-menu`, class `rp-navigation-menu`, `requiresId` true; the root prints `data-slot="rp-navigation-menu"`. Props `id`, `menu` (object), `ariaLabel` (default `{ "t": "ripple.navigation-menu.label" }`), `strings` (object, TSX hosts). Parts as the Anatomy table (`list`, `item` with `data-rp-part="item"`, `link`, `trigger`, `content`, `sublist`, `subitem`, `sublink`). `state[]`, `upgradeAllow`, `noJs` (level `degraded`), `agent` (surface `bridge`, action `close`) as the spec. `dependencies.elements` `["rp-navigation-menu"]`. embeddedBy: add `navigation-menu` to `icon` (M5-R7). `liquid.snippet` declared, `embeddedBy` `[]` (PR-M5-15).
3. Fixtures (5, hand): the fenced blocks. All use `id: "main-nav"`. Resources (existing): `menu.main` (`default`), `menu.deep` (`deep`), `menu.empty` (`empty`, `escaping`, `class`). No masks.
4. CSS: the spec's `### Styling`: every required rule 1 to 7, with the three branches of D-114 exactly as printed. Do not simplify the `@supports` blocks of rule 5 (AT-11 removes them by text).
5. Liquid: copy the complete snippet `rp-navigation-menu.liquid` of the spec unchanged; the block renders it. React: no hook, no `"use client"`; `suppressHydrationWarning` where the spec's Host notes print it. Remix: `data-rmx-key={id}` on the root; `popover` printed as `components/popover/remix/popover.tsx` prints it. Panel id `<id>-item-<n>`, `<n>` the 1-based position of the top-level item. Trigger `aria-label`: the `strings.submenu` pattern with the item title (`Shop submenu`); a group item without URL prints the trigger with the visible title and no `aria-label` (fixture `deep`).
6. Rule functions and texts.
7. Page P (PR-M5-11), in `src/runtime/index.test.ts`: append the content of `components/navigation-menu/fixtures/default.html` as item 10 of page P; add `rp-navigation-menu` to the zero-mutation list of the `E-01` test; in the `E-18` test assert `display: block` for `rp-navigation-menu` and `display: none` for its closed `[popover]`; in the `E-19` test add the clause "the NavigationMenu disclosure button opens its panel" (skipped inside the test when `!("popover" in HTMLElement.prototype)`). Delete the three "NavigationMenu omitted" comments there.
8. Tests, then M5-R13, then `pnpm test:run --files=src/runtime/index.test.ts --no-skips`.

### Names and values

- Locale keys: `ripple.navigation-menu.name`, `ripple.navigation-menu.label` ("Main"), `ripple.navigation-menu.submenu` ("{{ title }} submenu").
- Rules (3), detection sentences of the spec:
  - `navigation-menu-item-in-list`: returns every `[data-rp-part="item"]` inside `root` whose parent is not a `.rp-navigation-menu-list`. Message `A NavigationMenu item is not a child of the list.` Fix `Put every item directly inside the element with the class rp-navigation-menu-list.` Failing string: fixture `default` with one item wrapped in a `<div>`.
  - `navigation-menu-content-in-item`: returns every `.rp-navigation-menu-content` inside `root` without an ancestor `.rp-navigation-menu-item`. Message `A NavigationMenu panel is outside an item.` Fix `Put the panel inside the item whose trigger opens it.` Failing string: fixture `default` with the panel moved to directly before `</rp-navigation-menu>`. (That string also breaks the third rule; the test of THIS rule filters the diagnostics by `[navigation-menu-content-in-item]` and expects one.)
  - `navigation-menu-trigger-targets-content`: returns every `.rp-navigation-menu-trigger[popovertarget]` whose value is not the `id` of a `.rp-navigation-menu-content` inside the same `.rp-navigation-menu-item`. Message `A NavigationMenu trigger does not name the panel of its own item.` Fix `Set popovertarget to the id of the panel in the same item.` Failing string: fixture `default` with `popovertarget="main-nav-item-9"`.
- F-11 (M5-R11): `strings`. If reported: stop.

### Tests (`components/navigation-menu/navigation-menu.test.ts`)

Every `[T5]` test starts with: when `!("popover" in HTMLElement.prototype)`, assert `getComputedStyle(content).position === "static"` and return.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T5] navigation-menu: AT-3 ...` on fixture `default`; durations 200 ms and 400 ms (M5-R19). No `[chromium]` |
| AT-4 | `[T5] navigation-menu: AT-4 ...`: fixture `default`; the RTL half on `fixturePageUrl("navigation-menu/default", { dir: "rtl" })`. No `[chromium]` |
| AT-5 | `[T5] navigation-menu: AT-5 ...`. No `[chromium]` |
| AT-6 | `[T6] navigation-menu: AT-6 ...`, `scripts: "disabled"`, M5-R16 page with fixture `default`; route `GET /collections/all` answers `200`; the trigger half only when `"popover" in HTMLElement.prototype`. No `[chromium]` |
| AT-7 | `[T4] navigation-menu: AT-7 ...` on `/__rp/morph/a?c=navigation-menu` and `/__rp/morph/b?c=navigation-menu` (`startExample("remix")`, `docs/13-testing.md` 9.2): open the panel by a click on the trigger, follow the link to the other route, assert `#main-nav-item-1` still matches `:popover-open` and no console error |
| AT-8 | `[T5] navigation-menu: AT-8 ...` on fixtures `default` and `deep`: every `.rp-navigation-menu-trigger` and `.rp-navigation-menu-link` box at least 24 by 24 |
| AT-9 | comment, tier 9 form naming AT-3, AT-4, AT-5, AT-6 |
| AT-10 | `[T5] [chromium] navigation-menu: AT-10 ...` with `// [chromium]: anchor positioning of the panel is asserted in Chromium only (spec AT-10)`. Page (PR-M5-12): fixture `default` in which the first `<li class="rp-navigation-menu-item" …>…</li>` is inserted a second time directly after itself, the copy having `main-nav-item-1` replaced by `main-nav-item-2` and `aria-current="page"` removed. Three sub-cases (click, hover 200 ms, ArrowDown) on the SECOND trigger; close the panel between them |
| AT-11 | `[T5] [chromium] navigation-menu: AT-11 ...` with `// [chromium]: emulates a browser without the popover API (spec AT-11)`. `page.addInitScript` registers a `MutationObserver` on `document` that removes the `popover` attribute from every added `.rp-navigation-menu-content`; the route handler serves `/ripple.css` with the two `@supports` blocks of rule 5 removed (find each block by its prelude after stripping whitespace from both the file and the prelude; remove through the matching closing brace by counting braces; assert in the test that exactly two blocks were removed). Fixture `default` |
| AT-12 | `[T5] navigation-menu: AT-12 ...` |
| rules | three M5-R15 tests plus the default-fixture test |
| generic | the generic `[T4] navigation-menu: remix morph keeps state, instance and listeners` of `test/hydration/remix.test.ts` MUST pass (it registers itself for kind `native`) |

### Acceptance

M5-R13. `pnpm test:hydration --grep="navigation-menu" --no-skips` passes. `grep -c "NavigationMenu omitted\|NavigationMenu clause omitted" src/runtime/index.test.ts` prints `0`. `ls components/navigation-menu/fixtures | wc -l` prints `5`. `grep -c 'aria-expanded' components/navigation-menu/fixtures/default.html` prints `0`.

### Out of scope

`src/elements/rp-navigation-menu.ts` (M5-T10; do not edit). Mega-menu content, images in panels, a `Header`. The SPIKE-07 fallback contract.

### If blocked

SPIKE-07, SPIKE-05: section 0.7. `src/runtime/index.test.ts` does not exist (M3-T10 not merged; the PLAN table gives no such dependency): skip step 7, write `FOLLOW-UP NEEDED: page P item 10 and the NavigationMenu clauses of E-01, E-18, E-19` in the done file. The morph routes do not render `navigation-menu`: defect of the `RIPPLE_TEST_ROUTES` contract in `examples/remix` (`docs/13-testing.md` 12.1 item 6); draft pull request. AT-10 fails by more than 1 px: do not change the tolerance; the three D-114 branches are the fix; draft pull request with the three measured values.

---

## M5-T12 MobileNav (`mobile-nav`)

- **Goal:** Ship MobileNav (the navigation Drawer: a modal `dialog` with the menu as links and `details` groups) in all four hosts.
- **Depends on:** M1-T03, M1-T04, M1-T18, M2-T32.
- **Kind / recipe:** `native`, Liquid tier `resource`; recipe N for manifest keys and tests, R; bindings hand-written (M5-R5, PR-M5-2). Reason sentence: `the body is a nested loop over a menu`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/mobile-nav.md` | whole file | 22 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.2 `, `### 1.5 ` | 3 kB |
| `docs/PLAN.md` | `### 5.3 `, `### 5.7 ` | 4 kB |
| `docs/13-testing.md` | `### 9.2 ` | 2 kB |
| M5-R5 item 6: only `docs/07-manifest-registry-cli.md` `### 3.3 ` | | 4 kB |
| repository: `components/drawer/drawer.json`, `components/drawer/react/drawer.tsx`, `components/drawer/remix/drawer.tsx`, `components/drawer/drawer.test.ts`; `components/accordion/react/accordion.tsx` (how `<details open>` is hydrated); `src/testing/resources.ts` (the helper `links`); `src/check/rules/RP113.ts`; `docs/research/spikes/invoker-commands-hosts/README.md` (`## Verdict`) | | 22 kB |

### Files

Create by hand: `components/mobile-nav/mobile-nav.json`, `mobile-nav.css`, `mobile-nav.test.ts`, `react/mobile-nav.tsx`, `remix/mobile-nav.tsx`, `liquid/blocks/mobile-nav.liquid`, and five fixture files `default`, `deep`, `empty`, `invalid-enum-falls-back`, `class`. Generated (commit): `html/mobile-nav.html`, `liquid/locales/mobile-nav.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, doc 12 `## Ledger issues`, `src/testing/resources.ts` (one helper, step 2), `components/icon/icon.json` and `components/icon-button/icon-button.json` with their regenerated Liquid files.

### Steps

1. Branch `task/M5-T12-mobile-nav`. Check SPIKE-05 (section 0.7).
2. `src/testing/resources.ts`: the Liquid snippet of the spec reads `link.child_current` ("a descendant is current"). When the helper `links` does not set it, add the field: `child_current` is `true` when any descendant item has `current: true`. Run `pnpm gen && pnpm test:conformance --no-skips`; no fixture of another component may change (`git status --porcelain components/` lists only `components/mobile-nav/`). Commit alone as `M5-T12: liquid menu links carry child_current`. Add one line under `## Ledger issues` of `docs/13-testing.md`: `links(): child_current added by M5-T12 (docs/components/mobile-nav.md reads it).`
3. Manifest. `kind` `native`; `root.elements` `rp-dialog`; root classes `rp-drawer rp-mobile-nav`; `requiresId` true. Props `id`, `menu` (object), `side` (enum `start`, `end`, default `start`, prints `data-side` on the panel, Liquid setting), `strings` (object, TSX hosts). `state[]`, `events[]` (`openchange` / `onOpenChange`), `upgradeAllow`, `noJs`, `agent`: the values of the spec (they follow `components/drawer/drawer.json`). `dependencies.elements` `["rp-dialog"]`. embeddedBy: add `mobile-nav` to `icon` and to `icon-button` (M5-R7). `dependencies.components` additionally lists `drawer` (its CSS classes are used; MobileNav prints the Drawer markup itself and does not embed the Drawer binding unless the spec's Host notes say it does).
4. Fixtures (5, hand): the fenced blocks. All use `id: "mobile-nav"`. Resources: `menu.main` (`default`, `invalid-enum-falls-back`, `class`), `menu.deep` (`deep`, with `side: "end"`), `menu.empty` (`empty`). `invalid-enum-falls-back` has `side: "left"`. No masks. The dialog carries `closedby="any"` and never `open`.
5. Liquid: copy the complete block body of the spec unchanged. React: the file starts with `"use client";` and calls `useElement(ref, { events: { openchange: onOpenChange } })` as the spec's Host notes print; `<details>` groups follow the pattern of `components/accordion/react/accordion.tsx` for the `open` attribute. Remix: `data-rmx-key={id}` and `data-rmx-preserve-attrs="open"` where the spec prints them. TSX computes "a descendant is current" by walking `items`. The closer is the IconButton with `commandfor="<id>"` and `command="close"`.
6. Rule functions and texts. CSS from the spec. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.mobile-nav.name`, `ripple.mobile-nav.title` ("Menu"), `ripple.mobile-nav.close` ("Close").
- Opener used by tests (not part of any fixture; a plain native element, M5-R17): `<a href="#footer-menu" data-rp-open="mobile-nav">Menu</a>`. Fragment target: `<p id="footer-menu">Footer menu</p>`.
- Rules (2):
  - `mobile-nav-once`: at most one `.rp-mobile-nav` per document (M5-R21 last sentence). Message `A document has more than one MobileNav.` Fix `Render MobileNav once, in the layout.` Failing string: the opener, then fixture `default`, then fixture `default` with every `mobile-nav` id replaced by `mobile-nav-2`.
  - `mobile-nav-needs-opener`: a document that contains `.rp-mobile-nav dialog#X` contains `a[data-rp-open="X"][href]`; returns `[root]` when the dialog inside `root` has an id `X` and `root.ownerDocument` has no `a[href]` whose `data-rp-open` equals `X`. Message `A MobileNav has no opener link.` Fix `Add a link with data-rp-open set to the MobileNav id and an href that works without JavaScript.` Failing string: fixture `default` alone.
- PR-M5-14: instead of `[T1] mobile-nav: default fixture reports no RP113` write `[T1] mobile-nav: default fixture reports only mobile-nav-needs-opener, and none with an opener`: the fixture alone gives exactly one RP113 (`[mobile-nav-needs-opener]`); the opener line followed by the fixture gives none.
- F-11 (M5-R11): `strings`. If reported: stop.

### Tests (`components/mobile-nav/mobile-nav.test.ts`)

Page for AT-3 to AT-7 and AT-9: M5-R16 with `<main>` holding the opener, fixture `default`, `<div style="height:2000px"></div>`, the fragment target.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T5] mobile-nav: AT-3 ...`. No `[chromium]` |
| AT-4 | `[T5] mobile-nav: AT-4 ...` (listener on the root; `detail.value`) |
| AT-5 | `[T5] mobile-nav: AT-5 ...`: the page with `<html dir="ltr">`, then with `<html dir="rtl">` |
| AT-6 | `[T6] mobile-nav: AT-6 ...`, `scripts: "disabled"`: `location.hash` is `#footer-menu`; `dialog#mobile-nav` has no `open`; the fragment target's box intersects the viewport. Second line: `// AT-6 (blueprint): generic (...)` in the NJ-F form with `NJ-F14` |
| AT-7 | `[T6] mobile-nav: AT-7 ...`, `scripts: "blocked"` (filter the aborted-request messages as `test/nojs/render.test.ts` does) |
| AT-8 | React half: comment, generic (`test/hydration/react.test.ts`). Remix half: `[T4] mobile-nav: AT-8 ...` on `/__rp/morph/a?c=mobile-nav` and `/__rp/morph/b?c=mobile-nav`: open with `dialog.showModal()` in `page.evaluate`, activate the link to the other route with `element.click()` in `page.evaluate`, assert `dialog#mobile-nav` has no `open` attribute. When `components/drawer/drawer.test.ts` has a `[T4]` morph test, copy its mechanics |
| AT-9 | `[T5] mobile-nav: AT-9 ...`: open the drawer; every `.rp-mobile-nav-link` and `.rp-mobile-nav-trigger` box at least 44 px high |
| rules | `[T1] mobile-nav: rule mobile-nav-once reports RP113` (filter by `[mobile-nav-once]`), `[T1] mobile-nav: rule mobile-nav-needs-opener reports RP113`, and the PR-M5-14 test |

### Acceptance

M5-R13. `pnpm test:hydration --grep="mobile-nav" --no-skips` passes. `ls components/mobile-nav/fixtures | wc -l` prints `5`. `grep -c ' open' components/mobile-nav/fixtures/deep.html` prints at least `1` (the group `Clothing` is open because a descendant is current). `grep -c '<dialog[^>]* open' components/mobile-nav/fixtures/default.html` prints `0`.

### Out of scope

A `defaultOpen` prop, `side="bottom"`, search or account links inside the drawer, the Header opener (M5-T13), changes to `rp-dialog`.

### If blocked

SPIKE-05 fallback verdict: the closer additionally carries `data-rp-close="<id>"` (spec "Fallback (SPIKE-05)"); nothing else changes. A generic test (tier 1 fixture lint or tier 2 page check) reports `mobile-nav-needs-opener` on a fixture file: draft pull request (PR-M5-14 needs a ledger line: either the rule runs only on documents, or the fixtures gain an opener). A hydration warning on `<details open>`: the fix is in `react/mobile-nav.tsx`, following Accordion; never add an entry to `test/hydration/react-allow.ts`.

---

## M5-T13 Header (`header`)

- **Goal:** Ship Header (the page `header` landmark whose default body composes the menu opener, Logo, NavigationMenu, search link, AccountLink and CartLink) in all four hosts.
- **Depends on:** M1-T03, M1-T04, M1-T34, M2-T32, M5-T01, M5-T02, M5-T11.
- **Kind / recipe:** `static`, Liquid tier `resource`; recipe C steps plus R. Path: hand-written (M5-R5; the spec says so). Reason sentence: `the default body embeds components of kinds native and commerce`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/header.md` | whole file | 21 kB |
| `docs/12-components-chrome-and-blueprints.md` | `### 1.1 `, `### 1.4 `, `### 1.5 ` | 4 kB |
| `docs/PLAN.md` | `### 5.7 ` | 2 kB |
| M5-R5 item 6: only `docs/07-manifest-registry-cli.md` `### 3.3 ` | | 4 kB |
| repository: `components/cart-link/cart-link.json` (props `count`, `drawer`, masks), `components/icon-button/icon-button.json` (prop `dialog`, link form), `components/logo/logo.json`, `components/account-link/account-link.json`, `components/navigation-menu/navigation-menu.json`; the `fixtures/default.html` of `cart-link`, `logo`, `account-link`, `navigation-menu`; `src/check/rules/RP113.ts` | | 22 kB |

### Files

Create by hand: `components/header/header.json`, `header.css`, `header.test.ts`, `react/header.tsx`, `remix/header.tsx`, `liquid/blocks/header.liquid`, `liquid/snippets/rp-header.liquid`, and six fixture files `default`, `sticky-scheme`, `default-body`, `default-body-plain`, `class`, `unknown-scheme`. Generated (commit): `html/header.html`, `liquid/locales/header.json`, generated regions, visual snapshots. Change: `locales/en.default.json`, `src/check/rules/RP113.ts`, doc 12 `## Ledger issues`, and the manifests with regenerated Liquid files of `icon-button`, `logo`, `navigation-menu`, `account-link`, `cart-link`.

### Steps

1. Branch `task/M5-T13-header`.
2. Manifest. Props: every row of the spec's Props table. `scheme` (M5-R10), `sticky` (boolean, prints `data-sticky=""`), `menu`, `shop`, `cart` (objects), ids `navigationMenu` (default `main-nav`), `linkList` (default `footer-menu`), `mobileNav`, `cartDrawer`, `searchDialog`, urls `searchUrl`, `accountUrl`, `cartUrl`, `strings`. `shop`, `cart`, `strings` carry `hosts: ["html", "react", "remix"]`. Parts `inner`, `start`, `center`, `end`. `dependencies.elements` `[]`. `dependencies.embeds`: `icon-button`, `logo`, `navigation-menu`, `account-link`, `cart-link`; embeddedBy: add `header` to each of the five (M5-R7). `upgradeAllow`: the entry for `aria-haspopup` and `aria-controls` on `a[data-rp-open]` (row of the spec's "State and attributes"; shape: the same entry in `components/button/button.json` or `components/icon-button/icon-button.json`).
3. Fixtures (6, hand): the fenced blocks. `default` (children: the one link the spec prints; no props); `sticky-scheme` (`sticky: true`, `scheme: "dark"`); `default-body` (`menu` = `menu.main`, `shop` = `shop.basic`, `mobileNav: "mobile-nav"`, `cartDrawer: "cart-drawer"`, `searchDialog: "search-dialog"`; the prop `cart` is OMITTED: a fixture cannot hold `null` for an object prop and the default is `null`); `default-body-plain` (`menu.empty`, `shop.basic`); `class`; `unknown-scheme` (`scheme: "sepia"`, children as `default`; reference HTML equals `default`). Masks: the CartLink masks (from `components/cart-link/cart-link.json`) and the AccountLink `href` mask on `default-body` and `default-body-plain` only (M5-R9).
4. CSS: copy the complete block of the spec's `### Styling` unchanged.
5. Liquid: copy the complete snippet `rp-header.liquid` of the spec. ONE change (PR-M5-4): the spec's snippet prints `data-scheme` for any non-blank value, which contradicts fixture `unknown-scheme`. Print it only when the value is `light` or `dark`, using the generated enum guard of the `scheme` prop when `pnpm gen` writes one into the snippet's generated region, otherwise `{% if scheme == 'light' or scheme == 'dark' %}`. Record one line under `## Ledger issues` of doc 12: `header: rp-header.liquid scheme guard added by M5-T13 (snippet as printed contradicts fixture unknown-scheme).` The block renders the snippet.
6. TSX default body, in the order of fixture `default-body`: `start`: IconButton as a link (`href="#<linkList>"`, `dialog={mobileNav}`, label `strings.menu`), Logo (`href` = `shop.url`, `image` = `shop.logo`, children `shop.name`); `center` (`data-hidden="true lg:false"`), printed only when `menu` has items: NavigationMenu (`id` = `navigationMenu`, `menu`); `end`: IconButton link (`href` = `searchUrl`, `dialog={searchDialog}`, label `strings.search`), AccountLink (`iconOnly`, `href` = `accountUrl`, children `strings.account`), CartLink (`count={cart?.totalQuantity ?? 0}`, `drawer={cartDrawer}`, `href` = `cartUrl`). Import the five sibling bindings; copy no markup.
7. Rule functions and texts. Tests, then M5-R13.

### Names and values

- Locale keys: `ripple.header.name`, `ripple.header.menu`, `ripple.header.search` (English texts: the spec's Host notes). The account label is AccountLink's key.
- Rules (2). `header-once`: at most one `.rp-header` per document (M5-R21 last sentence; the spec's "`count` max 1" is per document, which `max-count` cannot express). Message `A document has more than one Header.` Fix `Render Header once, in the layout.` Failing string: fixture `default` twice. `header-outside-main`: `.rp-header` MUST NOT have a `main` ancestor; returns `[root]` when `root.closest("main")` is not null. Message `A Header is inside the main element.` Fix `Move the Header before the main element.` Failing string: `<main>` + fixture `default` + `</main>`.
- F-11 (M5-R11): `navigationMenu`, `linkList`, `searchUrl`, `accountUrl`, `cartUrl`, `cart`, `strings`. If reported for the first five: set on fixture `default-body-plain` `linkList: "site-links"`, `searchUrl: "/find"`, `accountUrl: "/me"`, `cartUrl: "/basket"` and on fixture `default-body` `navigationMenu: "primary-nav"`, and change the reference HTML of those two fixtures accordingly (ids `primary-nav`, `primary-nav-item-1`; the four `href` values). If reported for `cart` or `strings`: stop.
- Trap: `default-body` contains `rp-navigation-menu` and `rp-cart` markup although `dependencies.elements` is empty (spec, Kind note). Tier 3 on that fixture sees the embedded components' upgrades; if it fails, apply the same rule as M5-T09 (copy the embedded components' `upgradeAllow` entries; say so in the pull request).

### Tests (`components/header/header.test.ts`)

Pages are M5-R16 pages with the Header fixture directly in `<body>` before `<main>`.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | `[T5] header: AT-3 ...` on fixture `default-body`: at 375 by 667 the menu opener (`a[data-rp-open="mobile-nav"]`) is visible and `.rp-header-center` has `display: none`; at 1280 by 800 the opener has `display: none` and the centre is visible |
| AT-4 | `[T5] header: AT-4 ...`: fixture `sticky-scheme`; `<main>` holds `<div style="height:4000px"></div>`; after `window.scrollTo(0, 2000)` the header's `top` is `0` |
| AT-5 | `[T6] header: AT-5 ...`, `scripts: "disabled"`, viewport 375 by 667: fixture `default-body`; `<main>` holds `<p id="footer-menu">Footer menu</p>`; routes `GET /search` and `GET /cart` answer `200`. Three navigations, each from a fresh load. Second line: `// AT-5 (blueprint): generic (...)` in the NJ-F form with `NJ-F14` |
| AT-6 | `[T5] header: AT-6 ...`, viewport 1280 by 800: fixture `default`; `<main>` holds the Container fixture as in M5-T06 AT-4 (`components/container/fixtures/default.html`, width `page`); left and right of `.rp-header-inner` equal the Container's within 0.5 px |
| rules | two M5-R15 tests plus the default-fixture test |

### Acceptance

M5-R13. `ls components/header/fixtures | wc -l` prints `6`. `diff components/header/fixtures/default.html components/header/fixtures/unknown-scheme.html` prints at most the marker line. `grep -c 'data-rp-open' components/header/fixtures/default-body.html` prints `3`; the same command on `default-body-plain.html` prints `0`. `for x in icon-button logo navigation-menu account-link cart-link; do grep -c '"header"' components/$x/$x.json; done` prints five lines, each at least `1`.

### Out of scope

MobileNav, CartDrawer and the search Dialog themselves (the caller renders them; Header only names their ids). SearchForm inside the header. An announcement slot. The `layout` blueprint.

### If blocked

`components/cart-link/` is missing: M1-T34 is not done. The page-level check of tier 2 reports `header-outside-main` on fixture pages: as M5-T06 "If blocked". Liquid `default-body` differs in the CartLink count: the fixture omits `cart`, so the shim's global `cart` is used; when its item count is not `0`, draft pull request (the fixture needs `cart.empty` on Liquid only, which a fixture record cannot say).

---

## M5-T14 Strict generator check: all 84 components present

- **Goal:** Delete `BRINGUP_SUBSET` and every bring-up line marked for M5-T14, so that `pnpm gen --check` enforces rule MB-20 (all 84 components) unless `--subset` is passed.
- **Depends on:** M2-T32, M3-T11, M4-T24, M5-T01 to M5-T13.
- **Kind:** `infra`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/PLAN.md` | `### 4.4 ` | 2 kB |
| `docs/07-manifest-registry-cli.md` | in `### 1.6 ` only rule MB-20 | 1 kB |
| `docs/01-architecture.md` | `## 7. ` (the 10 build steps) | 5 kB |
| repository: `src/gen/index.ts`, `src/gen/build.ts`, `src/gen/size.ts`, `src/gen/size.test.ts`, `src/gen/index.test.ts`; output of `grep -rn "PLAN 4.4" src/ test/` | | 30 kB |

### Files

Change: `src/gen/index.ts`, `src/gen/build.ts`, `src/gen/size.ts`, `src/gen/size.test.ts`, `src/gen/index.test.ts`. No component file. No `package.json` change.

### Steps

1. Branch `task/M5-T14-strict-gen-check`. `pnpm install --frozen-lockfile`.
2. Precondition: `ls -d components/*/ | wc -l` prints `84`, and `pnpm gen --check` exits 0. When the count is not 84: stop; write the missing ids (the 84 ids are the list rule MB-20 checks against) into a draft pull request. This task adds no component.
3. `grep -rn "BRINGUP_SUBSET\|M5-T14" src/ test/` and handle every hit:
   - `src/gen/index.ts`: delete the line `export const BRINGUP_SUBSET = true // PLAN 4.4: remove in M5-T14`; `subset` becomes true only when the argument `--subset` is passed (delete the `|| BRINGUP_SUBSET` operand). `checkManifest(manifest, { subset })` stays.
   - `src/gen/build.ts`: delete the import of the constant; build step 2 calls `runGen(["--check"])` (strict); delete the filters "entry lists filtered to files that exist" of build steps 4, 5 and 7 that carry a marker `removed by M5-T14`: a missing entry file is now a build error.
   - `src/gen/size.ts`: delete the branch `if (BRINGUP_SUBSET)` that treats a `missing` budget as a pass (marker `missing budgets fail again, removed by M5-T14`).
   - `src/gen/size.test.ts`: delete the `if (files.length === 0) return` guard and its marker.
4. The marker `// PLAN 4.4: G9 and G10 added by M5-T14` in `src/gen/index.ts` is wrong (PR-M5-16): G9 belongs to M6-T01 and G10 to M7-T02. Replace its text with `// PLAN 4.4: G9 added by M6-T01, G10 added by M7-T02`. Do not implement G9 or G10.
5. Leave every other `PLAN 4.4` line: the `build: skipped <step> (PLAN 4.4)` sub-steps whose module does not exist yet (registry, docs, skills copy) belong to the task that adds the module; a file a later milestone creates and that a build step lists stays filtered ONLY where its marker names that later task. When a filter marked for M5-T14 covers a file that does not exist yet because a later task creates it: keep that one filter, change its marker to name the creating task (find it in the PLAN table by the file path), and list it in the pull request.
6. Test in `src/gen/index.test.ts`: `[T1] gen: the check is strict unless --subset is passed`: copy the fixture-directory technique of the existing `--subset` test in that file; with a source tree of fewer than 84 components, `runGen(["--check"])` returns non-zero with a message naming MB-20 and `runGen(["--check", "--subset"])` returns 0. Delete or rewrite any existing test that asserts the bring-up behaviour.
7. Proof:

   ```bash
   pnpm typecheck
   pnpm gen --check
   pnpm build
   pnpm test:run --files=src/gen --no-skips
   pnpm test:size
   pnpm ci
   ```

### Acceptance

```bash
ls -d components/*/ | wc -l                 # 84
grep -rn "BRINGUP_SUBSET" src/ test/        # prints nothing
grep -rn "M5-T14" src/ test/                # prints nothing
pnpm gen --check; echo $?                   # 0
grep -c -- "--subset" package.json          # 0
pnpm build 2>&1 | grep -c "gen.*--subset"   # 0
```

The commands of step 7 exit 0. The done file lists the output of `grep -rn "PLAN 4.4" src/ | sort` (the markers that remain and the task each names).

### Out of scope

Steps G9 and G10. Removing build skips owned by M6 and M8 tasks. Adding or fixing a component. The M9-T05 check that no `PLAN 4.4` string remains.

### If blocked

Fewer than 84 components: step 2. `pnpm build` fails on a missing entry file after the filters are gone: step 5 (keep that one filter under the creating task's name); when no task creates the file, draft pull request. `pnpm test:size` fails with `missing` for a budget whose file a later milestone creates: keep that one `missing` pass for that file name only, marked `// PLAN 4.4: <file> is created by <task id>`, and list it in the pull request.

---

## M5-T15 M5 gate

- **Goal:** Prove that milestone M5 is complete.
- **Depends on:** M5-T14.
- **Kind:** `gate` (PLAN 3.5). Changes no source.

### Read first

`docs/PLAN.md` section 4.2 (row M5) and section 3.5. `docs/12-components-chrome-and-blueprints.md` `## 4. ` (acceptance), items 1, 3, 6, 10 only. `ls docs/plan/done/`.

### Steps

1. Branch `task/M5-T15-gate`. `pnpm install --frozen-lockfile`.
2. Done files: every one of `docs/plan/done/M5-T01.md` to `M5-T14.md` exists. Collect every line that starts with `FOLLOW-UP NEEDED` or `BLOCKED`.
3. Components present and stable:

   ```bash
   ls -d components/*/ | wc -l        # 84
   for id in logo account-link link-list announcement-bar hero footer newsletter-form locale-selector featured-collection navigation-menu mobile-nav header; do
     node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(m.status!=="stable") { console.log(process.argv[1], m.status); process.exitCode=1 }' components/$id/$id.json || echo "FAIL $id"
   done        # prints nothing
   ```

4. Strict mode: `grep -rn "BRINGUP_SUBSET" src/ test/` prints nothing; `pnpm gen --check` exits 0.
5. `pnpm ci` exits 0; record its last line.
6. Tier 4 for the `native` components: `pnpm test:hydration --grep="navigation-menu|mobile-nav" --no-skips` exits 0; record the last line.
7. Element row: `grep -rn "E-15 " src/ | wc -l` prints at least `1`; `pnpm test:run --tiers=3,5,6 --files=src/elements/rp-navigation-menu,src/runtime/index.test.ts --no-skips` exits 0.
8. Doc 12 section 4, the component halves of items 1, 3, 6, 10: for each item write one line in the done file: the command that proves it (one of steps 3 to 7) or `deferred to M7 (blueprint half)`.
9. Acceptance coverage: for each of the 12 ids, the number of `AT-<n>` items in `docs/components/<id>.md` equals the number of distinct `AT-<n>` ids in `components/<id>/<id>.test.ts`:

   ```bash
   for id in logo account-link link-list announcement-bar hero footer newsletter-form locale-selector featured-collection navigation-menu mobile-nav header; do
     a=$(grep -o '\*\*AT-[0-9]*\*\*' docs/components/$id.md | sort -u | wc -l)
     b=$(grep -o 'AT-[0-9]*' components/$id/$id.test.ts | sort -u | wc -l)
     [ "$a" = "$b" ] || echo "FAIL $id $a $b"
   done        # prints nothing
   ```

10. Write `docs/plan/done/M5-T15.md`: the outputs of steps 3 to 9 in one line each, every task of the milestone with its pull request number, the collected `FOLLOW-UP NEEDED` lines.

### Acceptance

Steps 2 to 9 hold. The gate fails when any command fails; the done file then names the failing task and the task is not merged (PLAN 3.5).

### Out of scope

Fixing anything. Cross-engine runs (they block only after M9-T06). Tier 7 and tier 8. Blueprints.

### If blocked

A `FOLLOW-UP NEEDED` line that this file expects (M5-T02 AccountLink AT-3 navigation half; M5-T11 page P when M3-T10 was not merged) is not a gate failure; record it as a plan note for Ben in the done file. Step 9 prints `FAIL` only because a test file names an AT id of ANOTHER component in a comment: check by hand and record the reason. Any other failing command: the gate fails.
