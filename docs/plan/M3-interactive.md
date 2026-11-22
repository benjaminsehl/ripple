# M3 Interactive components: task detail

Status: detail file for the 11 rows of milestone M3 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no API. Where it fixes a process choice the specs leave open, the choice is marked "Plan reading" and is listed in section 0.7.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and the recipe of your task's kind (PLAN section 5), then section 0 of this file, then ONLY your task's section `## <task id>`. Do not read other task sections. Do not read `docs/plan/M1-golden-path.md`: every rule you need from it is restated in section 0.

Contents: 0 Rules for every M3 task. Then M3-T01 to M3-T11 in table order.

---

## 0. Rules for every M3 task

### 0.1 Finding what to read

- **M3-R1** Spec files are large. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 9.2 ` in `docs/04-elements.md`) and read up to the next heading of the same or a higher level.
- **M3-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file.
- **M3-R3** "the spec" in a component task is `docs/components/<id>.md`. Its section order is fixed (PLAN 5.1 item 2). The spec's "HTML contract" section is the oracle for every fixture.

### 0.2 Values every M3 task uses

| Thing | Value | Source |
|---|---|---|
| Manifest `since` | `"0.1.0"` | `docs/07-manifest-registry-cli.md` section 1.7 |
| Manifest `status` | `"stable"` (all M3 components are kind `static`, `native` or `ui`) | PLAN 3.2 |
| Render hosts | `html`, `react`, `remix`, `liquid` (Liquid is the shim of `src/testing/liquid-shim.ts`) | CONVENTIONS 1 |
| Bring-up mode | `BRINGUP_SUBSET` is `true` | PLAN 4.4 |
| Test name | `[T<tier>] <subject>: <ID> <statement>`; flat `test()` from `node:test`; no `describe` | `docs/13-testing.md` section 2.4 |
| Test style | `openPage()` per test, closed in `finally`; no fixed delay except a duration a spec states; last assertion `assert.deepEqual(opened.errors, [])` | `docs/13-testing.md` section 2.5 |
| `[chromium]` tag | allowed only for a Chromium-only API or a computed-style snapshot, with the comment line `// [chromium]: <reason>` above the test. A feature above the browser floor is feature-detected inside the test and the test returns early with a passing assertion; that is not a skip | `docs/13-testing.md` N-2; D-081 |

The M3 components are `popover`, `accordion`, `tabs`, `tooltip`, `toast`, `carousel`. (`dialog`, `drawer`, `quantity-input` of doc 10 were built in M1.)

### 0.3 Component tasks

A component task says "Recipe: S" (or N, U). Do every step of that recipe in `docs/PLAN.md` section 5, in order. The task section lists only what is specific.

- **M3-R4 Manifest.** Copy every value from the spec: field table, Props, Anatomy, Content model, State and attributes, upgrade allow-list (the JSON block is the value of `upgradeAllow`), Behaviour without JavaScript (`noJs.*`), Accessibility (`a11y.*`), Agent surface (`agent.*`), Checker rules (`rules[]`), fixtures. Use only the manifest key names of ledger section "4.8" (search `Component: \`name\`` in `docs/00-decisions.md`; 3 kB). For the JSON SHAPE of each key copy the same key of an existing entry in the repository: `components/dialog/dialog.json` (parts, `state[]`, `events[]`, `upgradeAllow[]`, `rules[]`, part fixtures) and `components/quantity-input/quantity-input.json` (`noJs.hideUntilDefined`, component-printed parts, embedded Icon, `{ "t": ... }` defaults). When the spec gives no value for a REQUIRED manifest key, stop: record it under `## Ledger issues` of `docs/10-components-interactive.md`, mention it in the pull request, take the smallest value that keeps `pnpm gen --check` green.
- **M3-R5 Locale keys.** Add to `locales/en.default.json` only the keys the task section lists. For the schema name keys (`ripple.<id>.name`, `ripple.<id>.<part>_name`) do what M1 did: when `locales/en.default.json` contains `ripple.dialog.name`, add the same two kinds of key for your component with the English text of `docs/07-manifest-registry-cli.md` section 3.3 ("Dialog", "Dialog title" pattern); when it does not, add none (the generator writes them). Never add `ripple.props.*` keys.
- **M3-R6 Acceptance coverage.** `components/<id>/<id>.test.ts` MUST contain, for every numbered item `n` of the spec's "Acceptance tests", either a test whose name contains `AT-<n> ` or one comment line. The task section says which. Comment forms, exact:

  | Case | Line |
  |---|---|
  | generic tier 2, 3, 4 or 6 matrix | `// AT-<n>: generic (<files>)` with the files that apply out of `test/conformance/conformance.test.ts`, `test/upgrade/upgrade.test.ts`, `test/hydration/react.test.ts`, `test/hydration/remix.test.ts`, `test/nojs/render.test.ts` |
  | tier 9 ("tests a, b pass in WebKit and Gecko") | `// AT-<n>: generic (pnpm test:webkit and pnpm test:firefox re-run AT-<a>, AT-<b>)`; the named tests MUST NOT carry `[chromium]` |

  Every other item is a real test, never skipped, never `todo`.
- **M3-R7 Component rules.** For every manifest `rules[]` entry one test `[T1] <id>: rule <rule id> reports RP113`: run the checker (`src/check/index.ts`, layer H; copy the call from `components/dialog/dialog.test.ts`) on a failing HTML string and assert exactly one diagnostic `RP113` whose message contains `[<rule id>]`. Plus one test `[T1] <id>: default fixture reports no RP113`.
- **M3-R8 Tests required beyond the acceptance list** (`docs/13-testing.md` section 10.2). The task section names them. They carry no `AT-` id.
- **M3-R9 Proof commands for a component**, in this order, all exit 0:

  ```bash
  pnpm gen && pnpm typecheck && pnpm gen --check
  pnpm build && pnpm examples:install
  pnpm test:visual --component=<id> --update      # first time only; look at the snapshots, commit them
  pnpm test:component --component=<id> --no-skips
  pnpm test:size
  pnpm ci
  ```

- **M3-R10 Generated output that differs from the spec.** A generated file that differs from HTML or code a spec prints is a defect of the manifest `template` first: fix the manifest. When the generator itself is wrong: if the task section names the generator file under "Files (conditional)", fix exactly the one emission rule the section names, add one `[T1]` test for it in the generator's test file (`src/gen/react.test.ts`, `src/gen/remix.test.ts`, `src/gen/liquid.test.ts`), and record it in the pull request under "Deviations and ledger issues". In every other case stop, open a draft pull request and name the defect. Never edit generated output by hand.

### 0.4 Pages that are not a fixture page (Plan reading)

`fixturePageUrl("<id>/<fixture>")` (`test/support/server.ts`) serves one fixture. A test that needs other markup (an opener plus a fixture, eight carousel items, an element before its component exists) builds its own page:

- **M3-R11** Inside the test, after `const opened = await openPage(...)`, call `opened.page.route("**/*", handler)`. The handler fulfils: `GET http://localhost/` with the page HTML string (`content-type: text/html; charset=utf-8`); `GET /ripple.css` with the file `pkg/browser/ripple.css`; any `GET /ripple*.js` with the file of the same name in `pkg/browser/`; everything else with status `404`, unless the test names a route. Then `await opened.page.goto("http://localhost/")`. A working copy of this handler is in `src/elements/rp-dialog.test.ts` (M1-T16): copy it.
- **M3-R12** The page is `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><link rel="stylesheet" href="/ripple.css"><script type="module" src="/ripple.elements.js"></script></head><body><main id="rp-test-root">…</main></body></html>`. Markup inside `<main>` comes from fixture files read at test time (`components/<id>/fixtures/<name>.html`, path relative to `process.cwd()`) or from the block of a spec the task names. Never invent component markup. A plain native element with no `rp-` class (a `<button popovertarget>`, an `<a href>`, a `<p>`) MAY be added where the acceptance test describes it (`docs/10-components-interactive.md` G-3). A test-only `<style>` MAY be added only with the text the acceptance test or the task section gives.
- **M3-R13** Wait with `page.waitForFunction`, `customElements.whenDefined`, or `settled(page)` of `test/support/browser.ts`. A duration that a spec states ("within 1500 ms", "after 2500 ms", "no scroll event for 200 ms") is written as the `timeout` of a `waitForFunction` or, when the spec asks that nothing happens for that time, as one `page.waitForTimeout(<ms>)` with the comment `// duration stated by <spec id>`.

### 0.5 Shared files that several M3 tasks edit

Edit only the lines your task names. When `git rebase origin/main` conflicts in one of them, keep both sides' lines, run `pnpm gen`, re-run the proof commands.

| File | Rule |
|---|---|
| `locales/en.default.json` | add your keys only; keep the file's key order convention; run `pnpm gen` |
| `src/elements/index.ts` | its text is fixed by `docs/04-elements.md` section 4.1; only M3-T08 touches it (one import line) |
| `src/gen/index.ts` | only M3-T03 touches it |
| `test/upgrade/upgrade.test.ts` | only M3-T07 touches it (one assertion, PR-M3-5) |
| `test/upgrade/bundles.test.ts` | tests A-07, A-08, A-13 register themselves when the `default` fixtures of `tabs`, `dialog` and `toast` all exist. The later of M3-T04 and M3-T07 makes them run for the first time; that task MUST make them pass and MAY fix that file |
| generated files | never edited by hand; run `pnpm gen` |

A bring-up line in a source file carries the comment `// PLAN 4.4: <what replaces it and which task>`.

### 0.6 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" in a task section lists what is specific; PLAN section 3.1 (and 3.2 for components) always applies.

### 0.7 Plan readings made by this file

| # | Topic | Reading |
|---|---|---|
| PR-M3-1 | Module and names of snapshot mode (the ledger tree has no file for it) | M3-T03: code in `src/gen/index.ts`; exported function `snapshotFixture`; Playwright loaded with a dynamic `import()` |
| PR-M3-2 | Seed of an `upgrade-snapshot` fixture of a component without `template` (`docs/02-html-contract.md` 11.4 says "a hand-written seed" and no more) | The seed is the existing file `components/<id>/fixtures/<name>.html`, written by hand from the spec; the command overwrites it with the snapshot |
| PR-M3-3 | Tags that are never defined at page load (`ui-toast-region`, D-083) in snapshot mode | M3-T03: the wait skips tags whose `chunk` in `src/gen/elements.json` is `toast` |
| PR-M3-4 | Tabs cannot be written as a contract template (ids need two props; `docs/07-manifest-registry-cli.md` 2.3 allows one prop per value) | M3-T04: Tabs has no `template`; its Remix and Liquid files are hand-written from the complete code of `docs/06-bindings.md` 7.6 and 8.6 with generated regions; fixtures stay `upgrade-snapshot` (allowed by MB-13) |
| PR-M3-5 | The generic tier 3 test asserts `report.undefinedTags` is empty, which cannot hold for Toast | M3-T07 filters the `toast` chunk's tags in that one assertion |
| PR-M3-6 | The generated React file of Accordion must contain a `useState` hook (`docs/components/accordion.md`, Host notes), which the emission table of `docs/07-manifest-registry-cli.md` 2.4 does not describe | M3-T02 adds one emission rule to `src/gen/react.ts` when the output lacks it |
| PR-M3-7 | E-14 needs a scrolling viewport before `carousel.css` exists | M3-T08 adds a test-only `<style>` with the layout declarations the Carousel spec states |
| PR-M3-8 | Files of the `E-nn` tests of `docs/04-elements.md` section 13 (the doc does not name them) | The table in M3-T10 |
| PR-M3-9 | Page P contains NavigationMenu, which is M5 | In M3, page P is items 1 to 9; E-15 and the NavigationMenu assertions of E-01 and E-19 belong to M5-T10 and M5-T11 |
| PR-M3-10 | Usage errors of `pnpm gen --snapshot` (the spec gives exit codes 0 and 1 only) | Exit 2 with a `gen: --snapshot: ...` line, as M3-T03 lists |

---

## M3-T01 Popover (`popover`)

- **Goal:** Ship Popover (a `div` with the native `popover` attribute plus CSS, no script) with its title part in all four hosts.
- **Depends on:** M1-T01, M1-T04, M1-T19.
- **Kind / recipe:** `static`, Liquid tier `parts`; recipe S. All bindings generated.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/popover.md` | whole file | 25 kB |
| `docs/10-components-interactive.md` | `### 0.2 `, `### 0.3 ` | 10 kB |
| `docs/research/spikes/invoker-commands-hosts/README.md` | `## Verdict` and the rows about `popover=""` and `popovertarget` | 1 kB |
| repository: `components/dialog/dialog.json`, `components/dialog/dialog.test.ts` | whole files (shape of a `parts` manifest; checker call; `[T4]` test) | 12 kB |
| `docs/13-testing.md` | `### 9.1 ` items 1 to 3 (how a `[T4]` test renders React) | 2 kB |

### Files

Create: `components/popover/popover.json`, `components/popover/popover.css`, `components/popover/popover.test.ts`. Generated (commit): `components/popover/fixtures/*.html` (5), `html/popover.html`, `react/popover.tsx`, `remix/popover.tsx`, `liquid/blocks/popover.liquid`, `liquid/blocks/popover-title.liquid`, `liquid/locales/popover.json`, visual snapshots. Change: `locales/en.default.json` (M3-R5 name keys only). Files (conditional, M3-R10): `src/gen/remix.ts` and `src/gen/remix.test.ts`, only for the `popover` attribute rule of step 4.

### Steps

1. Branch `task/M3-T01-popover`. Recipe S.
2. Manifest from the spec (M3-R4). `root.requiresId` true. Props `id`, `side` (default `bottom`), `align` (default `start`); `side` and `align` print `data-side` and `data-align` (default printed) and are Liquid settings. Part `title` (`p`, class `rp-popover-title`, authored by the author, text content). `upgradeAllow` is `[]`. `noJs.level` `degraded`, `noJs.behavior` the sentence of the spec, item 8 of "Behaviour without JavaScript". `agent.surface` `accessibility-tree`. `a11y.checkPattern` null.
3. Template root: `div`, attributes in this order: `class`, `id`, `popover` (presence attribute), `data-side`, `data-align`.
4. CSS: copy the "Complete file" block of the spec's `### Styling` unchanged. `pnpm gen`. Check the generated files against the spec's Host notes:
   - `components/popover/liquid/blocks/popover.liquid` contains the line the spec prints as "`blocks/popover.liquid` markup".
   - `components/popover/react/popover.tsx` prints `popover=""`.
   - `components/popover/remix/popover.tsx` prints `popover={true}` (Remix types reject `popover=""`). When it prints `popover=""` and `pnpm typecheck` fails: apply M3-R10 to `src/gen/remix.ts` with the one rule "the presence attribute `popover` is emitted as `popover={true}` in Remix" (ledger D-133 row 5).
5. Tests, then M3-R9 with `<id>` = `popover`.

### Names and values

- Fixtures (5), all `generated: "template"`: `default` (id `shipping-info`, children `<p>Free shipping on orders over $50.</p>`), `title` (id `shipping-info`, part `title` with children `Shipping`, then the paragraph: see the note below), `placement` (id `order-actions`, `side` `top`, `align` `end`, children `<p>Actions</p>`), `invalid-enum-falls-back` (id `w1`, `side` `bogus`, children `<p>Text</p>`), `class` (id `w2`, `class` `custom-a custom-b`, children `<p>Text</p>`).
- Note on fixture `title`: a fixture record has either `children` or `parts` (`docs/02-html-contract.md` 11.2). The `title` fixture needs a title part followed by a paragraph. When the record format cannot express a part followed by free content, make this one fixture `generated: "hand"` with the exact HTML of the spec, and say so in the pull request.
- Rules (3): `popover-needs-popover-attribute`, `popover-one-title`, `popover-title-in-popover`; kind, selector, target, message and fix as the spec's `### Checker rules` prints them.
- Locale keys for printed strings: none.
- Opener for tests (not part of any fixture): `<button type="button" class="rp-button" popovertarget="shipping-info">Shipping</button>` (the spec prints it).

### Tests (`components/popover/popover.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (`test/conformance/conformance.test.ts`) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3, AT-4 | `[T6] popover: AT-3 ...`, `[T6] popover: AT-4 ...`: `openPage({ scripts: "disabled" })`, M3-R11 page = the opener, then fixture `default`. No `[chromium]` |
| AT-5, AT-6, AT-7 | three `[T5]` tests, viewport 1000 by 700. Page = a plain `<button type="button" popovertarget="<id>" style="position:absolute;left:400px;top:300px;width:100px;height:40px;margin:0;padding:0;border:0">x</button>` followed by the root with the stated `side` and `align` (take fixture `default` and replace the two attribute values in the string; for AT-7 the button `top` is `650px`). AT-6 uses `<html dir="rtl">`. Each starts with `if (!(await page.evaluate(() => CSS.supports("anchor-name: --a"))))` and then asserts only that the open panel's box is inside the viewport (AT-11) |
| AT-8 | `[T5] popover: AT-8 ...` |
| AT-9 | `[T5] popover: AT-9 ...`: page = the opener, then the root of fixture `default` with `<a href="/policies/shipping-policy">Shipping policy</a>` inserted before `</div>`. No `[chromium]` |
| AT-10 | `[T4] popover: AT-10 ...`: mechanics of `docs/13-testing.md` 9.1 items 1 to 3, one script order ("elements defined first"); assert the server HTML string contains `popover=""` and `window.__rpRecoverable` is empty |
| AT-11 | comment, tier 9 form naming AT-3, AT-4, AT-9 |
| rules | three M3-R7 tests plus the default-fixture test |
| M3-R8 | `[T6] popover: the panel content is readable and the opener toggles it with scripts blocked` (`openPage({ scripts: "blocked" })`; filter the aborted-request messages as `test/nojs/render.test.ts` does) |

### Acceptance

M3-R9. `ls components/popover/fixtures | wc -l` prints `5`. `ls components/popover/liquid/blocks` prints `popover-title.liquid` and `popover.liquid`. `grep -c '"use client"' components/popover/react/popover.tsx` prints `0`. `grep -c 'role=' components/popover/fixtures/default.html` prints `0`.

### Out of scope

A `PopoverTrigger` part (does not exist). Any JavaScript for Popover. The SPIKE-05 and SPIKE-06 fallbacks of the spec. Menu, NavigationMenu.

### If blocked

SPIKE-05 report verdict `FALLBACK required`: do not start; a follow-up row at the end of the M1 table applies `popover="auto"` first (PLAN 7.2). Verdict `DEFAULT holds` or `DEFAULT holds (Chromium only)`: build the default path (`popover=""`). No SPIKE-05 report on `main`: the dependency M1-T19 is not done; pick another task.

---

## M3-T02 Accordion (`accordion`)

- **Goal:** Ship Accordion (native `<details>` items, no script) with its three part components in all four hosts.
- **Depends on:** M1-T11.
- **Kind / recipe:** `static`, Liquid tier `parts`; recipe S. All bindings generated.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/accordion.md` | whole file | 22 kB |
| `docs/10-components-interactive.md` | `### 0.2 `, `### 0.3 ` | 10 kB |
| `docs/02-html-contract.md` | in `### 11.9 `, only `#### Fixture 2: Accordion ` (the fixture record with nested `parts`) | 2 kB |
| `docs/13-testing.md` | `### 9.1 ` items 1 to 3, `### 9.2 ` | 4 kB |
| repository: `components/dialog/dialog.json`, `components/dialog/dialog.test.ts`, `components/quantity-input/quantity-input.test.ts` (its `[T4]` tests only) | | 14 kB |
| `docs/06-bindings.md` | in `### 6.1 Rules`: R-3, R-6, R-14. And `docs/07-manifest-registry-cli.md` `### 2.4 ` rows "Presence attribute" and "Attribute `when`". Only when step 4 finds the generator lacking | 3 kB |

### Files

Create: `components/accordion/accordion.json`, `accordion.css`, `accordion.test.ts`. Generated (commit): `fixtures/*.html` (5), `html/accordion.html`, `react/accordion.tsx`, `remix/accordion.tsx`, `liquid/blocks/accordion.liquid`, `accordion-item.liquid`, `accordion-trigger.liquid`, `accordion-content.liquid`, `liquid/locales/accordion.json`, visual snapshots. Change: `locales/en.default.json` (M3-R5 name keys only). Files (conditional, M3-R10): `src/gen/react.ts`, `src/gen/react.test.ts` (step 4).

### Steps

1. Branch `task/M3-T02-accordion`. Recipe S.
2. Manifest from the spec (M3-R4). `root.requiresId` false. Root props `id` (optional), `type` (`single`, `multiple`; default `multiple`; printed as `data-type`, default printed; Liquid setting). Parts `item` (`details`, props `accordion`, `defaultOpen`), `trigger` (`summary`), `content` (`div`); `trigger` and `content` have parent `item`. Item template attributes in order: `class`, `name` (value prop `accordion`, `when` set), `open` (presence, `when` `{ "true": "defaultOpen" }`). One `state[]` row: `open` on part `item`, `writer` `browser`, `defaultProp` `defaultOpen`, `reflects` `["open"]`. `upgradeAllow` `[]`. `noJs.level` `full` (build check MB-8 requires it), `noJs.behavior` the sentence of the spec.
3. CSS: copy the "Complete file" block unchanged. `pnpm gen`.
4. Check the generated React file against the spec's Host notes (React bullet). Run:

   ```bash
   head -1 components/accordion/react/accordion.tsx                                   # "use client";
   grep -c 'const \[initialOpen\] = useState(() => defaultOpen === true);' components/accordion/react/accordion.tsx   # 1
   grep -c 'open={initialOpen ? true : undefined}' components/accordion/react/accordion.tsx                           # 1
   grep -c 'suppressHydrationWarning' components/accordion/react/accordion.tsx                                         # 1
   ```

   When all four hold, continue. When they do not (PR-M3-6): add ONE emission rule to `src/gen/react.ts`: "A native element that is the `on` of a `state[]` row whose `writer` is `browser`, and that has a presence attribute `A` listed in that row's `reflects` with `when: { "true": P }`, is emitted with `const [initial<X>] = useState(() => <P> === true);` at the top of the component function (`<X>` is `P` without a leading `default`, first letter upper case), the attribute as `A={initial<X> ? true : undefined}`, and `suppressHydrationWarning` as the last attribute of that element; the file imports `useState` from `react` and its first line is `"use client";`." Add `[T1] gen-react: a browser-written presence attribute is captured once with useState` to `src/gen/react.test.ts`. Re-run `pnpm gen`; the four commands above MUST hold; no other component's generated React file may change (`git status --porcelain components/` lists only `components/accordion/`).
5. Check the generated Remix file: each `<details>` prints `data-rmx-preserve-attrs="open"`; no `data-rmx-key`. Check `liquid/blocks/accordion-item.liquid` against the line the spec prints as "`blocks/accordion-item.liquid` markup".
6. Tests, then M3-R9 with `<id>` = `accordion`.

### Names and values

- Fixtures (5), `generated: "template"`: `default`, `default-open`, `single` (the record is Fixture 2 of `docs/02-html-contract.md` 11.9: copy it), `invalid-enum-falls-back` (`type` `bogus`, one closed item), `class` (root `custom-a custom-b`; item `custom-c`; trigger `custom-d`; content `custom-e`). Texts: `Shipping` / `<p>Ships in two days.</p>`, `Returns` / `<p>Thirty days.</p>`.
- Rules (6): `accordion-item-in-accordion`, `accordion-item-needs-trigger`, `accordion-item-needs-content`, `accordion-single-items-need-name`, `accordion-single-one-open`, `accordion-trigger-not-interactive`.
- Locale keys for printed strings: none. Schema setting: `type` on the root block only.
- Trap: the chevron is CSS (`::after`); no Icon is embedded. `data-type` has no CSS rule.

### Tests (`components/accordion/accordion.test.ts`)

| Id | Form |
|---|---|
| AT-1, AT-2 | comments, generic (conformance; upgrade) |
| AT-3 | `[T6] accordion: AT-3 ...`, `scripts: "disabled"`, `fixturePageUrl("accordion/default")` |
| AT-4 | `[T6] accordion: AT-4 ...`, fixture `single`; first statement: when `"name" in HTMLDetailsElement.prototype` is false, assert that and return (AT-10). No `[chromium]` |
| AT-5 | `[T6] accordion: AT-5 ...` (focus the trigger with `page.focus`, then `page.keyboard.press`) |
| AT-6 | `[T5] accordion: AT-6 ...`, viewport 1000 by 700 |
| AT-7 | `[T5] accordion: AT-7 ...` (`page.accessibility.snapshot()` or the ARIA snapshot call that `components/dialog/dialog.test.ts` uses) |
| AT-8 | `[T4] accordion: AT-8 ...`: mechanics of `docs/13-testing.md` 9.1 items 1 to 3 with fixture `default-open`; the client entry wraps the Accordion in a parent component with a button whose click calls a state setter (forces a re-render with unchanged props) |
| AT-9 | `[T4] accordion: AT-9 ...` on the routes `/__rp/morph/a?c=accordion` and `/__rp/morph/b?c=accordion` of `examples/remix` (`docs/13-testing.md` 9.2); model: the `[T4]` Remix test in `components/quantity-input/quantity-input.test.ts` |
| AT-10 | comment, tier 9 form naming AT-3, AT-5 (AT-4 feature-detects) |
| rules | six M3-R7 tests plus the default-fixture test |
| M3-R8 | `[T6] accordion: a trigger toggles its item with scripts blocked` (`scripts: "blocked"`; `noJs.level: "full"` row of `docs/13-testing.md` 10.2) |

### Acceptance

M3-R9. `ls components/accordion/fixtures | wc -l` prints `5`. `ls components/accordion/liquid/blocks | wc -l` prints `4`. The four commands of step 4 print the stated values. `grep -c 'aria-expanded' components/accordion/fixtures/*.html` prints `0` for every file.

### Out of scope

Any script for Accordion (including exclusivity for browsers without `<details name>`). Height animation. FilterGroup, MobileNav, Footer (later users of `<details>`).

### If blocked

AT-8 fails although step 4 holds: apply the alternative the spec names under "Evidence and UNVERIFIED" (`AccordionItem` prints `open` only in the server render and omits the prop on the client, keeping `suppressHydrationWarning`) through the same emission rule, and record it. The Remix morph routes do not render `accordion` (the route answers 404 or renders nothing): open a draft pull request naming `examples/remix` test routes (M0-T31); do not write a skip.

---

## M3-T03 Generator `pnpm gen --snapshot <id>` (upgrade-snapshot fixtures)

- **Goal:** Add snapshot mode to the generator: it writes each `upgrade-snapshot` fixture file from what the browser shows after upgrade and fails when the written file is not upgrade-stable.
- **Depends on:** M1-T01.
- **Kind:** `gen`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/07-manifest-registry-cli.md` | `### 3.1 Command` | 2 kB |
| `docs/02-html-contract.md` | `### 11.4 ` (row `upgrade-snapshot`, F-8), `### 7.1 The rule` (U-1, U-2) | 4 kB |
| `docs/13-testing.md` | `### 8.3 Snapshot fixtures`; `### 5.2 The fixture page` (the page text and placeholder table) | 3 kB |
| repository: `src/gen/index.ts` | whole file (find `runGen`, the argument parser with the comment `PLAN 4.4: --snapshot added by M3-T03`, and how step G3 calls `renderHtml`) | 10 kB |
| repository: `src/testing/upgrade-diff.ts` | the exports `upgradeDiff`, `UpgradeDiffOptions`, `UpgradeReport`, `formatUpgradeFailures` | 3 kB |
| repository: `src/testing/fixtures.ts` | `rootClasses`, `loadComponents` | 2 kB |
| `docs/components/tabs.md` | in `### HTML contract`, only the fenced HTML of fixture `default` (test input) | 2 kB |

### Files

Change: `src/gen/index.ts`, `src/gen/index.test.ts`. Nothing else.

### Steps

1. Branch `task/M3-T03-gen-snapshot`.
2. Argument parsing in `runGen`: `--snapshot` followed by one or more component ids (every following argument that does not start with `--`). Delete the `--snapshot` half of the `PLAN 4.4` comment (keep the `--release-check` half). Usage errors (PR-M3-10), each printed to stderr, return 2: no id (`gen: --snapshot: no component id`); an id that is not a component (`gen: --snapshot: unknown component <id>`); a component with no fixture whose `generated` is `upgrade-snapshot` (`gen: --snapshot: <id> has no upgrade-snapshot fixture`); `pkg/browser/ripple.elements.js` missing (`gen: --snapshot: run pnpm build first`).
3. Add the exported function (plan-chosen name, PR-M3-1):

   ```ts
   export interface SnapshotInput { seed: string; allow: UpgradeAllowEntry[]; rootClasses: string[]; skipTags: string[] }
   export interface SnapshotResult { html: string; failures: string }
   export async function snapshotFixture(fixtureId: string, input: SnapshotInput): Promise<SnapshotResult>
   ```

   It implements steps 2 to 6 of the `upgrade-snapshot` row of `docs/02-html-contract.md` 11.4:
   1. `const { chromium } = await import("playwright")` (dynamic, so that plain `pnpm gen` never loads Playwright). One browser per `runGen` call; viewport 1280 by 720.
   2. Page text: the fixture page of `docs/13-testing.md` 5.2 with `dir` `ltr`, `scheme` `light`, `{css href}` `/pkg/browser/ripple.css`, `{script tag}` `<script type="module" src="/pkg/browser/ripple.elements.js"></script>`, `{commerce head}` empty, `{reference HTML}` the seed. Serve it with `page.route("**/*", ...)`: `GET http://localhost/` gives the page; `GET /pkg/<path>` gives the file `pkg/<path>` (`.js` as `text/javascript`, `.css` as `text/css`); everything else 404.
   3. `page.goto("http://localhost/", { waitUntil: "load" })`. In the page: collect every tag that starts with `ui-` or `rp-`; drop the tags in `skipTags`; await `customElements.whenDefined` of each with an upper bound of 5000 ms; a tag still undefined rejects with `gen: --snapshot: <fixtureId>: <tag> was not defined` (runGen prints it and returns 1); then await two animation frames.
   4. `html` is the `outerHTML` of the first element child of `#rp-test-root`.
   5. Re-check: open a NEW page with the same routing but with `html` as the reference HTML, and call `upgradeDiff(page, { url: "http://localhost/", allow: input.allow, rootClasses: input.rootClasses })`. `failures` is `formatUpgradeFailures(fixtureId, report.failures)`. `report.undefinedTags` is ignored for tags in `skipTags`; any other undefined tag is the error of item 3.
4. In `runGen`, for each named component and each of its `upgrade-snapshot` fixtures:
   - seed: when the component has a `template`, the text step G3 would produce for that fixture (call the same function G3 calls); otherwise the content of `components/<id>/fixtures/<name>.html` (PR-M3-2); when that file is missing print `gen: components/<id>/fixtures/<name>.html: missing seed` and return 1;
   - `allow`: the component's `upgradeAllow`; `rootClasses`: `rootClasses(loadComponents())` from `src/testing/fixtures.ts`; `skipTags`: every key of `src/gen/elements.json` whose `chunk` is `"toast"` (PR-M3-3; D-083: that chunk loads only on the first `toast()` call);
   - when `failures` is not empty: print it to stderr, write nothing for that fixture, remember exit code 1;
   - otherwise write `html` plus one trailing newline to `components/<id>/fixtures/<name>.html` when it differs, and print `wrote <path>`.
   Then run the normal generation (the same code path as `pnpm gen` with no argument) and return 1 when any fixture failed, else its exit code.
5. Step G3 MUST NOT write `upgrade-snapshot` fixture files in a normal `pnpm gen` (it writes only `generated: "template"` fixtures). Check that this already holds; fix it in `src/gen/index.ts` when it does not.
6. Tests, proof.

### Tests (`src/gen/index.test.ts`, added)

- `[T1] gen: --snapshot without a component id exits 2`
- `[T1] gen: --snapshot of an unknown component exits 2`
- `[T1] gen: --snapshot of a component without upgrade-snapshot fixtures exits 2` (uses `button`)
- `[T3] gen: snapshotFixture returns the Tabs seed unchanged and reports no failure`: `seed` is the Tabs fixture `default` HTML pasted from `docs/components/tabs.md` as a string literal; `allow` `[]`; `rootClasses` `["rp-tabs"]`; `skipTags` `[]`. Assert `failures === ""` and that `canonicalize(result.html)` equals `canonicalize(seed)` (`src/testing/canonicalize.ts`; read its export for the exact call).
- `[T3] gen: snapshotFixture repairs a seed that lacks an upgrade-written attribute`: the same seed with ` aria-selected="true"` removed from the first tab button; assert `result.html` contains `aria-selected="true"` and `failures === ""`.

The two `[T3]` tests need `pkg/browser/` (run `pnpm build` first).

### Acceptance

```bash
pnpm typecheck && pnpm build
pnpm test:run --tiers=1,3 --files=src/gen/index.test.ts --no-skips     # 0 failed, 0 skipped
pnpm gen --snapshot; echo $?                                           # gen: --snapshot: no component id / 2
pnpm gen --snapshot button; echo $?                                    # gen: --snapshot: button has no upgrade-snapshot fixture / 2
pnpm gen --check && pnpm ci
grep -c "PLAN 4.4: --snapshot" src/gen/index.ts                        # 0
```

### Out of scope

The Tabs, Tooltip and Toast components (M3-T04, M3-T05, M3-T07). `--release-check`. Any change to `src/testing/upgrade-diff.ts`. A new file under `src/gen/`.

### If blocked

`upgradeDiff` cannot be imported into the generator bundle (the architecture test `src/architecture.test.ts` rejects `src/gen` importing `src/testing`): stop and open a draft pull request quoting the failing rule; `docs/13-testing.md` 8.3 requires this import, so the conflict is a ledger issue of `docs/01-architecture.md`. Tabs seed does not upgrade without mutation (first `[T3]` test fails with a failure line): the UI SDK output differs from the spec; keep the test, paste the failure line into a draft pull request (risk R5).

---

## M3-T04 Tabs (`tabs`)

- **Goal:** Ship Tabs, the first `ui` component: the UI SDK tabs family with the complete selected state printed by the server, in all four hosts.
- **Depends on:** M1-T11, M1-T12, M3-T03.
- **Kind / recipe:** `ui`, Liquid tier `parts`; recipe U with the difference of PR-M3-4: Tabs has NO `template`, so the React, Remix and Liquid files are all hand-written with generated regions.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/tabs.md` | whole file | 35 kB |
| `docs/10-components-interactive.md` | `### 0.3 ` item 1; in `### 0.2 ` only G-1, G-2, G-6, G-11, G-13, G-14, G-15 | 5 kB |
| `docs/06-bindings.md` | in `### 6.6 `: from the line `` `components/tabs/react/tabs.tsx`: `` to the end of the section | 5.5 kB |
| `docs/06-bindings.md` | in `### 7.6 `: from the line `` `components/tabs/remix/tabs.tsx`: `` to the end of the section | 4 kB |
| `docs/06-bindings.md` | in `### 8.6 `: from the line `` `components/tabs/liquid/blocks/tabs.liquid`: `` to the end of the section | 5 kB |
| `docs/02-html-contract.md` | in `### 11.9 `, only the Tabs fixture record (Fixture 3) | 2 kB |
| repository: `components/dialog/dialog.json`, `components/dialog/dialog.test.ts` | shapes; `checkPattern` call; `[T4]` test | (skim) |

Why no template: tab and panel ids are `<tabs>-tab-<value>` and `<tabs>-panel-<value>`, built from TWO props; a template value takes one prop (`docs/07-manifest-registry-cli.md` 2.3) and the language MUST NOT gain string functions (2.1: "A component that needs more is hand-written").

### Files

Create by hand: `components/tabs/tabs.json`, `tabs.css`, `tabs.test.ts`, `react/tabs.tsx`, `remix/tabs.tsx`, `liquid/blocks/tabs.liquid`, `tabs-list.liquid`, `tabs-tab.liquid`, `tabs-panel.liquid`, and the four seed files `fixtures/default.html`, `second-selected.html`, `escaping.html`, `class.html` (overwritten by the snapshot command). Generated (commit): `html/tabs.html`, `liquid/locales/tabs.json`, the generated regions inside the hand-written files, visual snapshots. Change: `locales/en.default.json` (M3-R5 name keys only). May change: `test/upgrade/bundles.test.ts` (section 0.5).

### Steps

1. Branch `task/M3-T04-tabs`.
2. Manifest (M3-R4), without the key `template` on the root and on every part. `kind` `ui`; `root.elements` `ui-tabs`, class `rp-tabs`, `requiresId` true. Props: root `id`, `defaultValue` (prints the attribute `default-value`), `value` and `onValueChange` with `hosts: ["react"]`; part `list`: `ariaLabel`; parts `tab` and `panel`: `tabs`, `value`, `selected`. `state[]`: the rows of the spec's "State and attributes" table except the last (`role="none"`), ordered so that the Remix constants come out as the spec prints them (`TAB_STATE`, `PANEL_STATE`, `DIRECTION_STATE`). `events[]`: `valuechange` / `onValueChange`. `upgradeAllow` `[]`. `noJs.level` `degraded`. `a11y.checkPattern` `tabs`. `agent`: surface `bridge`, component `ui-tabs`, action `setValue`. `dependencies.uiSdk` `["@ui-sdk/web/tabs"]`; `dependencies.elements` the four tags `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel`. Every `files.*` entry of the bindings has `generated: false`. Fixtures (4): `generated: "upgrade-snapshot"`; record shape: Fixture 3 of `docs/02-html-contract.md` 11.9.
3. CSS: copy the "Complete file" block unchanged. Do NOT add the `@media (scripting: none)` block of `base.css` to it (it is in `css/base.css` since M0; check with `grep -c "scripting: none" css/base.css`, expected at least `1`; when `0`, stop: defect of M0-T21).
4. Seeds: write the four fixture files with the exact HTML of the spec's "HTML contract".
5. Bindings: copy the complete code of `docs/06-bindings.md` 6.6 (React), 7.6 (Remix) and 8.6 (four Liquid blocks) for Tabs into the files. Where a code block differs from the spec's fixtures, the fixtures win (D-069): fix the binding, list the difference in the pull request.
6. `pnpm gen` (rewrites the generated regions: TSX header; Liquid `{% doc %}`, `{% schema %}`). `pnpm typecheck`.
7. Snapshot:

   ```bash
   pnpm build
   pnpm gen --snapshot tabs
   git diff --stat components/tabs/fixtures
   ```

   The command MUST exit 0. Compare each written file with the spec HTML (canonical equality: attribute order and whitespace do not count). Report every other difference in the pull request (recipe U step 3); a difference means the UI SDK writes something the spec does not print: do not hand-edit the snapshot.
8. Tests, then M3-R9 with `<id>` = `tabs`.

### Names and values

- Fixtures (4): `default` (id `t`, `defaultValue` `account`, list `ariaLabel` `Settings`, tabs `account` selected and `password`, panels `<p>Manage your profile.</p>` and `<p>Choose a new password.</p>`), `second-selected`, `escaping` (list `ariaLabel` `Say "hi" & <go>`), `class` (root `custom-a custom-b`; first tab `custom-c`; first panel `custom-d`). No `invalid-enum-falls-back`, no `responsive`.
- Exports: `Tabs`, `TabsList`, `TabsTab`, `TabsPanel`. React file starts with `"use client";`.
- Rules (7): `tabs-needs-list`, `tabs-one-list`, `tabs-one-selected-tab`, `tabs-needs-selected-tab`, `tabs-needs-selected-panel`, `tabs-tab-in-list`, `tabs-panel-in-tabs`.
- Liquid schema settings: none. Locale keys for printed strings: none.
- Traps: `ui-tabs-tab` has no class and prints `role="none"`; the class and rest props of `TabsTab` go on the `<button>`. An unselected panel prints only `class`, `value`, `hidden`, `data-slot`. The root never prints the attribute `value`.

### Tests (`components/tabs/tabs.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T3] tabs: AT-2 ...`: `upgradeDiff` on `fixturePageUrl("tabs/default")` with `allow: []`; assert `failures` empty, `undefinedTags` empty, and `report.sameValue` has exactly two records, both `type` `attributes`, `attributeName` `role`, `oldValue` `none`, `newValue` `none` |
| AT-3, AT-4, AT-5 | three `[T5]` tests on fixture `default`. No `[chromium]` |
| AT-6 | `[T5] tabs: AT-6 checkPattern tabs reports no problem` (`docs/13-testing.md` 5.5; copy the call from `components/dialog/dialog.test.ts`) |
| AT-7 | `[T5] tabs: AT-7 ...`, viewport 1000 by 700 |
| AT-8 | `[T6] tabs: AT-8 ...`, `scripts: "disabled"`; first statement: when `matchMedia("(scripting: none)").matches` is false, assert the default panel is visible and return |
| AT-9 | `[T6] tabs: AT-9 ...`, `scripts: "blocked"` |
| AT-10 | `[T4] tabs: AT-10 ...`: the controlled half (`value="account"`, an `onValueChange` that does not update state); the "no warning in both script orders" half is generic |
| AT-11 | `[T4] tabs: AT-11 ...` on `/__rp/morph/a?c=tabs` and `/__rp/morph/b?c=tabs` |
| AT-12 | comment, tier 9 form naming AT-2, AT-3, AT-4, AT-5 |
| rules | seven M3-R7 tests plus the default-fixture test |
| M3-R8 | `[T5] tabs: valuechange does not bubble and a write to the value property fires none`; `[T5] tabs: Tab moves from the selected tab to the shown panel` |

### Acceptance

M3-R9. `pnpm gen --snapshot tabs` exits 0 and a second run prints no `wrote components/tabs/fixtures/` line. `pnpm test:hydration --grep="tabs/" --no-skips` passes (first `ui` component hydrating in both script orders; retires risk R1). `ls components/tabs/fixtures | wc -l` prints `4`. `grep -c '"template"' components/tabs/tabs.json` prints `0`. When `components/toast/fixtures/default.html` exists: `pnpm test:upgrade --files=test/upgrade/bundles.test.ts --no-skips` passes with A-07, A-08, A-13 running.

### Out of scope

`orientation` (no such prop), disabled tabs, `ui-tabs-indicator`, `ui-tabs-tab-icon`. `src/elements/ui-tabs.ts` and the loader. Any import of `@ui-sdk/react`.

### If blocked

`pnpm gen` rejects a `ui` component without `template` (a message that names `template`, or `missing region` for a file this task wrote from doc 06): open a draft pull request quoting the message; this is PR-M3-4 and needs a ledger line from Ben (the alternative is extending the template language, which `docs/07-manifest-registry-cli.md` 2.1 forbids). A hydration warning in the generic `[T4]` tests: the fix is in `react/tabs.tsx` (an attribute printed by React that differs from the fixture); never add an entry to `test/hydration/react-allow.ts`. AT-5 fails (the veto is UNVERIFIED): keep the test, draft pull request with the observed behaviour; D-036 depends on it.

---

## M3-T05 Tooltip (`tooltip`)

- **Goal:** Ship Tooltip: the UI SDK tooltip family with the closed state printed by the server, triggered by a Button or IconButton that carries the prop `tooltip`.
- **Depends on:** M1-T01, M1-T03, M1-T04, M1-T11, M1-T12, M3-T03. AT-8 also needs Dialog (M1-T17); see "If blocked".
- **Kind / recipe:** `ui`, Liquid tier `parts`; recipe U. The component has a `template`; Remix, Liquid and html are generated; React is hand-written.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/tooltip.md` | whole file | 27 kB |
| `docs/10-components-interactive.md` | `### 0.2 `, `### 0.3 ` | 10 kB |
| `docs/06-bindings.md` | in `### 6.6 `: the Tabs React code (pattern of a `ui` binding: `useElement`, `suppressHydrationWarning`, rest first) | 5.5 kB |
| repository: `components/dialog/react/dialog.tsx` (the `useElement` call with `events`), `components/dialog/dialog.json`, `components/dialog/dialog.test.ts` | | 12 kB |
| repository: `components/icon-button/fixtures/tooltip-trigger.html`, `components/button/fixtures/tooltip-trigger.html` | | 1 kB |

### Files

Create: `components/tooltip/tooltip.json`, `tooltip.css`, `tooltip.test.ts`, `react/tooltip.tsx` (hand-written below the generated header). Generated (commit): `fixtures/*.html` (4, by the snapshot command), `html/tooltip.html`, `remix/tooltip.tsx`, `liquid/blocks/tooltip.liquid`, `tooltip-trigger.liquid`, `tooltip-content.liquid`, `liquid/locales/tooltip.json`, visual snapshots. Change: `locales/en.default.json` (M3-R5 name keys only). Conditional: `docs/components/tooltip.md` and `docs/04-elements.md` section 10.4, only as AT-8 says (Tests).

### Steps

1. Branch `task/M3-T05-tooltip`. Recipe U.
2. Manifest (M3-R4). `kind` `ui`; root `ui-tooltip`, class `rp-tooltip`, `requiresId` true; root prop `onOpenChange` with `hosts: ["react"]`. Part `trigger`: element `ui-tooltip-trigger`, no class, no props. Part `content`: element `ui-tooltip-content`, class `rp-tooltip-content`, props `tooltip` (required), `side` (`top bottom start end`, default `top`), `align` (`start center end`, default `center`); `side` and `align` are Liquid settings on the content block and have `attribute` `side` / `align` (never `data-side`, `data-align`). Content template attributes in this order: `class`, `side` (`when` not eq `top`), `align` (`when` not eq `center`), `hidden` (presence), `id` (prop `tooltip`, suffix `-content`), `role` `tooltip`, `data-closed` (presence), `data-slot` `tooltip-content`. `state[]`: the rows of the spec's table on the content, ordered so that the Remix list comes out as `data-align data-closed data-instant data-open data-side hidden popover style`. `events[]`: `openchange` / `onOpenChange`. `upgradeAllow` `[]`. `noJs.level` `none`. `a11y.checkPattern` null. `agent`: `bridge`, `ui-tooltip`, action `setOpen`. `dependencies.uiSdk` `["@ui-sdk/web/tooltip"]`; `dependencies.components` `button`, `icon-button`, `icon`.
3. Fixtures (4), `generated: "upgrade-snapshot"`. The trigger part's `children` is the literal button HTML the spec prints inside `<ui-tooltip-trigger>` for that fixture (for `default` it MUST equal the content of `components/icon-button/fixtures/tooltip-trigger.html`: copy the file content).
4. CSS: copy the "Complete file" block unchanged.
5. `pnpm gen`. Then write `react/tooltip.tsx` below the generated header from the spec's Host notes (React bullet): first line `"use client";`; `Tooltip` holds a ref and calls `useElement(ref, { events: { openchange: ... } })` forwarding to `onOpenChange(detail.value, detail)`; `TooltipTrigger` is exactly `({ children }) => <ui-tooltip-trigger suppressHydrationWarning>{children}</ui-tooltip-trigger>`; `TooltipContent` validates `side` and `align`, prints them only when not `top` / `center`, and prints `hidden`, `role="tooltip"`, `data-closed=""`, `data-slot="tooltip-content"`, `suppressHydrationWarning`. Rest props first; no controlled prop.
6. Check generated files: `liquid/blocks/tooltip-trigger.liquid` body is exactly `<ui-tooltip-trigger>{{ content }}</ui-tooltip-trigger>` (no `class`, no `attributes`); `remix/tooltip.tsx` prints `data-rmx-key` on `ui-tooltip` and the preserve list of step 2 on `ui-tooltip-content`. `grep -c 'data-rmx-preserve-attrs' components/button/remix/button.tsx components/icon-button/remix/icon-button.tsx` prints at least `1` for each (D-132; when `0`, note it in the pull request: defect of M1-T01 or M1-T04, do not fix here).
7. `pnpm build && pnpm gen --snapshot tooltip`. MUST exit 0: this is the re-capture the spec calls "PENDING RE-CAPTURE". Compare with the spec HTML as in recipe U step 3.
8. Tests, then M3-R9 with `<id>` = `tooltip`.

### Names and values

- Fixtures (4): `default` (id `size-tip`; IconButton `icon="info"`, `ariaLabel="Sizing information"`, `tooltip="size-tip"`; text `Runs small`), `placement` (id `ship-tip`; Button `Shipping`; content `side` `bottom`, `align` `start`; text `Free over $50`), `invalid-enum-falls-back` (id `w1`; content `side` `bogus`; text `Text`), `class` (id `w2`; root `custom-a custom-b`).
- Exports: `Tooltip`, `TooltipTrigger`, `TooltipContent`.
- Rules (5): `tooltip-needs-trigger`, `tooltip-needs-content`, `tooltip-no-link-trigger`, `tooltip-one-trigger`, `tooltip-content-is-text`.
- Locale keys for printed strings: none.

### Tests (`components/tooltip/tooltip.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3, AT-4, AT-5, AT-6 | four `[T5]` tests on fixture pages; durations of the spec as `waitForFunction` timeouts (M3-R13). AT-3 and AT-4 without `[chromium]` |
| AT-7 | `[T5] tooltip: AT-7 ...`: once with `{ js: "off" }` (before upgrade) and once after `settled` |
| AT-8 | `[T5] tooltip: AT-8 ...`: M3-R11 page = `components/button/fixtures/dialog-opener.html`, then `components/dialog/fixtures/default.html` with the Tooltip fixture `default` HTML inserted directly before `</dialog>`. Open the dialog with the opener, focus the trigger with Tab, press Escape once. When the observed result is "both close": change item 5 of "Behaviour with JavaScript" and AT-8 in `docs/components/tooltip.md` and the same sentence in `docs/04-elements.md` 10.4 to say that Escape closes both, assert that, and list it in the pull request (the spec allows exactly this) |
| AT-9 | `[T5] tooltip: AT-9 ...` |
| AT-10 | `[T4] tooltip: AT-10 ...` (`onOpenChange` on hover); the hydration half is generic |
| AT-11 | `[T6] tooltip: AT-11 ...`, `scripts: "disabled"` |
| AT-12 | comment, tier 9 form naming AT-3, AT-4 |
| owed | `[T2] tooltip: button AT-9 the Button tooltip-trigger fixture equals the trigger of fixture placement` and `[T2] tooltip: icon-button AT-7 the IconButton tooltip-trigger fixture equals the trigger of fixture default` (deferred by M1-T01 and M1-T04; statements in `docs/components/button.md` item 9 and `docs/components/icon-button.md` item 7; compare canonical forms after the replacements item 9 names) |
| rules | five M3-R7 tests plus the default-fixture test |

### Acceptance

M3-R9. `pnpm gen --snapshot tooltip` exits 0 and a second run writes no fixture. `ls components/tooltip/fixtures | wc -l` prints `4`. `grep -c 'data-side\|data-align' components/tooltip/fixtures/*.html` prints `0` for every file. `pnpm test:hydration --grep="tooltip/" --no-skips` passes.

### Out of scope

A link trigger; `toggleable`; an arrow (`ui-tooltip-arrow`); `delay` props. Changes to Button or IconButton.

### If blocked

`components/dialog/fixtures/default.html` does not exist (M1-T17 not done): do not write a skip; pick another task until it is. The snapshot records a mutation (exit 1) because of the trigger's `data-variant`, `data-size` or `<svg>`: draft pull request with the failure line; the contract of D-082 has to change, which is Ben's decision. The generator prints `class` or `attributes` in `tooltip-trigger.liquid`: M3-R10 does not apply (no single spec-named rule in the generator docs); draft pull request, ledger issue of `docs/06-bindings.md` ("a part that accepts neither class nor attributes").

---

## M3-T06 `toast()` function and lazy Toast chunk load on first call

- **Goal:** Prove with tests E-03, E-16 and E-27 that `toast()` loads the `toast` and `shared` chunks on its first call and never because a `ui-toast-region` is in the document.
- **Depends on:** M1-T01.
- **Kind:** `runtime`.

The source already exists: `src/elements/index.ts` (the `toast` function, `ToastOptions`, `registerLazy("toast", null, ...)`), `src/elements/ui-toast.ts` and `src/runtime/loader.ts` were copied from the spec by M0-T25 and M0-T26. This task verifies them and adds the tests.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/04-elements.md` | `### 4.1 Source entry points` (the complete `src/elements/index.ts` and `ui-toast.ts`) | 6 kB |
| `docs/04-elements.md` | `### 3.2 ` (behaviour list items 1 to 6; not the code), `### 10.6 Toast` | 5 kB |
| `docs/04-elements.md` | in `## 13. Acceptance tests`: rows E-03, E-16, E-27 | 2 kB |
| `docs/04-elements.md` | `### 8.1 ` (the `rp-quantity` markup used by E-03) | 2 kB |
| `docs/00-decisions.md` | D-083 (search `D-083`), D-124 (search `#### D-124`) | 3 kB |
| repository: `src/elements/index.ts`, `src/elements/ui-toast.ts`, `src/elements/rp-dialog.test.ts` (the page handler of M3-R11) | | 6 kB |

### Files

Create: `src/elements/ui-toast.test.ts`. Change `src/elements/index.ts` or `src/elements/ui-toast.ts` ONLY where step 2 finds a difference from the spec text.

### Steps

1. Branch `task/M3-T06-toast-function`. `pnpm build`.
2. Compare `src/elements/index.ts` with the block "`src/elements/index.ts` (complete)" of section 4.1. Allowed differences: the `import "./rp-<name>"` lines of elements not built yet (a `PLAN 4.4` comment stands in their place). Everything from `type ToastOptions` to the last `export` line MUST be byte-equal; make it so. Same for `src/elements/ui-toast.ts`.
3. Write the tests (M3-R11, M3-R12). The Toast markup is the fixture `default` block of section 10.6, as a string literal. Call the helper in the page as the main file's export: `await page.evaluate(async () => { const m = await import("/ripple.elements.js"); await m.toast("Saved") })` (second E-27 run: `/ripple.js`, and the page's script tag is `/ripple.js`). Record requests with `page.on("request")`; compare by file name.
4. Proof.

### Tests (`src/elements/ui-toast.test.ts`)

- `[T5] ui-toast: E-27 ripple.elements.js requests the toast and shared chunks only on the first toast() call`: body = the Toast markup only. For 1000 ms after `load` (duration stated by E-27): no request for `ripple.elements-toast.js` or `ripple.elements-shared.js`; `customElements.get("ui-toast-region")` is `undefined`; a `MutationObserver` on the region recorded nothing. After the call: each of the two chunks requested exactly once; a `ui-toast` whose text contains `Saved` is inside the region.
- `[T5] ui-toast: E-27 ripple.js requests the toast and shared chunks only on the first toast() call`: the same with `ripple.js`, `ripple-toast.js`, `ripple-shared.js`. When `ripple.js` logs an error because the page has no commerce configuration, add to `<head>`, before the script, the element `<script type="application/json" id="rp-commerce">{"host":"html","cartEndpoint":"/api/cart","cartUrl":"/cart","initialCart":{"cart":null}}</script>` (the text of `docs/13-testing.md` 5.2) and answer `GET /api/cart` with `{"cart":null}`.
- `[T5] ui-toast: E-16 the first toast() shows a toast and a second call requests no script`: `toast("Saved")`, then `toast("Again")`; `ripple.elements-toast.js` requested exactly once in total.
- `[T5] ui-toast: E-03 a page with rp-quantity and an empty toast region requests only the main file`: body = the markup of section 8.1, then the Toast markup; for 1000 ms after `load` the only script request is `ripple.elements.js`.

### Acceptance

```bash
pnpm typecheck && pnpm build
pnpm test:run --tiers=5 --files=src/elements/ui-toast --no-skips     # 4 passed, 0 failed, 0 skipped
grep -c 'registerLazy("toast", null' src/elements/index.ts           # 1
pnpm test:size && pnpm ci
```

### Out of scope

The Toast component, its CSS and bindings (M3-T07). Toast acceptance tests AT-2 to AT-9. E-01, E-02, E-04, E-20, E-25 (M3-T10). Toast actions. Any new export.

### If blocked

The `toast` chunk in `pkg/browser/` is an empty module (M0-T27 built it from a stub): `src/elements/ui-toast.ts` is still a stub; replace it with the two lines of section 4.1 and rebuild. `@ui-sdk/web` does not export `toast`: stop, draft pull request quoting `node_modules/@ui-sdk/web/package.json` `exports`.

---

## M3-T07 Toast (`toast`)

- **Goal:** Ship Toast: the page's one empty `ui-toast-region` (root class `rp-toast`) in all four hosts, with the CSS for the toasts UI SDK creates in it.
- **Depends on:** M1-T11, M1-T12, M3-T03, M3-T06.
- **Kind / recipe:** `ui`, Liquid tier `block`; recipe U. The component has a `template`; Remix, Liquid and html are generated; React is hand-written and has NO hook.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/toast.md` | whole file | 27 kB |
| `docs/10-components-interactive.md` | `### 0.2 `, `### 0.3 ` | 10 kB |
| `docs/02-html-contract.md` | in `### 7.3 `, the row of entry 2 (Toast) | 1 kB |
| repository: `components/dialog/dialog.json`, `components/dialog/dialog.test.ts`, `components/button/react/button.tsx` (a React binding without hooks), `test/upgrade/upgrade.test.ts`, `src/elements/ui-toast.test.ts` | | 15 kB |

### Files

Create: `components/toast/toast.json`, `toast.css`, `toast.test.ts`, `react/toast.tsx` (hand-written below the generated header). Generated (commit): `fixtures/*.html` (5, by the snapshot command), `html/toast.html`, `remix/toast.tsx`, `liquid/blocks/toast.liquid`, `liquid/locales/toast.json`, visual snapshots. Change: `locales/en.default.json`; `test/upgrade/upgrade.test.ts` (one assertion, step 7). May change: `test/upgrade/bundles.test.ts` (section 0.5).

### Steps

1. Branch `task/M3-T07-toast`. Recipe U.
2. Manifest (M3-R4). `kind` `ui`; root `ui-toast-region`, class `rp-toast`, `requiresId` false; `content.model` `none`; no parts. Props: `ariaLabel` (default `{ "t": "ripple.toast.label" }`), `closeLabel` (default `{ "t": "ripple.toast.close" }`), `side` (`top bottom`, default `bottom`), `align` (`start center end`, default `end`); `side` and `align` are Liquid settings. Template attributes in this order: `class`, `side` (value prop `side`, `when` eq `top`), `align` (value prop `align`, `when` not eq `end`), `aria-label`, `data-close-label`, `data-slot` `toast-region`, `data-side`, `data-align`, `popover` `manual`. `state[]`: the root rows of the spec's table whose writer is the element, ordered so that the Remix list comes out as `aria-keyshortcuts aria-label data-align data-expanded data-side popover role style`. `upgradeAllow`: the ONE entry of the spec, key for key (it MUST equal entry 2 of `docs/02-html-contract.md` 7.3). `noJs.level` `none`. `agent`: `bridge`, `ui-toast-region`, action `pause`. `dependencies.uiSdk` `["@ui-sdk/web/toast"]`; `dependencies.locale` the two keys.
3. Locale: `ripple.toast.label` = `Notifications`, `ripple.toast.close` = `Dismiss` (plus M3-R5 name key).
4. CSS: copy the "Complete file" block unchanged.
5. `pnpm gen`. Write `react/toast.tsx` below the generated header from the spec's Host notes (React bullet): no `"use client"`, no hook, the root with `suppressHydrationWarning` and no children, defaults `ariaLabel = "Notifications"`, `closeLabel = "Dismiss"`; it MUST NOT import `<pkg>/elements` and MUST NOT export `toast`. Compare `liquid/blocks/toast.liquid` with the complete block the spec prints; compare `remix/toast.tsx` with the Remix bullet (optional `rmxKey`; the preserve list).
6. `pnpm build && pnpm gen --snapshot toast`. MUST exit 0. Expected result: each fixture equals its seed, because nothing upgrades the region before a `toast()` call (D-083; M3-T03 skips the `toast` chunk's tags).
7. Generic tier 3 (PR-M3-5). In `test/upgrade/upgrade.test.ts`, the assertion `assert.deepEqual(report.undefinedTags, [])` cannot hold for a page with `ui-toast-region`. Replace that one line by:

   ```ts
   // D-083: the toast chunk loads only on the first toast() call, so its tags stay undefined at upgrade.
   assert.deepEqual(report.undefinedTags.filter((tag) => !ON_CALL_TAGS.includes(tag)), [])
   ```

   and add at module top level:

   ```ts
   const ELEMENTS = JSON.parse(readFileSync("src/gen/elements.json", "utf8")) as Record<string, { chunk: string }>
   const ON_CALL_TAGS = Object.keys(ELEMENTS).filter((tag) => ELEMENTS[tag].chunk === "toast")
   ```

   (`import { readFileSync } from "node:fs"`). Record this under "Deviations and ledger issues" and add a `## Ledger issues` line to `docs/13-testing.md` (U3-2, UD-4). When another generic test fails ONLY because `ui-toast-region` is undefined, apply the same filter there and list the file.
8. Tests, then M3-R9 with `<id>` = `toast`.

### Names and values

- Fixtures (5), `generated: "upgrade-snapshot"`: `default` (no props), `placement` (`side` `top`, `align` `center`), `escaping` (`ariaLabel` `Say "hi" & <go>`), `invalid-enum-falls-back` (`side` `bogus`), `class` (`custom-a custom-b`).
- Export: `Toast` only.
- Rules (4): `toast-one-region`, `toast-region-needs-label`, `toast-region-empty`, `toast-region-placement`. The second and third apply to server HTML only; the manifest rule format has no key for that (see "If blocked").
- Helper import in tests: `const m = await import("/pkg/browser/ripple.elements.js")` inside `page.evaluate` on a fixture page (the same URL the fixture page loads, so the same module instance).

### Tests (`components/toast/toast.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T3] toast: AT-2 ...`: install the recorder with `upgradeDiff` on `fixturePageUrl("toast/default")` with the manifest `upgradeAllow`, then call `toast("x")` in the page and read the records again (`window.__rpUpgradeRecords`); assert the statements of AT-2 |
| AT-3 | `[T5] toast: AT-3 the chunk is not requested until the first toast() call` (this is also the Toast row of `docs/13-testing.md` 10.2: one request after the first call, none after the second) |
| AT-4 to AT-9 | six `[T5]` tests. AT-7's second half: an M3-R11 page with fixture `default` in which `data-close-label="Dismiss"` is replaced by `data-close-label="Fermer"`. AT-8: an M3-R11 page with no region. AT-9: viewport 1000 by 700. AT-4 and AT-6 without `[chromium]` |
| AT-10 | comment, generic (`test/hydration/react.test.ts`) |
| AT-11 | `[T6] toast: AT-11 ...`, `scripts: "disabled"` |
| AT-12 | comment, tier 9 form naming AT-4, AT-6 |
| rules | four M3-R7 tests plus the default-fixture test |

### Acceptance

M3-R9. `pnpm gen --snapshot toast` exits 0. `ls components/toast/fixtures | wc -l` prints `5`. `grep -c '"use client"' components/toast/react/toast.tsx` prints `0`. `grep -c 'elements"' components/toast/react/toast.tsx` prints `0`. `grep -c 'rp-toast-region' -r components/toast` prints `0` for every file. When `components/tabs/fixtures/default.html` exists: `pnpm test:upgrade --files=test/upgrade/bundles.test.ts --no-skips` passes with A-07, A-08, A-13 running.

### Out of scope

`src/elements/index.ts` and the `toast()` helper (M3-T06). Toast actions; an `id` prop; a second region. The `layout` blueprint that prints the region (M7). Calls to `toast()` from commerce elements.

### If blocked

Rules `toast-region-needs-label` and `toast-region-empty` fire on the component's own tests in a way that depends on "server HTML only": run the checker in the rule tests with the option that marks the input as server HTML (read `src/check/index.ts` for the option; the spec text is "documents with `serverHtml: true`"). When RP113 has no way to restrict a manifest rule to server HTML, keep both rules unrestricted, and add a `## Ledger issues` line to `docs/07-manifest-registry-cli.md` (section 9.5.3). A `toast.css` selector of the form `.rp-toast :where(...)` is rejected by the CSS lint: defect of M0-T24 (`docs/10-components-interactive.md` 0.3 item 3 requires it to be accepted); draft pull request. AT-4 to AT-7 or AT-9 fail because a state selector in `toast.css` names an attribute UI SDK does not write: correct that selector to the attribute observed (the spec's "Evidence and UNVERIFIED" allows exactly this), list it.

---

## M3-T08 Element `rp-carousel` (`src/elements/rp-carousel.ts` and test)

- **Goal:** Ship the `rp-carousel` element from the spec's complete source, with test E-14.
- **Depends on:** M1-T14.
- **Kind / recipe:** `element`; recipe E.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/04-elements.md` | `## 7. Rules for writing an ` | 6 kB |
| `docs/04-elements.md` | `### 9.2 ` | 11.5 kB |
| `docs/04-elements.md` | `### 10.9 Carousel` (the markup to put on the page) | 2.5 kB |
| `docs/04-elements.md` | in `## 13. Acceptance tests`: row 8 of the "Page P" table and row E-14 | 2 kB |
| `docs/research/spikes/elements-runtime/test.mjs` | search `carousel` (the spike form of E-14; port, do not copy the page) | 2 kB of 19 kB |
| `docs/research/spikes/rp-root-only-primitive/README.md` | `## Verdict` | 1 kB |
| repository: `src/elements/index.ts`, `src/elements/rp-dialog.test.ts` | | 6 kB |

### Files

Create (or replace a bring-up stub at the path): `src/elements/rp-carousel.ts`, `src/elements/rp-carousel.test.ts`. Change: `src/elements/index.ts` (one line, step 3). MUST NOT change: `src/gen/elements.json`, `src/runtime/**`.

### Steps

1. Branch `task/M3-T08-rp-carousel`.
2. Copy the block "`src/elements/rp-carousel.ts` (complete)" of section 9.2 unchanged into the file.
3. `src/elements/index.ts`: when the line `import "./rp-carousel"` is absent, add it at the position section 4.1 of `docs/04-elements.md` gives it: after `import "./rp-dialog"` and before `import "./rp-quantity"` (when the `PLAN 4.4` comment of M0-T26 stands in place of missing lines, keep that comment while any of the four `rp-*` imports is still missing, and keep the present imports in the order `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`). Change nothing else.
4. `pnpm typecheck && pnpm build`. `pkg/browser/ripple.elements.js` now defines `rp-carousel`.
5. Test page (M3-R11, M3-R12): the Carousel markup of section 10.9 (`id="featured"`) and, in `<head>`, this test-only style, in this order:

   ```html
   <style>
   /* PR-M3-7: layout declarations of docs/components/carousel.md, Styling rule 1; carousel.css arrives with M3-T09 */
   #featured-list { display: flex; overflow-x: auto; scroll-snap-type: inline mandatory; margin: 0; padding: 0; list-style: none; }
   #featured-list > li { scroll-snap-align: start; }
   /* E-14, page P row 8 */
   #featured-list { inline-size: 200px; }
   #featured-list > li { flex: 0 0 200px; }
   </style>
   ```

   `openPage()` default `reducedMotion: "reduce"` makes every element scroll instant.
6. Proof.

### Names and values

- Tag `rp-carousel`. Parts by `data-rp-part`: `viewport`, `item`, `prev`, `next`.
- Event `indexchange`; `detail.value` number; `detail.reason` one of `next-press`, `previous-press`, `scroll`, `imperative`.
- `api` keys: `getIndex`, `next`, `previous`, `goTo`. Property `index` (a write jumps without event).
- The only DOM writes are `disabled` on the two buttons.

### Tests (`src/elements/rp-carousel.test.ts`)

- `[T5] rp-carousel: E-14 next, goTo, index, wheel scroll and a cancelled indexchange` : the steps and expectations of row E-14, in order, in one test. Between steps wait until no `scroll` event has fired for 200 ms (duration stated by E-14). No `[chromium]` (E-14 is marked X).
- `[T3] rp-carousel: upgrade writes nothing when one of three items fits`: a `MutationObserver` installed by a classic script at the end of `<body>` records zero attribute changes inside `rp-carousel` after `customElements.whenDefined("rp-carousel")` and two animation frames (with one of three items fitting, `next` stays enabled and `prev` already has `disabled`).

### Acceptance

```bash
pnpm typecheck && pnpm build
pnpm test:run --tiers=3,5 --files=src/elements/rp-carousel --no-skips   # 2 passed, 0 failed, 0 skipped
grep -c "definePrimitive(" src/elements/rp-carousel.ts                  # 1
grep -c "createParts(" src/elements/rp-carousel.ts                      # 1
grep -c 'import "./rp-carousel"' src/elements/index.ts                  # 1
pnpm test:size && pnpm ci
```

### Out of scope

The Carousel component, `carousel.css`, bindings (M3-T09). The agent test E-17 for `rp-carousel` (M3-T10). `default-index` as a prop. Auto-rotation, looping. Any change to the code of section 9.2: when it does not compile or E-14 fails, fix the smallest thing and list the difference from the spec in the pull request under "Notes for later tasks".

### If blocked

SPIKE-04 verdict `FALLBACK required`: do not start; wait for the follow-up row (PLAN 7.2). Verdict `DEFAULT holds (Chromium only)`: build the default path. A size budget failure: stop, draft pull request with the measured sizes (PLAN 7.3).

---

## M3-T09 Carousel (`carousel`)

- **Goal:** Ship Carousel: a native scroll-snap list with Previous and Next buttons driven by `rp-carousel`, in all four hosts.
- **Depends on:** M1-T03, M1-T11, M1-T12, M3-T08.
- **Kind / recipe:** `native`, Liquid tier `parts`; recipe N.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/carousel.md` | whole file | 34 kB |
| `docs/10-components-interactive.md` | `### 0.2 `, `### 0.3 ` | 10 kB |
| `docs/13-testing.md` | `### 9.1 ` items 1 to 3, `### 9.2 ` | 4 kB |
| repository: `components/quantity-input/quantity-input.json`, `components/quantity-input/react/quantity-input.tsx`, `components/quantity-input/quantity-input.test.ts` | the model: a `native` component whose root prints its own buttons with embedded Icons and `data-rp-js="inflow"` | 12 kB |

Do not read `docs/04-elements.md` section 9.2 (the element exists).

### Files

Create: `components/carousel/carousel.json`, `carousel.css`, `carousel.test.ts`, `react/carousel.tsx` (hand-written below the generated header). Generated (commit): `fixtures/*.html` (4), `html/carousel.html`, `remix/carousel.tsx`, `liquid/blocks/carousel.liquid`, `carousel-item.liquid`, `liquid/locales/carousel.json`, visual snapshots. Change: `locales/en.default.json`.

### Steps

1. Branch `task/M3-T09-carousel`. Recipe N.
2. Manifest (M3-R4). Root `rp-carousel`, class `rp-carousel`, `requiresId` true. Props: `id`, `ariaLabel` (required), `columns` (enum `1` to `6`, responsive, no default; prints `data-columns` when set), `previousLabel` (default `{ "t": "ripple.carousel.previous" }`), `nextLabel` (default `{ "t": "ripple.carousel.next" }`), `onIndexChange` with `hosts: ["react"]`. Parts: `prev`, `viewport`, `next` printed by the component; `item` (`li`, class `rp-carousel-item`, `data-rp-part="item"`) authored by the author, multiple. Root template: the three children in the order prev button, viewport `ul` (holding the slot), next button; attributes exactly as fixture `default` prints them; the buttons embed Icon `chevron-left` and `chevron-right`; `disabled` is printed on prev only. `state[]`: `disabled` on `prev` and `disabled` on `next`, both `writer` `element`. `events[]`: `indexchange` / `onIndexChange`. `upgradeAllow`: the one entry of the spec. `noJs.level` `degraded`; `noJs.hideUntilDefined` the two selectors of the spec. `agent`: `bridge`, `rp-carousel`, actions `next`, `previous`, `goTo`. `dependencies.components` `icon`; `dependencies.icons` `chevron-left`, `chevron-right`.
3. Locale: `ripple.carousel.previous` = `Previous`, `ripple.carousel.next` = `Next` (plus M3-R5 name keys).
4. CSS: copy the "Complete file" block unchanged (it holds the 6 base and 30 breakpoint `data-columns` rules).
5. `pnpm gen`. Compare `liquid/blocks/carousel.liquid` with the complete block the spec prints, and `remix/carousel.tsx` with the Remix bullet (`data-rmx-key` on the root; `data-rmx-preserve-attrs="disabled"` on both buttons).
6. Write `react/carousel.tsx` below the generated header from the Host notes (React bullet): `"use client";`; `useElement(ref, { events: { indexchange: ... } })` forwarding to `onIndexChange(detail.value, detail)`; `suppressHydrationWarning` on `rp-carousel` and both buttons; the buttons have constant props (`disabled` true on prev, absent on next); `<Icon name="chevron-left" />`, `<Icon name="chevron-right" />` imported from `./icon`; defaults `previousLabel = "Previous"`, `nextLabel = "Next"`; no controlled prop. Model: `components/quantity-input/react/quantity-input.tsx`.
7. Tests, then M3-R9 with `<id>` = `carousel`.

### Names and values

- Fixtures (4), `generated: "template"`: `default` (id `featured`, `ariaLabel` `Featured products`, three items `<p>One</p>`, `<p>Two</p>`, `<p>Three</p>`), `responsive` (the same with `columns` `2 md:4`), `escaping` (id `looks`, `ariaLabel` `Say "hi" & <go>`, `previousLabel` `Previous look`, `nextLabel` `Next look`, one item), `class` (id `w2`, `ariaLabel` `Items`, root `custom-a custom-b`, one item `custom-c`). No `invalid-enum-falls-back`.
- Exports: `Carousel`, `CarouselItem`. Liquid schema settings: none.
- Rules (6): `carousel-needs-label`, `carousel-needs-viewport`, `carousel-one-viewport`, `carousel-item-in-viewport`, `carousel-controls-outside-viewport`, `carousel-not-nested`.
- Eight-item page for tests (M3-R11): fixture `responsive` with the three `<li>` replaced by eight lines `<li class="rp-carousel-item" data-rp-part="item"><p>N</p></li>`.
- Traps: both buttons use the class `rp-carousel-control` (not `rp-icon-button`); the CSS MUST NOT hide the buttons before upgrade (the generated `[data-rp-js="inflow"]` rule of `base.css` does) and MUST NOT set `scroll-behavior`; no `default-index` or `index` attribute is ever printed.

### Tests (`components/carousel/carousel.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T3] carousel: AT-2 ...`: two `upgradeDiff` runs at viewport 1000 by 700 with the manifest `upgradeAllow`: (a) fixture `responsive` with the test-only style `.rp-carousel-item { block-size: 300px; }`: `report.permitted` has exactly one record (`disabled` on the next button), `failures` empty; (b) the eight-item page: `permitted` and `failures` empty |
| AT-3 | `[T3] carousel: AT-3 ...` (boxes with `{ js: "off" }` and after `settled`; computed `visibility`) |
| AT-4 to AT-10 | seven `[T5]` tests. AT-4, AT-5, AT-6, AT-10: the eight-item page at 1000 by 700. AT-7: 1000 by 700, then 600 by 700. AT-8: `<html dir="rtl">`, 600 by 700. AT-4, AT-5, AT-8 without `[chromium]` |
| AT-11 | `[T6] carousel: AT-11 ...`, `scripts: "disabled"`, the eight-item page |
| AT-12 | `[T4] carousel: AT-12 ...`: the `onIndexChange` half with eight items; the hydration half is generic |
| AT-13 | `[T4] carousel: AT-13 ...` on `/__rp/morph/a?c=carousel` and `/__rp/morph/b?c=carousel` (the routes render the `default` fixture: three items; when everything fits at the default viewport, set the viewport to 375 by 720 so that Next is enabled, and say so in the pull request) |
| AT-14 | comment, tier 9 form naming AT-4, AT-5, AT-8 |
| rules | six M3-R7 tests plus the default-fixture test |
| M3-R8 | `[T5] carousel: api keys are getIndex, next, previous, goTo` (compare the sorted key list); `[T5] carousel: paging works after the items are replaced and after the root is re-inserted` (`docs/13-testing.md` 10.2, `rp-*` row); `[T5] carousel: indexchange does not bubble` |

### Acceptance

M3-R9. `ls components/carousel/fixtures | wc -l` prints `4`. `ls components/carousel/liquid/blocks | wc -l` prints `2`. `grep -c '"use client"' components/carousel/react/carousel.tsx` prints `1`. `grep -c 'disabled' components/carousel/fixtures/default.html` prints `1`. `pnpm test:size` passes (component CSS at most 6,000 bytes minified).

### Out of scope

ProductGallery and FeaturedCollection (they compose this contract in M4 and M5). A slide picker, auto-rotation, `defaultIndex`. `src/elements/rp-carousel.ts`. The spec's `### Fallback (SPIKE-04)`.

### If blocked

`pnpm gen` writes a Liquid block or a fixture that differs from the spec: fix the manifest template; when the generator is wrong, draft pull request (M3-R10: no conditional generator file in this task). `carousel.css` exceeds 6,000 bytes minified: stop, draft pull request with the measured size (D-064 is a ledger value).

---

## M3-T10 Element acceptance completion

- **Goal:** Give every row of `docs/04-elements.md` section 13 that is not covered yet (loader, chunks, polyfill, opener, page-level checks) a passing test, except rows about `rp-navigation-menu`.
- **Depends on:** M3-T04, M3-T05, M3-T07, M3-T09. It also reads fixtures of `button`, `icon-button`, `dialog`, `drawer`, `quantity-input`, `accordion` and uses the agent entry: M1-T15, M1-T17, M1-T18, M1-T40 and M3-T02 MUST be done (check `docs/plan/done/`).
- **Kind:** `harness`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/04-elements.md` | `## 13. Acceptance tests` | 15 kB |
| `docs/04-elements.md` | `### 3.3 ` (the numbered item list only, not the code); `### 5.4 ` (the import map of the Liquid form, for E-20) | 5 kB |
| `docs/research/spikes/elements-runtime/` | `test-polyfill.mjs`, `test-liquid.mjs`; in `test.mjs` the checks named `upgrade:`, `loader:`, `opener`, `agent:`, `static` | 8 kB |
| repository: `src/elements/rp-dialog.test.ts`, `src/elements/rp-quantity.test.ts` (the E-17 test), `src/elements/ui-toast.test.ts` | | 12 kB |

### Files

Create: `src/runtime/loader.test.ts`, `src/runtime/opener.test.ts`, `src/runtime/commands-polyfill.test.ts`, `src/runtime/index.test.ts`. Change (add tests): `src/elements/rp-dialog.test.ts`, `src/elements/rp-carousel.test.ts`. No source file changes.

### Page P in M3 (PR-M3-9)

One M3-R11 page with `/ripple.elements.js` whose `<main>` holds, in this order, the content of these files: `components/button/fixtures/dialog-opener.html`; `components/dialog/fixtures/default.html` with the content of `components/icon-button/fixtures/dialog-closer.html` inserted directly before `</dialog>`; the Drawer link opener (the `<a ... data-rp-open="filters">` printed in `docs/04-elements.md` section 10.2) then `components/drawer/fixtures/default.html`; `components/tooltip/fixtures/default.html`; `components/toast/fixtures/default.html`; `components/tabs/fixtures/default.html`; `components/accordion/fixtures/single.html`; `components/carousel/fixtures/default.html` with the test-only style of page P row 8; `components/quantity-input/fixtures/default-value.html`. Item 10 (NavigationMenu) is absent. Put the page builder in one helper function at the top of `src/runtime/index.test.ts` and copy it (not import it) where another file needs it.

### Tests

Row status and file (PR-M3-8). "exists" means: check with `grep -rn "E-<nn> " src/` and do nothing when found.

| Row | File | Test name starts with | Note |
|---|---|---|---|
| E-01 | `src/runtime/index.test.ts` | `[T3] index: E-01 ` | page P; NavigationMenu clause omitted; no `[chromium]` |
| E-02, E-04, E-25 | `src/runtime/loader.test.ts` | `[T5] loader: E-02 `, `E-04 `, `E-25 ` | E-25 is about an error message: assert the one `console.error` and filter it before the final errors assertion |
| E-03, E-16, E-27 | `src/elements/ui-toast.test.ts` | exists (M3-T06) | |
| E-05 to E-09, E-11, E-12 | `src/elements/rp-dialog.test.ts` | exists (M1-T16) | |
| E-10 | `src/runtime/opener.test.ts` | `[T5] opener: E-10 ` | when `components/drawer/drawer.test.ts` already has a test named with `E-10`, do nothing; no `[chromium]` |
| E-13, E-26 | `src/elements/rp-quantity.test.ts` | exists (M1-T13) | |
| E-14 | `src/elements/rp-carousel.test.ts` | exists (M3-T08) | |
| E-15 | none | | M5-T10 / M5-T11 |
| E-17 | `src/elements/rp-dialog.test.ts`, `src/elements/rp-carousel.test.ts` | `[T5] rp-dialog: E-17 `, `[T5] rp-carousel: E-17 ` | model: the E-17 test in `src/elements/rp-quantity.test.ts` |
| E-18 | `src/runtime/index.test.ts` | `[T5] index: E-18 ` | NavigationMenu omitted |
| E-19 | `src/runtime/index.test.ts` | `[T6] index: E-19 ` | `scripts: "disabled"`; the link route `/collections/all` answers 200; NavigationMenu clause omitted; no `[chromium]`; the dialog clause only when `"commandForElement" in HTMLButtonElement.prototype` |
| E-20, E-21 | `src/runtime/index.test.ts` | `[T5] index: E-20 `, `[T1] index: E-21 ` | need `pkg/registry/liquid/assets/`; see "If blocked" |
| E-22 | `src/runtime/index.test.ts` | comment `// E-22: generic (src/gen/size.test.ts)` plus `[T10] index: E-22 pkg/browser holds exactly the 12 files of D-054` | the file-count clause only; the 6 Liquid files only when the directory exists |
| E-23 | `src/runtime/commands-polyfill.test.ts` | `[T5] commands-polyfill: E-23 ` | Chromium: `addInitScript` deletes `HTMLButtonElement.prototype.commandForElement`; no `[chromium]` |
| E-24 | `src/runtime/index.test.ts` | `[T1] index: E-24 ` | static check over every existing `src/elements/rp-*.ts` and `src/commerce/rp-*.ts` |
| E-28 | `src/runtime/commands-polyfill.test.ts` | `[T1] commands-polyfill: E-28 ` | second sentence (the string `button[commandfor]` occurs once in each main file and in no chunk) now; first sentence needs `rp-head`, see "If blocked" |
| E-29 | `src/runtime/index.test.ts` | `[T5] index: E-29 ` | |
| E-30 | `src/runtime/index.test.ts` | `[T1] index: E-30 ` | `await import()` of `pkg/dist/elements/index.mjs` and `pkg/dist/commerce/index.mjs` inside the test; compare `Object.keys(globalThis)` before and after. When a test named with `E-30` exists, do nothing |
| E-31, E-32 | `src/elements/rp-dialog.test.ts` | `[T5] rp-dialog: E-31 `, `[T5] rp-dialog: E-32 ` | E-31: the Drawer markup that has `closedby="any"` plus a text `<input>` inserted in its body |

### Steps

1. Branch `task/M3-T10-element-acceptance`. `pnpm build && pnpm examples:install`.
2. Run `grep -rnoh "E-[0-9][0-9] " src/ | sort -u` and mark each row of the table as present or missing.
3. Write the missing tests, one row at a time, running `pnpm test:run --tiers=1,3,5,6,10 --files=<file> --no-skips` after each.
4. Proof.

### Acceptance

```bash
pnpm typecheck && pnpm build
pnpm test:run --tiers=1,3,5,6,10 --files=src/runtime/ --no-skips
pnpm test:run --tiers=3,5 --files=src/elements/ --no-skips
for n in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 16 17 18 19 21 22 23 24 25 26 27 29 30 31 32; do grep -rqE "E-$n[ :]" src/ components/ || echo "missing E-$n"; done   # prints nothing
pnpm ci
```

E-13 and E-26 count as present when `grep -rq "Q-2 " src/elements/rp-quantity.test.ts` succeeds (M1-T13 names them Q-2 to Q-14); add the two comment lines `// E-13: Q-2 to Q-14 in this file` and `// E-26: Q-6, Q-13, Q-14 in this file` to that file so that the loop above finds them. E-20 and E-28 follow "If blocked".

### Out of scope

E-15 and every NavigationMenu assertion. Fixing an element or the runtime: a failing row is reported in a draft pull request naming the row and the source file; the test stays as written. New fixtures.

### If blocked

- `pkg/registry/liquid/assets/` does not exist after `pnpm build` (the registry step is skipped until M6, PLAN 4.4): write E-20, E-21 and the Liquid clauses of E-22 and E-28 as comment lines `// E-<nn>: deferred to M6-T05 (needs pkg/registry/liquid/)` in the file the table names, and list them in the done file under "notes for later tasks". Do not write a skipped test.
- `pkg/registry/liquid/snippets/rp-head.liquid` does not exist: the first sentence of E-28 is deferred the same way.
- The task does not fit one session (it is sized S in the table and is larger): finish complete files only, push, and add a follow-up row `M3-T12` at the end of the M3 table for the rows still missing, as PLAN section 6 ("Size") prescribes; M3-T11 then depends on it.

---

## M3-T11 M3 gate

- **Goal:** Prove that milestone M3 is complete.
- **Depends on:** M3-T01 to M3-T10 (and M3-T12 when M3-T10 created it).
- **Kind:** `gate` (PLAN 3.5). Changes no source.

### Read first

`docs/PLAN.md` section 4.2 (row M3) and section 3.5. `ls docs/plan/done/`.

### Steps

1. Branch `task/M3-T11-gate`. `pnpm install --frozen-lockfile`.
2. Done files: every one of `docs/plan/done/M3-T01.md` to `M3-T10.md` exists. Collect every line that starts with `FOLLOW-UP NEEDED` or `BLOCKED`.
3. Components present and stable:

   ```bash
   for id in dialog drawer popover tooltip toast tabs accordion carousel quantity-input; do
     node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(m.status!=="stable") { console.log(process.argv[1], m.status); process.exitCode=1 }' components/$id/$id.json || echo "FAIL $id"
   done        # prints nothing
   ```

4. `pnpm ci` exits 0; record its last line.
5. Tier 4 for every `native` and `ui` component: `pnpm test:hydration --grep="dialog|drawer|quantity-input|carousel|tabs|tooltip|toast" --no-skips` exits 0; record the last line.
6. Snapshot stability: `pnpm build && pnpm gen --snapshot tabs tooltip toast && git status --porcelain components/` prints nothing after the command (the committed snapshots are current).
7. Element rows: run the `for n in ...` loop of M3-T10 "Acceptance"; it prints nothing, except ids that a done file records as deferred to M6-T05 (E-20; clauses of E-21, E-22, E-28). List those in the done file.
8. `pnpm test:upgrade --files=test/upgrade/bundles.test.ts --no-skips` exits 0 with A-07, A-08 and A-13 running (three tests, not zero).
9. Write `docs/plan/done/M3-T11.md`: the outputs of steps 3 to 8 in one line each, every task of the milestone with its pull request number, the deferred rows.

### Acceptance

Steps 2 to 8 hold. The gate fails when any command fails; the done file then names the failing task and the task is not merged (PLAN 3.5).

### Out of scope

Fixing anything. Cross-engine runs (they block only after M9-T06). Rows about `rp-navigation-menu`.

### If blocked

A deferred row (E-20, E-28 first sentence) is not a gate failure: PLAN 4.2 words the M3 gate as "every row ... has a passing test except rows about `rp-navigation-menu`", which cannot hold for rows that need `pkg/registry/liquid/` before M6; record it as a plan note for Ben in the done file. Any other missing row or failing command: the gate fails.
