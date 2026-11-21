# 08 - Agent kit and evals

Status: specification. Follows `00-decisions.md` (the ledger): D-059, D-060, D-061, D-065, D-095, D-102, D-106, and SPIKE-08. Date: 2026-11-21.

Normative words: MUST, MUST NOT, SHOULD, MAY. "UNVERIFIED" marks a fact nobody ran or read in source.

## 0. Scope and ownership

This document owns:

| Topic | Section |
|---|---|
| Which agent sees which surface | 1 |
| Package documentation: `docs/INDEX.md`, `docs/llms.txt`, `docs/components/<id>.md`, `docs/guides/<topic>.md`, `docs/rules/<RULE>.md` | 2 |
| The generated Ripple section of a project's `AGENTS.md` | 3 |
| The 14 skills: format, sidecar, exact frontmatter, outline of each | 4 |
| Checker: the `problem`, `fix` and `why` text of each of the 55 rules, the placeholder list, and the rule pages | 5, 2.6 |
| Development-mode warnings | 6 |
| The in-page agent bridge surface: actions, labels, confirmation, SPIKE-08 | 7 |
| The eval suite: tasks, harness adapters, scoring, thresholds, and how results gate API decisions | 8 |

This document does NOT own (link, do not restate):

| Topic | Owner |
|---|---|
| Manifest schema, generator entry (`pnpm gen`), CLI commands and flags, trailers, `skills sync` / `skills check` algorithm | `07-manifest-registry-cli.md` |
| Checker: rule ids, severity, layer, hosts, detection, `fix` computation (section 9.5), and the text and JSON output FORMAT (section 9.4) | `07-manifest-registry-cli.md` section 9 |
| What each element declares in its primitive `agent` key (non-commerce) | `04-elements.md` section 12 |
| Commerce elements and the adapter | `05-commerce.md` |
| `rv()`, `cx()`, `useElement` and their development warnings | `06-bindings.md` |
| Test tiers, the Liquid shim, `serveTheme`, size budgets | `13-testing.md` |
| The canonicaliser | `02-html-contract.md` section 12 |
| Blueprints and the example projects under `examples/` | `12-components-chrome-and-blueprints.md`, `14-liquid-theme.md` |

Conventions used below:

- `<pkg>` is the package name. In files under `skills/` and `guides/` the name is written as the build token `__PKG__` (`01-architecture.md` section 6.3). Skill and guide text MUST NOT contain the literal placeholder name.
- "The CLI" is written `ripple <command>` in prose.
- `<command form>` is how a command is spelled for the person or agent who must run it. It is defined by `07-manifest-registry-cli.md` section 7.1 rule 12: `npx <pkg>@<running version>` on Liquid and where no `package.json` exists; `<pm> exec ripple` otherwise (`npx ripple` when the package manager is npm). Two cases:
  - Text produced INSIDE a project by the CLI (checker output, the `AGENTS.md` section, CLI messages) prints the resolved command form.
  - STATIC files that ship in the package (skills, guides, `docs/INDEX.md`, component pages, rule pages) cannot know the project. In them `<command form>` is always written `npx <pkg>` (`npx __PKG__` in sources), which runs in every host. No static file may hard-code a package manager.
- Split of the checker between two documents (ledger section 12, D-059): `07-manifest-registry-cli.md` owns rule ids, severity, layer, detection, `fix` computation and the output format. This document owns the WORDS of each rule (`problem`, `fix`, `why`) and the rule pages, and MUST NOT restate the format.
- Paths that start with `uisdk/`, `hydrogen/`, `remix/`, `tobi/`, `ripple/` are evidence paths relative to the directory holding the local clones.

---

## 1. Who reads what

There are two audiences (D-065). This document serves the first in sections 2 to 6 and 8, and the second in section 7.

1. **Coding agents** write storefront code (Sidekick, Claude Code, pi, OpenCode, Codex).
2. **In-page agents** operate a storefront for a shopper (a browser agent, or an assistant embedded in the page).

Surfaces available to a coding agent, by situation. A surface marked "always" MUST be sufficient on its own for correct use of Ripple.

| Surface | npm host with a shell (`react`, `remix`, `html`) | Liquid theme with a shell | Liquid theme in Canvas / Sidekick (no shell; UNVERIFIED which files it can read beyond the theme) |
|---|---|---|---|
| Ripple section of `AGENTS.md` (section 3) | always | always | always |
| Generated TypeScript prop types | always | no | no |
| `{% doc %}` header of each installed block | no | always | always |
| `node_modules/<pkg>/docs/` (section 2) | yes | no (`<command form> docs <component id>` prints the page) | no |
| Skills in `.claude/skills`, `.agents/skills` (section 4) | yes, after `ripple skills sync` | yes, locally; not stored by Shopify (`ripple/docs/research/agent-kit-and-distribution.md` conclusion 1) | no |
| Skills loaded from the package as a pi package | yes | yes (`pi -e npm:<pkg>`) | UNVERIFIED |
| `ripple check` (section 5) | yes | yes (layers S and P; H and B need rendered HTML) | no |
| Development warnings (section 6) | `react`, `remix` | no | no |

Consequences that the rest of this document implements:

- **K-1** The `AGENTS.md` section and, on Liquid, the `{% doc %}` headers MUST be enough to use every installed component correctly with no skill and no shell.
- **K-2** Every fact in a skill or guide MUST also be reachable from `docs/INDEX.md`. Skills route and state rules; they are not the only place a fact lives.
- **K-3** All generated agent documentation comes from the manifest and the rule registry (D-058). No document in the package contains a hand-maintained list of components, props, values or rule ids.

---

## 2. Package documentation

### 2.1 Tree

`pnpm build` writes this tree into `pkg/docs/` (`01-architecture.md` section 6.1). Nothing else may be in `pkg/docs/`.

```text
docs/
  INDEX.md                 generated by src/gen/docs.ts
  llms.txt                 generated by src/gen/docs.ts
  components/<id>.md       generated by src/gen/docs.ts, one per manifest component (84 files)
  guides/<topic>.md        copied from guides/<topic>.md in the repository (hand-written, 12 files, section 2.5)
  rules/<RULE>.md          generated by src/gen/docs.ts from the rule registry, one per rule id of section 5.5 (55 files)
```

`src/gen/docs.ts` exports exactly these functions. They are pure (input in, string out) so that tests need no file system.

```ts
import type { Manifest, ManifestComponent, ManifestBlueprint } from "../types.ts";

export interface GuideMeta { topic: string; title: string; summary: string }   // read from guide frontmatter, 2.5
export interface RuleDoc {                                                     // one per rule id; built from each rule file, 5.5
  // the six fields of RuleMeta (type owned by 07-manifest-registry-cli.md section 9.3; the `meta` of the rule file's Rule object)
  id: string; severity: "error" | "warning"; layers: Array<"S" | "H" | "B" | "P">;
  hosts: Array<"html" | "react" | "remix" | "liquid">; title: string; why: string;
  // the four fields of RuleText (type declared in src/check/report.ts; exported by the rule file as `text`, 5.5)
  problem: string; fix: string; bad: string; good: string;
}

export function renderIndex(manifest: Manifest, guides: GuideMeta[], rules: RuleDoc[]): string;      // docs/INDEX.md
export function renderLlmsTxt(manifest: Manifest, guides: GuideMeta[], rules: RuleDoc[]): string;    // docs/llms.txt
export function renderComponentDoc(component: ManifestComponent, manifest: Manifest): string;        // docs/components/<id>.md
export function renderRuleDoc(rule: RuleDoc): string;                                                // docs/rules/<RULE>.md
```

The build script assembles each `RuleDoc` as `{ ...rule.meta, ...text }` from the two exports of `src/check/rules/<RULE>.ts`. `src/gen/docs.ts` declares `RuleDoc` structurally and imports nothing from `src/check/`.

Sorting rule used everywhere in generated docs: components by `category` in the order of the ledger's `category` list (`layout`, `typography`, `media`, `actions`, `forms`, `feedback`, `navigation`, `overlays`, `disclosure`, `product`, `cart`, `discovery`, `chrome`, `utilities`), then by `name` in byte order. Blueprints in manifest order. Guides in the order of the table in 2.5. Rules by id in byte order (`RP101` before `RP110`; `TC:` entries are not listed).

All generated files end with exactly one newline, use LF, and contain no trailing spaces.

### 2.2 `docs/INDEX.md`

Purpose: the one file an agent greps first. One row per component, blueprint, guide and rule. Exact shape (`<...>` are substitutions; everything else is literal):

```markdown
# Ripple <version> index

Search this file first, for example `grep -i "cart" node_modules/<pkg>/docs/INDEX.md`. Then read only the pages you need. These installed docs match the installed version and are canonical.

Print a page without opening files: `<command form> docs <component id>`. A checker rule: `<command form> docs <RULE>`. A guide: `<command form> docs guide <topic>`.

## Components

| Component | Id | Kind | No-JS | Summary | Page |
|---|---|---|---|---|---|
| <title> | `<name>` | <kind> | <noJs.level> | <summary> | [components/<name>.md](components/<name>.md) |

## Blueprints

| Blueprint | Summary | Hosts |
|---|---|---|
| `<blueprint id>` | <summary> | html, react, remix, liquid |

## Guides

| Guide | Summary | Page |
|---|---|---|
| <title> | <summary> | [guides/<topic>.md](guides/<topic>.md) |

## Checker rules

| Rule | Severity | What it reports | Page |
|---|---|---|---|
| <id> | <severity> | <title> | [rules/<id>.md](rules/<id>.md) |
```

Rules:

- **I-1** `<version>` is `VERSION` from `src/identity.ts`. `<command form>` is `npx <pkg>` here and in every other static file (section 0).
- **I-2** Components with `status: "planned"` MUST be omitted. Components with `status: "beta"` have ` (beta)` appended to the Summary cell.
- **I-3** A `|` inside any cell text MUST be written `\|`. Summaries are printed unchanged otherwise (the manifest schema limits `summary` to 140 characters and forbids newlines).
- **I-4** The Hosts cell of a blueprint lists the hosts for which `blueprints/<id>/<host>/` exists, in the order `html, react, remix, liquid`.
- **I-5** The file MUST be at most 40,000 bytes. `renderIndex` throws `Error("INDEX.md is <n> bytes; limit 40000")` above that.

### 2.3 `docs/llms.txt`

The same entries as `INDEX.md` in llms.txt link-list form. Exact shape:

```markdown
# Ripple

> Ripple <version>: a design system and component library for Shopify storefronts. Light-DOM web components, one HTML contract per component, bindings for html, react, remix and liquid. Read INDEX.md first.

## Start here

- [Index](INDEX.md): every component, blueprint, guide and checker rule in one table

## Components

- [<title>](components/<name>.md): <summary>

## Guides

- [<title>](guides/<topic>.md): <summary>

## Checker rules

- [<id>](rules/<id>.md): <title>
```

Rules: same omission and ordering rules as `INDEX.md`. Blueprints are not listed (they are code, reached through the index). Links are relative to `docs/`.

### 2.4 `docs/components/<id>.md`

Generated from one manifest entry. Section order and headings are fixed. A section whose source is empty is omitted, except "Props", which always exists (it prints `This component has no props beyond the universal props.` when `props[]` is empty).

```markdown
# <title>

<summary>

- Id: `<name>` | Kind: <kind> | Category: <category> | Status: <status> | Since: <since>
- Works without JavaScript: <noJs.level>. <noJs.behavior>
- Install: `<command form> add <name>`

## Use when

<one bullet per useWhen entry>

## Do not use when

<one bullet per dontUseWhen entry>

## Props

| Prop (TSX) | Liquid | Type | Values | Default | Required | Responsive | Description |
|---|---|---|---|---|---|---|---|
| `<prop.name>` | `<prop.liquid.name>` (<prop.liquid.surface>) | <prop.type> | <values joined by " \| ", or the scale name, or "-"> | `<default>` or "-" | yes / no | yes / no | <description> |

Universal props (`id`, `class`, rest props / `attributes`, `span`, `hidden`) are accepted by every component.

## Parts

| Part | TSX export | Liquid block | Element | Required | Parent |
|---|---|---|---|---|---|

## Examples

### <fixture.name>

TSX (react and remix):

<fenced tsx block: the call that produces this fixture>

Liquid:

<fenced liquid block: the call that produces this fixture>

HTML (the contract; every host prints this):

<fenced html block: fixture.html>

## State

| Attribute | On | Meaning |
|---|---|---|

## Events and methods

| Event | Detail | React callback |
|---|---|---|

| Method | Arguments | Agent action |
|---|---|---|

## Accessibility

- Pattern: <a11y.pattern>
- Accessible name: <a11y.name as a sentence>
- Keyboard: <one bullet per a11y.keyboard entry>
- Focus: <a11y.focus>
- Announces: <a11y.announces>

## Rules the checker enforces

| Rule | Message |
|---|---|
| <rule id or manifest rules[].id> | <message> |

## Depends on

Components: <dependencies.components as `id` list>. Elements: <dependencies.elements>. Tokens: <dependencies.tokens>. Icons: <dependencies.icons>.

## Notes

<content of components/<id>/notes.md when that file exists>
```

Rules:

- **C-1** The Examples section prints every fixture whose `generated` is `template` or `hand`, at most 4, in manifest order. The `default` fixture is always first. Fixtures with `generated: "upgrade-snapshot"` are printed only when no other fixture exists.
- **C-2** The TSX and Liquid calls are produced by the same emitters that generate bindings and conformance inputs (`07-manifest-registry-cli.md`); `renderComponentDoc` MUST NOT format calls itself. Consequence: every example in a component page is a tested fixture.
- **C-3** For a prop with `hosts` that excludes a host, the Description cell starts with `(<hosts> only) `.
- **C-4** The optional hand-written file `components/<id>/notes.md` is appended under `## Notes` unchanged. It MUST NOT contain a heading of level 1 or 2. This is the only hand-written text in a component page (D-060; ledger sections 4.6 and 5.1).
- **C-5** No page may contain a Tailwind utility class in a Liquid example (`ripple/docs/research/agent-kit-and-distribution.md` section 3: `{% doc %}` and docs are scanned for class names by the theme compiler). The generator enforces this by construction because fixtures contain no utilities (D-024 item 5).

### 2.5 `docs/guides/<topic>.md`

Hand-written in `guides/<topic>.md`. Each guide starts with frontmatter that `renderIndex` reads:

```markdown
---
title: <Title>
summary: <one sentence, at most 140 characters, no newline>
---
```

The 12 guides, in index order. Each guide is at most 250 lines. Each fact in a guide MUST be taken from its source document and MUST NOT contradict it; when the source changes, the guide changes in the same pull request.

| # | `topic` (file name without `.md`) | Title | Content (in this order) | Source |
|---|---|---|---|---|
| 1 | `getting-started` | Getting started | What Ripple is (hosts, backends, kinds). Install per host (`init`, `add`, `add --blueprint`). The first page. Where files land. How to find docs. | `01-architecture.md`, `07-manifest-registry-cli.md` |
| 2 | `layout-props` | Layout and responsive props | Container, Stack, Inline, Grid. The prop list of ledger 6.2. The responsive grammar with exactly these six examples: `gap="4"`, `gap="2 md:6"`, `columns="1 sm:2 lg:4"`, `direction="column md:row"`, `hidden="true md:false"`, `span="full md:2"`. Space steps. No margin props. | `03-styling-and-tokens.md`, ledger D-028, 6.1, 6.2 |
| 3 | `tokens-and-dials` | Tokens, dials and schemes | The dials of D-026. Colour roles of D-027. Scales of D-029. Schemes and `data-scheme`. How to change a scale. Contrast rule. | `03-styling-and-tokens.md` |
| 4 | `progressive-enhancement` | Working without JavaScript | The three `noJs` levels. Forms and links. The opener pattern: the `dialog` prop of Link, and of Button and IconButton with `href`; it prints `data-rp-open`, which is never written through rest props or `attributes`. `data-rp-js` values. Behaviour on browsers below a feature's first version (the table of D-081). What breaks the contract. | `02-html-contract.md`, `01-architecture.md` section 10, ledger D-005, D-009, D-021, D-081 |
| 5 | `commerce` | Cart, product form and regions | The adapter in one paragraph. The config element `#rp-commerce` and `configureCommerce`. The two form dialects (table of D-043); the props `formId`, `rpField`, `cartLines`. Regions, region parts (table of D-091) and `data-rp-refresh`. Refresh strategy per host (table of D-090). Pending and error display. Checkout. `rp-view-event` is printed only by the product, collection, search and cart blueprints. | `05-commerce.md`, `11-components-commerce.md` section 0 |
| 6 | `overlays-and-ids` | Overlays, ids and openers | Dialog, Drawer, Popover, Tooltip, Toast, Tabs, Accordion. Required ids and derived ids (D-020). `commandFor` / `command` for button openers and closers; the `dialog` prop for link openers. Tooltip: the trigger is a Button or IconButton with the prop `tooltip="<tooltip id>"`, never a link. Toast: `toast(message, options?)` imported from `<pkg>/elements` (Liquid: the `ripple` specifier; prebuilt pages: `ripple.js`). Tabs is horizontal only and has no `orientation` prop; content that must be readable without JavaScript goes in Accordion. Accordion `type` is `single` or `multiple`. Feedback inside an open dialog. | `04-elements.md`, `10-components-interactive.md` |
| 7 | `hosts-liquid` | Ripple in a Liquid theme | Tiers. The Liquid rules of `06-bindings.md` (every `L-` rule) as a numbered list, including: `{{ attributes }}` is printed last, and the Liquid subset with its three scopes (table of D-097). Region parts and `{% partial %}` (only in templates and layouts, at most once per name per page). Layout and templates are blueprint files. `rp-head` and the six import-map entries. Locale keys. CSS asset and the compiler. | `06-bindings.md`, `14-liquid-theme.md`, `12-components-chrome-and-blueprints.md` |
| 8 | `hosts-react` | Ripple in React | Rules R-1 to R-5. `useElement`. Callbacks and the four controlled props. `useCart(selector, serverValue)` and `useRegionHtml(name)`. A file that starts with `"use client"` exports components only; data helpers live in `<id>.data.ts`. | `06-bindings.md` |
| 9 | `hosts-remix` | Ripple in Remix 3 | Server components only. `data-rmx-*` and `rmxKey`. A region is a plain element with `data-rp-region`; no Frame is needed. The opt-in `configureCommerce` options `reloadFrames` and `navigate` (see `Fallback (SPIKE-11)` in 4.5.13). `data-rmx-document`. | `06-bindings.md`, `05-commerce.md` |
| 10 | `hosts-html` | Ripple in plain HTML | Two tags (one stylesheet, one module script). The config element `#rp-commerce` and the Hydrogen script tags on commerce pages. Reference files and the fixture delimiter line. Region refresh by document fetch. | `06-bindings.md`, `05-commerce.md` |
| 11 | `customize-and-upgrade` | Customising and upgrading | Library versus scaffolded. What a scaffolded edit may change. Trailers, `status`, `diff`, `upgrade`, conflicts. | `07-manifest-registry-cli.md` |
| 12 | `agent-ready` | In-page agents | Section 7 of this document as steps. | this document |

### 2.6 `docs/rules/<RULE>.md`

Generated from `RuleDoc` (2.1; texts in section 5.5). One page per rule id: 55 pages. Exact shape:

```markdown
# <id>: <title>

Severity: <severity>. Layers: <layers joined by ", ">. Hosts: <hosts joined by ", ">.

## What it reports

<problem, with each {placeholder} shown as <placeholder>>

## Why

<why>

## How to fix

<fix, with each {placeholder} shown as <placeholder>>

## Wrong

<fenced block: bad>

## Right

<fenced block: good>
```

The fence language is `liquid` when `hosts` is exactly `["liquid"]`, `css` for RP505, `text` for layer-P-only rules, otherwise `html`.

### 2.7 Access commands

The command is specified by `07-manifest-registry-cli.md` section 7.11 (D-057). `ripple docs` takes positionals only and has no flags of its own. These four forms are the only ones that any document, skill, message or generated file may print:

| Command | Output |
|---|---|
| `<command form> docs` (no argument) | `docs/INDEX.md` |
| `<command form> docs <component id>` | `docs/components/<id>.md` |
| `<command form> docs <RULE>` (the argument matches `/^RP\d{3}$/`) | `docs/rules/<RULE>.md` |
| `<command form> docs guide <topic>` | `docs/guides/<topic>.md` |

An unknown component id, rule id or topic exits with code 2; the message is owned by `07-manifest-registry-cli.md` section 7.11.

### 2.8 Acceptance (documentation)

| Id | Test (file `src/gen/docs.test.ts` unless stated) | Pass condition |
|---|---|---|
| K-01 | Build, then list `pkg/docs/components/`. | The set of file names equals `{ <name>.md }` for every manifest component whose status is not `planned`. |
| K-02 | Parse `pkg/docs/INDEX.md`. | Row counts equal: components (as K-01), blueprints (manifest `blueprints` length), guides 12, rules 55 (and 55 equals the number of files matching `src/check/rules/RP*.ts` that are not `*.test.ts`). Every link target exists. |
| K-03 | Compare the entry sets of `INDEX.md` and `llms.txt`. | Component, guide and rule sets are equal. |
| K-04 | `renderIndex` with a manifest of 150 synthetic components with 140-character summaries. | Throws the I-5 error. |
| K-05 | For every component page, extract each fenced `html` block under `## Examples`. | Each is byte-equal to a file `components/<id>/fixtures/<fixture>.html`. |
| K-06 | Grep `pkg/docs/` and `pkg/skills/` for `__PKG__` and for the regular expression `\bTBD\b`. | Zero matches. |
| K-07 | Every guide. | Has the frontmatter of 2.5, at most 250 lines, and every relative link resolves inside `pkg/docs/`. |
| K-08 | `renderRuleDoc` for every rule. | `bad` and `good` are non-empty and differ. |
| K-09 | Grep every file under `pkg/docs/` and `pkg/skills/` for `docs --rule`, `pnpm exec ripple`, `yarn ripple` and `bunx`. | Zero matches (2.7; section 0 rule for static files). |

---

## 3. The `AGENTS.md` section

### 3.1 Placement and markers

- `ripple init`, `ripple add`, `ripple remove` and `ripple upgrade` regenerate one region in the project's root `AGENTS.md`. The region is delimited by these two lines exactly (a marker region in the sense of D-056):

  ```text
  <!-- ripple:start agents -->
  <!-- ripple:end agents -->
  ```

- When `AGENTS.md` does not exist, the CLI creates it containing only the region.
- When it exists without the markers, the CLI appends a blank line and the region at the end.
- Text outside the markers MUST NOT be read or changed.
- The generator is `renderAgentsSection(input)` in `src/gen/agents-md.ts`:

  ```ts
  export interface AgentsSectionInput {
    pkg: string;                                   // resolved package name
    command: string;                               // the resolved command form (section 0), for example "pnpm exec ripple" or "npx ripple-kit@0.1.0"
    version: string;
    host: "html" | "react" | "remix" | "liquid";
    installed: Array<{ name: string; title: string; kind: string; summary: string; liquidBlock: string | null }>;  // sorted as in 2.1
    blueprints: string[];                          // installed blueprint ids
    hasShell: boolean;                             // always true when the CLI runs; kept for tests
  }
  export function renderAgentsSection(input: AgentsSectionInput): string;   // includes both marker lines; ends with "\n"
  export const AGENTS_SECTION_MAX_BYTES = 12000;
  ```

- `07-manifest-registry-cli.md` section 7.6.5 (patch `core/patch:agents`) is the caller: it builds `AgentsSectionInput` from the manifest, the detected host, the installed component ids and the command form, and writes the returned text.

### 3.2 Exact content

The region is the concatenation of blocks A to E in this order, separated by one blank line. `<...>` are substitutions; `<command form>` is `input.command`.

Block A (identity), all hosts:

```markdown
<!-- ripple:start agents -->
## Ripple

This project uses Ripple <version> (`<pkg>`), a component library for Shopify storefronts. Host: <host>.
This section is generated. Do not edit between the markers; run `<command form> upgrade` to refresh it.
Docs for one component: `<command form> docs <component id>`. For one checker rule: `<command form> docs <RULE>`. Index of everything: `<command form> docs`.
```

Block B (rules for every task), all hosts. These ten lines are also the "Rules" section of the `ripple` skill (4.5.1). Both are produced from the constant `UNIVERSAL_RULES` in `src/gen/agents-md.ts`, which holds the ten lines with the token `{command}` in line 10. `AGENTS.md` replaces `{command}` with `input.command`; the skill replaces it with `npx __PKG__`. Apart from that token the two texts MUST be byte-identical.

```markdown
### Rules for every task

1. Use a Ripple component before raw markup. The installed components are listed below.
2. Use props before utility classes, and utility classes before custom CSS. Never write a colour, radius, font or shadow value: use tokens such as `var(--color-primary)`.
3. Prop values are enumerated. Use only values from the component's doc. A responsive value is one string: `"2 md:6"`.
4. Never hand-roll a dialog, drawer, popover, tabs, tooltip, accordion, carousel or quantity stepper. Use the component.
5. Content is in the server HTML. Every action is a real `<form>` or `<a href>`. Pages must work with JavaScript off.
6. Components whose parts are linked by id need an explicit `id`. A part gets it through the prop named after its root (`dialog`, `drawer`, `tabs`, `popover`, `field`, `tooltip`, `accordion`, `cartLines`).
7. An overlay that has a page (cart, search, menu) opens from a Link, or a Button with `href`, that has the `dialog` prop (`href="/cart"`, `dialog="cart-drawer"`). A tooltip trigger is a Button or IconButton with the `tooltip` prop. Never write `data-rp-open` or the tooltip attributes by hand.
8. Do not invent or rename `rp-` classes, `rp-*` or `ui-*` tags, or `data-rp-*` attributes. Style with `rp-` classes only.
9. Ripple JavaScript is library code: never copy or edit it. Component CSS and bindings are yours to edit, after tokens and props cannot do the job.
10. After every change run `<command form> check`, fix the first error, and repeat until it prints `No problems`.
```

Block C (host rules). Exactly one of the four variants.

`liquid`:

```markdown
### Liquid rules

1. `{% block %}` is allowed only in `templates/` and `layout/`. Inside `blocks/` and `snippets/` use `{% render 'rp-<id>' %}`.
2. Call: `{% block 'button', variant: 'outline', size: 'lg' %}View cart{% endblock %}`. Text is the block body, never a param.
3. Params are snake_case. Booleans are `true`, never `'true'`. Scale and responsive values are quoted strings: `gap: '4'`, `gap: '2 md:6'`.
4. A component made of parts is one block per part (`dialog`, `dialog-title`); pass the root id to each part: `{% block 'dialog-title', dialog: 'size-guide' %}`.
5. A resource block takes the resource and renders itself: `{% block 'product-card', product: product %}{% endblock %}`. Give it a body only to replace its default content.
6. Icons are a snippet: `{% render 'rp-icon', name: 'cart' %}`.
7. A region is a `{% partial %}` with a fixed name, written only in `templates/` or `layout/`, at most once per name per page, around the component's region snippet inside the block body: `{% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}`. Never put a Dialog or Drawer root inside the partial it refreshes.
8. Cart forms use the platform field names (`id`, `quantity`, `updates[]`, `name="update"`, `name="checkout"`). No Ajax Cart API, no Section Rendering API, no `Shopify.actions.updateCart.configure`.
9. Every visible string is a locale key: `{{ 'ripple.<component>.<key>' | t }}`. Links use `routes.*`.
10. No sections, no JSON templates, no `{% javascript %}`, no `{% stylesheet %}`.
11. The reference for a block is the `{% doc %}` header at the top of `blocks/<name>.liquid`.
12. Component CSS is `assets/ripple.css` (editable). Utility classes work only after the Canvas or Sidekick compile of `config/styles.css`.
13. `form`, `for`, `content`, `block`, `section` and `settings` are never param names. Use `form_id` for the native `form` attribute, `cart_lines` for the id of the cart lines, `rp_field` for a cart field, `html_for` on a label.
14. `attributes` adds extra attributes only; it is printed last and cannot replace an attribute Ripple prints. Openers use the `dialog` param, tooltip triggers the `tooltip` param.
15. `layout/*.liquid` and `templates/*.liquid` come from blueprints (`<command form> add --blueprint layout`). `snippets/rp-head.liquid` loads the CSS, tokens, cart configuration and `ripple.js`; do not load them again. For a toast: `import { toast } from "ripple"`.
```

`react`:

```markdown
### React rules

1. Import components from `<paths.components>` (`import { Button } from "<paths.components>/button"`). Parts are flat exports: `DialogTitle`, not `Dialog.Title`.
2. Text is children. The only content props are `ariaLabel` and RichText `html`.
3. Never render a custom element (`<rp-*>`, `<ui-*>`) yourself and never pass it `on*` props; use the binding. Listen through the binding's callbacks (`onOpenChange`, `onValueChange`, `onIndexChange`, `onAction`).
4. Only these are controllable: `open` on Dialog and Drawer, `value` on Tabs and QuantityInput. Everything else is uncontrolled (`defaultOpen`, `defaultValue`, `defaultChecked`).
5. Do not use `useId` for Ripple ids; write explicit ids.
6. Cart state comes from `useCart(selector, serverValue)` in `<pkg>/react`; a fetched region (predictive search, recommendations) from `useRegionHtml(name)`. Do not mount `CartProvider` and do not import `@ui-sdk/react`.
7. Import `<pkg>/elements` and `<pkg>/commerce` once, in the client entry. For a toast: `import { toast } from "<pkg>/elements"`.
8. A file that starts with `"use client"` exports components only. Put data helpers in `<id>.data.ts`.
```

`remix`:

```markdown
### Remix rules

1. Import components from `<paths.components>`. Parts are flat exports: `DialogTitle`, not `Dialog.Title`.
2. Ripple components are server components. Do not wrap them in `clientEntry`, and do not use `on()`, `ref()`, `css()` or `@remix-run/ui` with them.
3. Components are uncontrolled and have no callback props. Listen to DOM events (`openchange`, `valuechange`, `indexchange`, `action`) on the element.
4. Use `class`, not `className`. Text is children. Import a sibling binding with its extension: `./button.tsx`.
5. A region is a plain element with `data-rp-region`. Do not create a `<Frame>` for a region. Cart forms, checkout links and account links carry `data-rmx-document`.
6. `ripple.js` is served from `public/ripple/`; do not import it through the asset server. For a toast: `import { toast } from "/ripple/ripple.js"` in a module script.
7. A component with a custom element root and no required `id` takes `rmxKey` (a stable, unique string) when it must keep its state across navigations.
```

`html`:

```markdown
### HTML rules

1. Copy markup from the reference file `<paths.components>/<id>.html`. It is the exact contract; change text and attribute values only.
2. Load exactly one stylesheet and one module script: `ripple.css` and `ripple.js`.
3. Print the default value of every enumerated prop as its `data-` attribute (`data-variant="primary"`).
4. Cart forms post to `/api/cart` with the Hydrogen field names (`merchandiseId`, `quantity`, `lineId`, submit `name="intent"`).
5. A page with cart or product-form markup needs, in `<head>` before `ripple.js`: the Hydrogen script tags and `<script type="application/json" id="rp-commerce">`. The `layout` blueprint prints both.
6. A region is the element with `data-rp-region="<name>"`; a form or link names the regions it refreshes in `data-rp-refresh`. For a toast: `import { toast } from "/ripple/ripple.js"`.
```

In blocks C, `<paths.components>` is `paths.components` from `ripple.json`, and `/ripple/ripple.js` is the URL of `paths.public` (default `public/ripple`) plus `/ripple.js`.

Block D (installed index), all hosts:

```markdown
### Installed components

<one line per installed component>

Blueprints installed: <comma-separated blueprint ids, or "none">.
Not installed yet? `<command form> add <component id>`. Full list: `<command form> docs`.
```

Line format: `- <call name> (<kind>): <summary>` where `<call name>` is the Liquid block name (`liquidBlock`; for Icon the text `rp-icon snippet`) on `liquid`, and the component `title` on other hosts.

Block E (done rule), all hosts:

```markdown
### Done means

With a shell: `<command form> check` prints `No problems`, and the project's own build and typecheck pass.
Without a shell, check by hand: (1) every prop value appears in the component's doc; (2) every component with parts has an `id` and its parts receive it; (3) no `{% block %}` inside `blocks/` or `snippets/`; (4) every button is inside a form or has `command_for` / `commandFor` or `popover_target` / `popoverTarget`; (5) every Image gets an `image` object that has a URL, alt text, width and height; (6) no hand-written colour values.
<!-- ripple:end agents -->
```

On hosts other than `liquid`, item (3) of the by-hand list is replaced by `(3) no custom element tag written by hand`.

### 3.3 Size rule

`renderAgentsSection` MUST return at most `AGENTS_SECTION_MAX_BYTES` (12,000) bytes (UTF-8). It applies these steps in order and stops at the first that fits:

1. Summaries in full.
2. Every summary cut to its first 80 characters; a cut summary ends with `...`.
3. Every summary cut to 40 characters, same suffix.
4. No summaries: block D lists names only, comma-separated, grouped as `- <category>: <name>, <name>` (one line per category).

If step 4 still exceeds the limit the function throws `Error("AGENTS.md section is <n> bytes; limit 12000")`.

Checker rule RP406 (section 5.5) reports a project `AGENTS.md` above 50,000 bytes (error) and a missing or stale Ripple region (warning; stale means the region differs from `renderAgentsSection` for the installed set).

### 3.4 Acceptance (`AGENTS.md`)

| Id | Test (`src/gen/agents-md.test.ts`) | Pass condition |
|---|---|---|
| K-10 | Render for each host with all 84 components installed. | Byte length at most 12,000; starts with `<!-- ripple:start agents -->\n`; ends with `<!-- ripple:end agents -->\n`. |
| K-11 | Render for `liquid` with 20 installed components. | Step 1 is used (all summaries complete). |
| K-12 | Block B. | Equals `UNIVERSAL_RULES` with `{command}` replaced by `input.command`; has exactly 10 numbered lines; contains none of the strings `data-rp-open=`, `npx <pkg>`. |
| K-13 | Apply the region to: no file; a file with no markers; a file with a stale region. | Results: region only; original text + blank line + region; original text with only the region replaced. Bytes outside the markers unchanged. |
| K-14 | Block C for each host. | `liquid`: exactly 15 numbered rules; `react`: 8; `remix`: 7; `html`: 6. No variant contains the words `named blocking Frames`. |
| K-16 | Render with `command: "pnpm exec ripple"`. | The output contains `pnpm exec ripple check` and does not contain `npx`. |
| K-15 | Eval task T11 run with skills removed from the workspace (section 8.5, arm `no-skills`). | Recorded, not gating: pass rate with only `AGENTS.md` and `{% doc %}`. This measures K-1. |

---

## 4. Skills

### 4.1 Format

Each skill is a directory `skills/<name>/` in the repository containing exactly two files (`01-architecture.md` section 6.1 permits no others):

1. `SKILL.md`: Agent Skills format. Frontmatter has exactly two keys, `name` and `description`, in that order. `description` is ONE physical line: one sentence saying what the skill covers, then a sentence that starts with `Use when`, `Use for` or `Use after`. Evidence for the pattern: `hydrogen/packages/hydrogen/skills/hydrogen-cart-ui/SKILL.md`; pi's skill docs quoted in `ripple/docs/research/agent-kit-and-distribution.md` 2.7.
2. `ripple.json`: the sidecar read by `ripple skills sync`. Exact shape: `{ "hosts": ["html", "react", "remix", "liquid"] }` with the subset the skill applies to. The key order and spelling are fixed; no other key.

Rules for every skill:

- **S-1** `SKILL.md` is at most 300 lines (D-060). Lines are counted with the frontmatter.
- **S-2** Written for the consumer project. It MUST NOT mention a path that exists only in the Ripple repository (`src/`, `components/<id>/`, `docs/00-decisions.md`), a ledger decision id (`D-0nn`), or a spike id.
- **S-3** Package name is written `__PKG__`; commands are written `npx __PKG__ <command>` (the static spelling of the command form, section 0). The only `docs` forms a skill may print are the four of 2.7.
- **S-4** A skill states rules and steps and points to `node_modules/__PKG__/docs/` pages by relative name (for example `docs/guides/layout-props.md`). It MUST NOT list components, prop values or rule ids beyond the examples named in its outline (K-3). Exception: `ripple-check-and-fix` names the rule ids listed in 4.5.9.
- **S-5** It names another package's skill by its `name` and states the boundary in one sentence. It MUST NOT copy text from another package's skill.
- **S-6** Every skill uses this heading skeleton, in this order. Headings marked (fixed) are literal.

  ```markdown
  ---
  name: <name>
  description: <description>
  ---

  # <Title>

  ## When to use            (fixed)
  ## Rules                  (fixed)
  ## Steps                  (fixed)
  <topic sections named in the outline, each "## <heading>">
  ## Other skills           (fixed; omitted when the outline says "Defers to: none" and no Ripple skill is named)
  ## Done when              (fixed)
  ```

- **S-7** "Rules" is a numbered list of at most 12 items, each one sentence with MUST or MUST NOT or an imperative verb. "Done when" is a checklist (`- [ ]` items) whose last item is always `- [ ] \`npx __PKG__ check\` prints \`No problems\`.` except in `ripple-setup` (4.5.2).
- **S-8** Code examples in skills MUST be taken from fixtures or blueprints (copied by the author, verified by test K-22).

`ripple skills sync` (algorithm owned by `07-manifest-registry-cli.md`; D-060, D-056): installs the skills whose sidecar `hosts` contains the detected host into both `.claude/skills/<name>/` and `.agents/skills/<name>/`, writing only `SKILL.md` with the `metadata` block (`source`, `version`, `hash`) added to the frontmatter. The sidecar is not copied. After syncing, when `@shopify/hydrogen` resolves from the project, the command prints exactly: `Hydrogen has its own skills. Run \`npx @shopify/hydrogen skills sync\` to install them.` It MUST NOT copy Hydrogen's skill directories (their metadata says `source: "@shopify/hydrogen"`; `hydrogen/packages/hydrogen/src/cli/skills.ts`).

The package is also a pi package: `pkg/package.json` has `"keywords": ["pi-package"]` and `"pi": { "skills": ["./skills"] }` (D-060). When loaded this way all 14 skills are visible regardless of host; therefore every host-specific skill's `description` names its host in the first sentence.

### 4.2 The 14 skills

| # | `name` | `hosts` in sidecar | Title |
|---|---|---|---|
| 1 | `ripple` | html, react, remix, liquid | Ripple |
| 2 | `ripple-setup` | html, react, remix, liquid | Set up Ripple |
| 3 | `ripple-compose-page` | html, react, remix, liquid | Compose pages with Ripple |
| 4 | `ripple-commerce` | html, react, remix, liquid | Product and cart with Ripple |
| 5 | `ripple-discovery` | html, react, remix, liquid | Search, filters and sorting with Ripple |
| 6 | `ripple-theming` | html, react, remix, liquid | Theme a Ripple storefront |
| 7 | `ripple-customize-component` | html, react, remix, liquid | Customise a Ripple component |
| 8 | `ripple-new-component` | html, react, remix, liquid | Build what Ripple does not ship |
| 9 | `ripple-check-and-fix` | html, react, remix, liquid | Check and fix |
| 10 | `ripple-upgrade` | html, react, remix, liquid | Upgrade Ripple |
| 11 | `ripple-liquid` | liquid | Ripple in Liquid themes |
| 12 | `ripple-react` | react | Ripple in React |
| 13 | `ripple-remix` | remix | Ripple in Remix 3 |
| 14 | `ripple-agent-ready` | html, react, remix, liquid | Make the storefront agent-ready |

### 4.3 Other packages' skills that Ripple skills name

Verified to exist: `hydrogen/packages/hydrogen/skills/<name>/SKILL.md`; `uisdk/packages/core/skills/ui-sdk/SKILL.md` (with `references/agent-ready.md`, `create-component.md`, `web-components.md`); `remix/.agents/skills/remix/SKILL.md`.

| Skill | Applies on hydrogen backend | Applies on liquid backend | Boundary sentence to use (verbatim) |
|---|---|---|---|
| `hydrogen-setup` | yes | no | Use the `hydrogen-setup` skill for the data layer, routes and request handlers; this skill covers Ripple's files and wiring. |
| `hydrogen-request-handlers` | yes | no | Use the `hydrogen-request-handlers` skill to mount the cart endpoint at `/api/cart`. |
| `hydrogen-routing` | yes | no | Use the `hydrogen-routing` skill for route patterns and URLs. |
| `hydrogen-storefront-client` | yes | no | Use the `hydrogen-storefront-client` skill for Storefront API queries. |
| `hydrogen-cart-ui` | yes | behaviour rules only | Use the `hydrogen-cart-ui` skill for cart behaviour rules; Ripple's components already implement its markup and store calls, so do not write those yourself. |
| `hydrogen-cart-drawer` | yes | behaviour rules only | Use the `hydrogen-cart-drawer` skill for drawer behaviour rules; the markup is Ripple's CartDrawer. |
| `hydrogen-variant-form` | URL rules only | URL rules only | Use the `hydrogen-variant-form` skill only for its rules about variant URLs and availability. Do NOT create a product form store: Ripple selects variants by URL. |
| `hydrogen-collection-browser` | data and URL params only | no | Use the `hydrogen-collection-browser` skill for collection queries and the `filter.*` and `sort_by` URL params. Do NOT create a collection store. |
| `hydrogen-predictive-search` | no | no | Do NOT use the `hydrogen-predictive-search` skill: Ripple's PredictiveSearch refreshes a server-rendered region instead of using a search store. |
| `hydrogen-money` | yes | no (Liquid money filters) | Use the `hydrogen-money` skill for formatting money on the server. |
| `hydrogen-image` | no (Ripple ships `imageUrl` / `imageSrcSet`) | no | Not referenced. |
| `hydrogen-markets` | yes | no | Use the `hydrogen-markets` skill for country, language and currency data. |
| `hydrogen-shop-pay` | yes | no | Use the `hydrogen-shop-pay` skill for accelerated checkout configuration; in Ripple it is the `acceleratedCheckout` prop. |
| `hydrogen-smoke-test` | yes | no | After `npx __PKG__ check` passes, use the `hydrogen-smoke-test` skill for the data wiring checklist. |
| `migrate-to-hydrogen-2026-10` | only when Hydrogen itself is migrated | no | Use the `migrate-to-hydrogen-2026-10` skill only when the Hydrogen version itself changes. |
| `ui-sdk` | new `rp-*` elements only | same | Use the `ui-sdk` skill at `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md` for `definePrimitive` and the agent bridge. |
| `remix` | remix host | no | Use the `remix` skill for routing and actions; Ripple regions need no Frame. |

The statements "Do NOT create a product form store" and "Do NOT use the `hydrogen-predictive-search` skill" follow D-047 and D-048. `hydrogen-variant-form` and `hydrogen-markets` teach `createProductFormStore` (verified by grep of `hydrogen/packages/hydrogen/skills/*/SKILL.md`), so the boundary sentence is required wherever those skills are named.

### 4.4 Routing table (used in skill 1 and by the eval metric `skillsExpected`)

| Task | Skill |
|---|---|
| Project has no Ripple files, or `npx __PKG__ status` fails | `ripple-setup` |
| Build or change a page or a page area | `ripple-compose-page` |
| Product page, add to cart, cart, checkout | `ripple-commerce` |
| Collection, search, filters, sorting, pagination | `ripple-discovery` |
| Colours, fonts, radius, spacing, dark scheme, theme settings | `ripple-theming` |
| Change a component's markup or CSS, add a variant | `ripple-customize-component` |
| No component fits | `ripple-new-component` |
| A checker rule id appears, or work is about to be called done | `ripple-check-and-fix` |
| Change the Ripple version, or `status` shows outdated files | `ripple-upgrade` |
| Any file under `blocks/`, `snippets/`, `templates/`, `layout/` | `ripple-liquid` |
| Any `.tsx` file in a React project | `ripple-react` |
| Any `.tsx` file in a Remix 3 project | `ripple-remix` |
| WebMCP, in-page assistants, agent safety | `ripple-agent-ready` |

### 4.5 Outline of each skill

For each skill: the exact `description`, then the sections in order with the content each MUST contain. "Source" names the specification the facts come from; the skill author copies facts, not wording.

#### 4.5.1 `ripple`

- description: `Builds storefront UI with Ripple components, tokens and blueprints in html, react, remix and Liquid projects. Use when a project contains Ripple files (classes or tags starting with rp-, a ripple.json file, or a Ripple section in AGENTS.md) or when the task is to build or change storefront pages.`
- Line budget: 90.
- `## When to use`: the two triggers of the description as bullets; one sentence: "Read this skill first; it routes to the others."
- `## Rules`: the ten lines of `UNIVERSAL_RULES` (3.2 block B) with `{command}` replaced by `npx __PKG__`, otherwise byte-identical.
- `## Steps`: (1) Find the host: `ripple.json` key `host`, or a Liquid theme when `layout/theme.liquid` exists. (2) Find the component: `grep -i "<word>" node_modules/__PKG__/docs/INDEX.md`, or `npx __PKG__ docs`; on Liquid read the `{% doc %}` header of `blocks/<name>.liquid`. (3) Not installed: `npx __PKG__ add <component>`. (4) Start pages from a blueprint: `npx __PKG__ add --blueprint <id>`. (5) Write the code. (6) Run the checker.
- `## What Ripple is`: at most 8 lines: one HTML contract per component printed by the server; four hosts; three kinds of markup (native elements with `rp-` classes, `rp-*` elements, `ui-*` elements for Tabs, Tooltip, Toast); props become `data-` attributes; tokens are CSS variables; JavaScript is optional enhancement.
- `## Pick your path`: the table of 4.4.
- `## Where things are`: table with rows docs (`node_modules/__PKG__/docs/INDEX.md`), bindings (`paths.components`), blueprint pages (`paths.pages`), CSS (`paths.styles`), browser files on `html` and `remix` (`paths.public`), Liquid files (`blocks/`, `snippets/rp-*.liquid`, `assets/ripple.css`, `assets/ripple*.js`), configuration (`ripple.json`; a Liquid theme has none).
- Defers to: none (names Ripple skills only).
- `## Done when`: every changed page renders; no hand-rolled widget; the fixed last item.

#### 4.5.2 `ripple-setup`

- description: `Installs Ripple into a project: init, styles, tokens, head wiring, first components and skills. Use when the project has no Ripple files yet, when npx __PKG__ status reports a missing patch, or when adding Ripple to a new host.`
- Line budget: 160.
- `## Rules`: MUST run `init` before `add`; MUST NOT hand-copy files from `node_modules/__PKG__/registry`; MUST NOT add Tailwind unless the project already compiles it; the CSS entry MUST import `ripple.css` before `tailwindcss`; MUST NOT load `@shopify/hydrogen` a second time on Liquid; MUST NOT install `@ui-sdk/react`.
- `## Steps`: (1) `npx __PKG__ init` (detects the host; `--host <host>` to force). (2) `npx __PKG__ status` and confirm zero missing patches. (3) `npx __PKG__ add --blueprint layout` then the page blueprints needed. On Liquid the layout and every template are blueprint files: `layout/theme.liquid` comes from the `layout` blueprint, and `init` only patches a layout file that already exists. (4) `npx __PKG__ skills sync`. (5) Start the app or preview the theme and load the home page. (6) `npx __PKG__ check`.
- `## What init changes`: one table per host listing the files written and the lines patched. Source: `07-manifest-registry-cli.md`, ledger 5.3.
- `## Host notes`: four subsections (`### html`, `### react`, `### remix`, `### liquid`), each at most 12 lines: where `ripple.css` and `ripple.js` load (`react`: import `__PKG__/elements` and `__PKG__/commerce` once in the client entry; `html` and `remix`: the six files `init` copies to `paths.public`; `liquid`: `snippets/rp-head.liquid`, rendered after the import map and before `{{ content_for_header }}`, which prints the stylesheet tag, the tokens, the config element `<script type="application/json" id="rp-commerce">`, the commands polyfill and the module script, plus `snippets/rp-import-map-entries.liquid`, which adds six import-map entries); what the server must provide on the hydrogen backend (the cart handlers at `/api/cart`, the Hydrogen script tags and the config element in `<head>` before `ripple.js`; the `layout` blueprint prints both); the CSS entry order (`ripple.css`, then `tailwindcss`, then `theme.css`); what MUST NOT exist (Liquid: `snippets/standard-actions-config.liquid`, `assets/standard-actions-override.js`; any host: a second Ripple runtime on one page). Source: `01-architecture.md`, `05-commerce.md`, `14-liquid-theme.md`.
- `## If init stops`: the three failure messages of `init` (collision with an untrailered file, unsupported theme with `sections/` or JSON templates, patch not applied) and the fix for each. Source: `07-manifest-registry-cli.md`.
- Defers to: `hydrogen-setup`, `hydrogen-request-handlers` (boundary sentences of 4.3).
- `## Done when`: `status` exits 0; the home page renders with styles; with JavaScript disabled the page is readable; last item: `- [ ] \`npx __PKG__ check\` prints \`No problems\` (run it after the first page exists).`

#### 4.5.3 `ripple-compose-page`

- description: `Composes pages and page areas from Ripple layout and content components and blueprints. Use when building or changing a home, collection, product, search, cart, blog, article, contact or content page, or when adding a new area to a page.`
- Line budget: 220.
- `## Rules`: start from a blueprint when one exists; one Container per full-width band (Container owns the page gutter); spacing only through `gap`, `p`, `px`, `py`, `pt`, `pb` (there are no margin props); headings in order with `level` for the element and `size` for the look; every Image gets an `image` object (URL, alt text, width, height); the first image of a page uses `loading="eager"` and `fetchPriority="high"`; no horizontal overflow at 375 px; `start` / `end`, never left / right; content that must be reachable without JavaScript MUST NOT be placed in Tabs, use Accordion; Tabs is horizontal only (there is no `orientation` prop); MUST NOT write an `rp-view-event` tag: the product, collection, search and cart blueprints print it and no other page has one.
- `## Steps`: (1) List blueprints: `npx __PKG__ docs`. (2) `add --blueprint <id>`. (3) Replace sample data with store data. (4) Add or remove areas. (5) Check at 375, 768 and 1440 px. (6) Checker.
- `## Layout components`: table with one row each for Container, Stack, Inline, Grid, Card, Separator: "use for" and the props it accepts (ledger 6.2).
- `## Responsive values`: the grammar in three lines, and exactly the six examples of guide `layout-props` (2.5 row 2), each in TSX and in Liquid.
- `## Spacing rhythm`: the fixed recommendations: band padding `py="12 md:20"`; gap between areas inside a band `gap="8 md:12"`; gap inside a group `gap="2"` to `gap="4"`; grid gap `gap="4 md:6"`. The four values are not changed by this document; they are normative for every blueprint (D-106, D-107 item 4), so a page an agent adds matches the pages it started from.
- `## When a prop is missing`: order: another component; a utility class through `class` (only when the project compiles Tailwind); a small CSS rule using tokens in the project's own stylesheet; then the `ripple-new-component` skill.
- `## Page checklists`: one checklist of at most 6 items per blueprint id (`home`, `collection`, `product`, `search`, `cart`, `article`, `page`), naming the components each page needs.
- `## Overlays on a page`: at most 12 lines: a button opener is a Button with `commandFor` and `command="show-modal"`; a closer is a Button with `commandFor` and `command="close"`; an opener that has a page equivalent is a Link (or a Button with `href`) with the `dialog` prop; a Dialog needs a DialogTitle; a tooltip trigger is a Button or IconButton with the `tooltip` prop and its own accessible name; Accordion `type` is `single` (needs an `id`) or `multiple`; a toast is shown with `toast()` and never while a dialog is open. Pointer: `docs/guides/overlays-and-ids.md`.
- Defers to: `hydrogen-routing`, `hydrogen-storefront-client` (hydrogen backend); `ripple-commerce`, `ripple-discovery`.
- `## Done when`: landmarks `header`, `main`, `footer` present; one `h1`; no overflow at 375 px; fixed last item.

#### 4.5.4 `ripple-commerce`

- description: `Wires Ripple product and cart components: product form, variant picker, add to cart, cart drawer, cart lines, discount code, cart note and checkout. Use when adding to cart, selecting variants, showing or editing the cart, or sending the shopper to checkout.`
- Line budget: 260.
- `## Rules`: every cart action is a form post that works with JavaScript off; variant selection is a link or GET form that changes the URL, the server renders the selected variant; MUST NOT write cart fetch calls, a cart store, or client-side line templates; MUST NOT disable controls while pending; money text is formatted on the server; the checkout control carries `data-agent-confirm`; feedback raised while a dialog is open is shown inside that dialog; the cart opener is a link to the cart page with the `dialog` prop (CartLink: the `drawer` prop), never a hand-written `data-rp-open`; MUST NOT pass `form` or `for` as a prop: the native `form` attribute is `formId` (Liquid `form_id`), a cart field is marked with `rpField` (Liquid `rp_field`), and cart parts receive the cart lines id through `cartLines` (Liquid `cart_lines`); MUST NOT print `rp-view-event` outside the product, collection, search and cart blueprints.
- `## Steps`: (1) Product page: ProductGallery, Price, VariantPicker (outside the ProductForm, never inside it), ProductForm with QuantityInput and AddToCartButton. (2) Layout: CartLink in the header and one CartDrawer (id `cart-drawer`) in the layout, omitted on the cart page, where the CartLink has no `drawer` and navigates. (3) Cart page: CartLines, CartSummary, DiscountCode, CartNote, CheckoutButton. (4) Declare the regions through the region parts. (5) Test with JavaScript off, then on.
- `## Form field names`: the dialect table of D-043, verbatim columns, with one sentence: "Use the column of your backend; the components print these for you."
- `## Regions`: the region names used by commerce (`rp-cart-lines`, `rp-cart-summary`, `rp-product-buy`, `rp-product-media`, `rp-product-recommendations`); the region parts as a table (CartLines `CartLinesList` / snippet `rp-cart-lines-list`; CartSummary `CartSummaryTotals` / `rp-cart-summary-totals`; ProductGallery `ProductGalleryMedia` / `rp-product-gallery-media`; ProductRecommendations `ProductRecommendationsList` / `rp-product-recommendations-list`); what declares a region per host (every host: the element with `data-rp-region`; Liquid additionally `{% partial '<region>' %}` written in a template or layout around the region snippet; Remix and `html`: nothing more, no Frame; React: nothing more); `rp-product-buy` is declared by the product blueprint on a layout component through rest props or `attributes: 'data-rp-region="rp-product-buy"'` (the only hook attribute that may be passed that way); a region name appears at most once per page; and the rule that an overlay root is never inside the region it refreshes.
- `## What updates without a reload`: table "what the element changes" (pending attributes, count text, error text) versus "what the server re-renders" (lines, money, structure). React exception in one sentence.
- `## Errors and pending`: the error element `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` and that the server prints it empty.
- `## Checkout`: the two forms of the checkout control (Liquid: a submit button `name="checkout"` joined to the cart form with `form_id`; hydrogen backend: a link to the checkout URL), both with `data-agent-confirm`; inert when the cart is empty; `acceleratedCheckout` on ProductForm and CartSummary. Source: ledger D-050, `11-components-commerce.md`.
- Defers to: `hydrogen-cart-ui`, `hydrogen-cart-drawer`, `hydrogen-variant-form`, `hydrogen-money`, `hydrogen-shop-pay` (boundary sentences of 4.3, including which apply on Liquid).
- `## Done when`: with JavaScript off, add to cart, quantity change, remove and checkout work; with JavaScript on, add to cart does not navigate and the count changes; fixed last item.

#### 4.5.5 `ripple-discovery`

- description: `Builds collection and search pages with Ripple: filters, active filter chips, sorting, pagination, search form and predictive search. Use when working on a collection page, a search results page or a search field with suggestions.`
- Line budget: 180.
- `## Rules`: filters and sort are GET forms and links whose URL fully describes the state (Filters is one GET form; SortSelect is its own GET form); active filters are links; pagination is links; the search field is a real GET form to the search route; predictive search is a search field plus a list of links, never an ARIA combobox; MUST NOT keep filter state in JavaScript; reloading a filtered URL MUST render the same state.
- `## Steps`: (1) `add --blueprint collection` / `search`. (2) Filters with FilterGroup and PriceRange, rendered inline; SortSelect in the toolbar. (3) FilterChips above results. (4) Regions: `rp-collection-filters` (Filters part `groups`), `rp-predictive-results` (PredictiveSearch part `results`), and the blueprint-owned `rp-collection-results`, `rp-collection-toolbar`, `rp-search-results`, each a layout component that receives `data-rp-region`. (5) Pagination. (6) PredictiveSearch inside the search Dialog that the `layout` blueprint prints. (7) Test back and forward, and with JavaScript off.
- `## URL params`: `filter.*`, `sort_by`, `page`, `q`; one example URL.
- `## How live updates work`: `rp-live` intercepts the submit or click, updates the URL, refreshes the regions named in `data-rp-refresh`; without JavaScript the form or link navigates. On React, predictive results arrive through `useRegionHtml("rp-predictive-results")`, which the PredictiveSearch binding already uses.
- `## Where filters go`: Filters is rendered inline on the page at every width, as the `collection` blueprint does. MUST NOT place Filters inside a Drawer, Dialog or Popover: it would not be reachable without JavaScript.
- Defers to: `hydrogen-collection-browser` (boundary sentence); the "Do NOT use `hydrogen-predictive-search`" sentence.
- `## Done when`: filter, sort and page changes work with JavaScript off; removing one chip keeps the other params; fixed last item.

#### 4.5.6 `ripple-theming`

- description: `Changes the look of a Ripple storefront through tokens, dials, schemes and scales. Use for brand colour, dark or custom colour schemes, radius, density, typography, or exposing design tokens as Liquid theme settings.`
- Line budget: 200.
- `## Rules`: change a dial before a derived token, a token before component CSS; token values are written only in `tokens.css` (Liquid: theme settings, then the token region `core/tokens` of `assets/ripple.css`); after editing a token MUST run `npx __PKG__ upgrade`, which regenerates `props.css` and `theme.css`; any element that sets a dial MUST also carry `data-scheme="<name>"`; MUST NOT write hex, rgb or oklch values in component CSS or markup; body text contrast MUST be at least 4.5:1; MUST NOT rename a token.
- `## Steps`: (1) Decide which dials change. (2) Edit them. (3) For a dark or custom scheme add a `[data-scheme="<name>"]` block. (4) `npx __PKG__ upgrade` (regenerates the derived CSS; the checker reports stale derived CSS as RP508). (5) Check contrast: `npx __PKG__ check --browser --url <url> --rule RP609`. (6) Look at home, product and cart at three widths.
- `## Dials`: table of the ten dials of D-026 with default and effect.
- `## Colour roles`: the role names of D-027 in one table with "used for"; the note that the red role is always `destructive`.
- `## Scales`: how to change breakpoints, space steps, type ratio, radius (edit `tokens.css`, then run `npx __PKG__ upgrade`; names never change).
- `## Liquid theme settings`: the setting ids of D-026 item 5 (`rp_palette`, `rp_radius`, `rp_density`, `rp_text_scale`, `rp_font_body`, `rp_font_heading`), the palette slot mapping, and the ranges of D-098 (`rp_radius` 0 to 24 px, default 8; `rp_density` 75 to 125 percent, default 100; `rp_text_scale` 113 to 133, default 120; fonts default to the system font).
- `## Do not`: raw colour in a `style` attribute; editing component CSS to change a colour; `@tailwindcss/browser`.
- Defers to: none.
- `## Done when`: no component CSS file is modified (`npx __PKG__ status` shows none as modified); contrast passes; fixed last item.

#### 4.5.7 `ripple-customize-component`

- description: `Edits a scaffolded Ripple component safely or adds a variant value. Use when a component's CSS, markup or props must change beyond what tokens and props allow.`
- Line budget: 180.
- `## Rules`: MUST NOT rename or remove an `rp-` class, a `data-rp-*` attribute, a custom element tag, a derived id or a part; MUST NOT edit library JavaScript; modifier rules set custom properties only; CSS stays plain (no nesting, no `@apply`) inside `@layer rp.components`; MUST keep the provenance trailer line; a new enumerated value MUST be added in every binding the project uses and in the CSS.
- `## Steps`: (1) `npx __PKG__ docs <component>` and read the contract. (2) Try a public custom property (`--rp-<component>-<name>`) first. (3) Edit the CSS file. (4) To add a variant value: CSS rule, then the binding's type (TSX) or allow-list and `{% doc %}` (Liquid). (5) `npx __PKG__ check`. (6) `npx __PKG__ status` shows the file as modified; that is expected.
- `## What may change and what may not`: two-column table (may: declarations, added parts with new classes that do not start with `rp-`, added values; may not: the list of the first rule).
- `## How upgrades treat your edit`: three-way merge; conflicts only where both sides changed the same lines.
- Defers to: `ripple-upgrade`, `ripple-theming`.
- `## Done when`: the component renders in every state it had before; fixed last item.

#### 4.5.8 `ripple-new-component`

- description: `Builds UI that Ripple does not ship, using tokens, layout components and plain HTML. Use when no Ripple component or blueprint fits and the task needs a new visual pattern or a new interactive behaviour.`
- Line budget: 200.
- `## Rules`: MUST first check `INDEX.md` for an existing component; class names MUST NOT start with `rp-`; tag names MUST NOT start with `rp-` or `ui-`; use tokens for every colour, radius, font, shadow and spacing value; logical properties only; MUST NOT add an ARIA widget role by hand (`dialog`, `tablist`, `menu`, `listbox`, `combobox`, `slider`, `tree`, `toolbar`); interactive behaviour MUST start from native elements (`details`, `dialog`, `popover`, form controls); content in server HTML.
- `## Steps`: decision list: (1) compose existing components; (2) static pattern: HTML + utilities or a small CSS file with tokens; (3) new behaviour: native element first; (4) only when native cannot do it: a custom element.
- `## Static pattern example`: a size-chart table (the T15 task shape): markup with a project class, CSS using `var(--color-border)`, `var(--color-muted)`, logical properties, sticky header.
- `## New custom element`: at most 25 lines: one tag with the project's own prefix, light DOM, delegated listeners, state through attributes, works when its children are replaced; point to the `ui-sdk` skill.
- Defers to: `ui-sdk` (boundary sentence), `ripple-customize-component`.
- `## Done when`: no checker errors (warnings are allowed); works with JavaScript off or degrades to readable content; fixed last item.

#### 4.5.9 `ripple-check-and-fix`

- description: `Runs Ripple's checker and fixes what it reports. Use after any change to storefront UI, before saying the work is done, and whenever output contains a rule id such as RP101.`
- Line budget: 200.
- `## Rules`: fix the FIRST diagnostic, then run again; apply the `fix` line literally when it is replacement text; MUST NOT silence a rule by deleting the component or by replacing it with raw markup; MUST NOT edit library files to satisfy a rule; warnings do not block but MUST be read.
- `## Steps`: (1) `npx __PKG__ check`. (2) Read the first diagnostic. (3) Apply `fix`. (4) Repeat until the last line starts with `No problems`. (5) With a running app: `npx __PKG__ check --browser --url <url>`. (6) Then the project's build and typecheck.
- `## Reading a diagnostic`: the text format and the example of `07-manifest-registry-cli.md` section 9.4.1, copied byte for byte, and one sentence per line label (`found`, `allowed`, `fix`, `why`, `docs`). A structure finding ends with the manifest rule id in square brackets, for example `[dialog-needs-title]`.
- `## Commands`: table of `check` flags: `--json`, `--url`, `--browser`, `--rule <id>`, `--max-warnings <n>` (D-057).
- `## Common fixes`: a table of exactly these rules with a one-line fix each: RP101, RP103, RP104, RP105, RP110, RP111, RP113, RP115, RP201, RP203, RP301, RP302, RP308, RP309, RP402, RP404, RP505, RP508, RP601. For any other id: `npx __PKG__ docs <RULE>`.
- `## Browser checks`: what `--browser` adds (upgrade stability, layout shift, console errors, no-JS flows, overflow, contrast) and that it needs Playwright.
- Defers to: `hydrogen-smoke-test` (boundary sentence).
- `## Done when`: fixed last item; `--browser` run clean when a URL is available.

#### 4.5.10 `ripple-upgrade`

- description: `Upgrades Ripple to a new version and merges local edits to scaffolded files. Use when changing the Ripple version, when npx __PKG__ status shows outdated files, or after an upgrade reports conflicts.`
- Line budget: 160.
- `## Rules`: MUST run `upgrade --dry-run` first; MUST NOT use `--force` or `--theirs` without the user's instruction; MUST resolve every conflict marker before finishing; MUST NOT change the `@ui-sdk/*` versions by hand (they are pinned by the package).
- `## Steps`: (1) Update the package version (npm hosts) or use `npx __PKG__@<version>` (Liquid). (2) `npx __PKG__ status`. (3) `npx __PKG__ upgrade --dry-run` and read the plan. (4) `npx __PKG__ upgrade`. (5) On conflicts: `npx __PKG__ upgrade --write-conflicts`, resolve, remove markers. (6) `npx __PKG__ skills sync`. (7) Checker.
- `## Reading the plan`: the plan's action words and what each means. Source: `07-manifest-registry-cli.md` (upgrade decision table).
- `## Resolving conflicts`: the four marker lines (`<<<<<<< yours`, `||||||| installed`, `=======`, `>>>>>>> upstream`) and the rule "keep your change and the upstream change; when they cannot both stay, keep upstream structure and re-apply your styling".
- Defers to: `migrate-to-hydrogen-2026-10` (boundary sentence).
- `## Done when`: `status` shows every file at the new version; no conflict markers (`RP511`); fixed last item.

#### 4.5.11 `ripple-liquid`

- description: `Rules for using Ripple in a Shopify Liquid theme built with blocks and partials. Use for any change to templates, layouts, blocks or snippets in a theme that has Ripple blocks.`
- Line budget: 260.
- `## Rules`: the Liquid rules of 3.2 block C, merged into at most 12 items (S-7; same meaning, none dropped; rules 13 to 15 are merged into the items on params and files).
- `## Steps`: (1) Read the theme's `AGENTS.md`. (2) Find the block: `blocks/<name>.liquid` `{% doc %}`. (3) Compose in a template or layout (both are blueprint files; a missing one is added with `npx __PKG__ add --blueprint <id>`). (4) For a region, write `{% partial '<region>' %}` in the template around the component's region snippet. (5) Add locale keys. (6) `npx __PKG__ check` (when a shell exists).
- `## Three kinds of component`: block (one outlet), parts (one block per part, ids passed), resource (self-contained, body replaces default). One example each, taken from fixtures: Button, Dialog with DialogTitle, ProductCard.
- `## Params`: snake_case mapping; booleans; quoted scale strings; `class` and `attributes` (`{{ attributes }}` is printed last in the root's opening tag, so it cannot replace an attribute Ripple prints; a root printed by `{% form %}` accepts only `id` and `class`); reserved names that are never params (`true false nil blank empty content block section form settings for`) and their replacements (`form_id`, `cart_lines`, `rp_field`, `html_for`); the hook params `dialog` (openers) and `tooltip` (tooltip triggers). The sentence required by 6.3: "A wrong value renders the default silently. Run the checker."
- `## Partials and regions`: fixed names; `{% partial %}` only in `templates/` and `layout/`, at most once per name per rendered page (so the layout omits the CartDrawer when `template.name == 'cart'`); the six region snippets (`rp-cart-lines-list`, `rp-cart-summary-totals`, `rp-product-gallery-media`, `rp-product-recommendations-list`, `rp-filters-groups`, `rp-predictive-search-results`), each rendered with the same params everywhere; blueprint-owned regions through `attributes: 'data-rp-region="<name>"'` on a layout block; overlay root outside the region.
- `## Files Ripple owns`: `layout/theme.liquid`, `layout/password.liquid` and `templates/*.liquid` are blueprint files; `snippets/rp-head.liquid` prints, in this order, the `ripple.css` stylesheet tag, `{% render 'rp-tokens' %}`, the config element `<script type="application/json" id="rp-commerce">`, the inline commands polyfill and the `ripple.js` module script; `snippets/rp-import-map-entries.liquid` adds six entries (`ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`) to the theme's one import map; theme code imports from `ripple` and never loads `@shopify/hydrogen` itself; the theme has no JavaScript module of its own.
- `## Liquid subset`: the three scopes as a table (component files; templates and layouts; infrastructure snippets) with the tags and filters of each, copied from `06-bindings.md`; `block`, `partial`, `paginate` and `layout` are legal only in templates and layouts; the checker reports a tag or filter outside its scope.
- `## Cart and product forms`: platform field names (Liquid column of D-043); quantity is absolute; no discount form without JavaScript.
- `## Strings and settings`: locale keys `ripple.<component>.<key>`; schema labels `t:ripple.*`; at most three styling settings per block.
- `## CSS`: `assets/ripple.css` is loaded before `styles.min.css`; utilities need the compiler; tokens as theme settings. Utilities name Ripple tokens through the `@theme reference` region in `config/styles.css` (`bg-primary`).
- `## Which Hydrogen skills apply here`: the Liquid column of 4.3, by name.
- Defers to: the theme's own `AGENTS.md` and `DESIGN.md`; `ripple-commerce`, `ripple-theming`.
- `## Done when`: Theme Check clean (when available); no `{% block %}` under `blocks/` or `snippets/`; fixed last item.
- Fallback (SPIKE-03): when the Canvas compiler rejects the `@theme reference` region, the last sentence of `## CSS` is replaced by: "Utilities name Ripple tokens with arbitrary values, for example `bg-(--color-primary)`."
- Fallback (SPIKE-02): when `as` is not a legal block argument, every mention of the param `as` in this skill becomes `tag`.

#### 4.5.12 `ripple-react`

- description: `Rules for Ripple's React bindings: server rendering, hydration, events, controlled props and cart hooks. Use when writing or changing React components that render Ripple components in a React project.`
- Line budget: 200.
- `## Rules`: the eight React rules of 3.2 block C, plus: MUST NOT conditionally render a part that the binding always prints; MUST NOT pass `id={undefined}`; text children of a Ripple component MUST be a single string or elements, not adjacent expressions.
- `## Steps`: (1) Import the binding. (2) Give required ids. (3) Use `default*` props for initial state. (4) Add a callback only when the app needs the value. (5) Hydrate and confirm zero hydration warnings.
- `## Events`: table event to callback (`openchange` to `onOpenChange`, `valuechange` to `onValueChange`, `indexchange` to `onIndexChange`, `action` to `onAction`), signature `(value, detail)`.
- `## Controlled props`: the four of D-036 with one example (Dialog `open` + `onOpenChange`).
- `## Cart data`: `<pkg>/react` exports exactly `useElement`, `useCart(selector, serverValue)` and `useRegionHtml(name)`. `useCart` returns `serverValue` on the server, during hydration and when the store is unusable. `useRegionHtml` returns `null` until the first refresh publishes HTML for that region. React may render cart structure from store state; counts, error text and pending attributes are written by the elements, so the nodes that hold them are rendered with constant props. A `"use client"` file exports components only; mapping functions such as `toRippleCart` are imported from `./<id>.data`.
- Fallback (SPIKE-10): when `useRegionHtml` cannot be hydrated without a mismatch, the `useRegionHtml` sentences are replaced by: "For predictive search and recommendations, cancel the `rp:refresh` event (`event.preventDefault()`) and render the results yourself."
- `## Editing a binding`: rules R-1 to R-5 in one line each, and "use `useElement`; never attach listeners as props on a custom element".
- Defers to: `hydrogen-storefront-client`, `hydrogen-routing`; `ripple-commerce`.
- `## Done when`: no hydration warning in the console; server HTML equals client HTML for the changed route; fixed last item.

#### 4.5.13 `ripple-remix`

- description: `Rules for Ripple's Remix 3 bindings: server components, required ids, regions and document navigations. Use when writing or changing Remix 3 components that render Ripple components.`
- Line budget: 160.
- `## Rules`: the seven Remix rules of 3.2 block C, plus: every `ui-*` and `rp-*` root keeps its `data-rmx-key`; RichText uses `innerHTML={unsafeHTML(html)}`; MUST NOT create a `<Frame>` for a region.
- `## Steps`: (1) Import the binding. (2) Give required ids. (3) Leave each region as the plain element the binding prints (it carries `data-rp-region`). (4) Mark cart forms and checkout links `data-rmx-document`. (5) Navigate between two pages and confirm open state and focus behave.
- `## Regions`: region names; a region is a plain element with `data-rp-region`, and after a cart action, a variant change or a filter change Ripple fetches the page and replaces each named region. No Frame, no client code. Then one paragraph headed "Opt-in": an app MAY pass `reloadFrames` (reload named Frames instead of fetching the document, used when a refresh has no URL) and `navigate` (used for variant and filter changes) to `configureCommerce`; with `reloadFrames` the app passes a `<Frame>` as the children of the region part. Neither is needed and no blueprint uses them.
- Fallback (SPIKE-11): when the spike fails, the "Opt-in" paragraph is deleted from this skill and from guide `hosts-remix`.
- `## Listening to events`: a 6-line example of `addEventListener("openchange", ...)` in the app's own client code.
- Defers to: `remix` (boundary sentence); `ripple-commerce`.
- `## Done when`: morph navigation keeps overlays closed and state attributes intact; fixed last item.

#### 4.5.14 `ripple-agent-ready`

- description: `Makes a Ripple storefront usable and safe for in-page AI agents through accessible names, the UI SDK agent bridge and confirmation marks. Use when asked for WebMCP, agent actions, an embedded shopping assistant, or agent safety on a storefront.`
- Line budget: 160.
- `## Rules`: every control has an accessible name; every action is a real form or link (this is what agents outside the page use); the bridge is opt-in and MUST NOT be loaded by default; controls that start checkout carry `data-agent-confirm` with a full sentence; password and payment fields carry `data-agent-secret`; an in-page agent MUST ask the person before any step whose `confirm` is set; there is no `checkout` action: an agent reaches checkout only by pressing the checkout control, which is gated by `data-agent-confirm`; only three `data-agent-*` attributes exist. The skill MUST contain the sentence of 7.3 item 6.
- `## Steps`: (1) Checker clean (names: RP201, RP202). (2) Load the bridge (the per-host snippet of 7.4). (3) Create the agent with an `allow` that asks the person. (4) `registerTools` for WebMCP. (5) Run the agent test of 7.6.
- `## What an agent can see`: table of 7.1.
- `## Actions`: the action table of 7.2 by element.
- `## Confirmation`: 7.3 in at most seven lines.
- Defers to: `ui-sdk` (boundary sentence; `references/agent-ready.md`).
- `## Done when`: every commerce root on the page that declares actions has an entry in `snapshot()`; pressing the checkout control with no approval is refused; fixed last item.

### 4.6 Acceptance (skills)

| Id | Test (`skills/skills.test.ts`, run by the root test script) | Pass condition |
|---|---|---|
| K-20 | List `skills/`. | Exactly the 14 directory names of 4.2; each contains exactly `SKILL.md` and `ripple.json`. |
| K-21 | Parse each `SKILL.md`. | Frontmatter keys are exactly `name`, `description`; `name` equals the directory; `description` is byte-equal to 4.5 and contains ` Use when` or ` Use for` or ` Use after`; at most 300 lines; headings follow S-6 in order. |
| K-22 | Extract every fenced `html`, `liquid`, `tsx` block of every skill. | Each block is a substring (after collapsing whitespace) of a fixture file, a generated example in `pkg/docs/components/`, or a blueprint file. Blocks whose first line is the comment `<!-- sketch -->`, `{% comment %}sketch{% endcomment %}` or `// sketch` are exempt and limited to 3 per skill. |
| K-23 | Each sidecar. | Deep-equals `{ hosts: [...] }` with the hosts of 4.2. |
| K-24 | Grep all skills for `D-0\d\d`, `SPIKE-`, `src/`, `00-decisions`, and the literal placeholder package name. | Zero matches. |
| K-25 | Every skill name written in backticks inside a skill that starts with `hydrogen-`, or equals `ui-sdk`, `remix`, `migrate-to-hydrogen-2026-10`. | Appears in the table of 4.3. Every `ripple-*` name appears in 4.2. |
| K-26 | `ripple` skill "Rules" section. | Byte-equal to `UNIVERSAL_RULES` with `{command}` replaced by `npx __PKG__`. |
| K-28 | Grep all skills for `data-rp-open=`, `named blocking Frame`, the regular expression `(?<!data-)orientation=`, `docs --rule`, `form:` used as a Liquid param (regular expression `[,{%]\s*form:\s`), and `references/`. | Zero matches, except `data-rp-open=` inside a fenced `html` block (rendered markup). |
| K-27 | In a temp project per host run `ripple skills sync`. | `.claude/skills` and `.agents/skills` each contain exactly the skills whose sidecar lists that host (liquid: 12; react: 12; remix: 12; html: 11). |

---

## 5. Checker rule text

`ripple check` has four layers (D-059): S (source), H (rendered HTML), B (browser), P (project state). `07-manifest-registry-cli.md` section 9 owns the engine, the rule ids, each rule's severity, layers, hosts and detection, the `fix` computation, flags, exit codes and the output format. This section owns the words an agent reads in each diagnostic: `problem`, `fix` and `why` for all 55 rule ids, and through them the rule pages of 2.6. Rule ids are stable public API.

### 5.1 Text format

The text format is defined only in `07-manifest-registry-cli.md` section 9.4.1 (first line `<RULE> <severity>  <location>  <component>: <problem>`, with `<component>: ` omitted when the finding has no component; then the `found`, `allowed`, `fix`, `why` and `docs` lines; `docs` is `<command form> docs <RULE>`).

### 5.2 JSON format (`--json`)

The JSON format is the `Report` object defined only in `07-manifest-registry-cli.md` sections 9.3 and 9.4.2; the eval harness (section 8) and the `ripple-check-and-fix` skill read only that shape.

### 5.3 How `fix` is computed

The algorithm is defined only in `07-manifest-registry-cli.md` section 9.5.1; in the tables of 5.5 the word "computed" in a `fix` cell means "the text that algorithm returns".

One input to that algorithm is word data and is kept here: the synonym table. `07-manifest-registry-cli.md` section 9.5.1 does not contain it today; it MUST gain one step, placed before its rule 1: "when the found value is a key of `FIX_SYNONYMS` and the mapped value is allowed for the prop, the fix is the mapped value". The table is the constant `FIX_SYNONYMS` in `src/check/report.ts`. Additions to it are decided by eval data (section 8.13, rule G-1).

| Found | Fix |
|---|---|
| `critical`, `danger`, `error`, `red` | `destructive` |
| `default`, `filled`, `solid` (Button `variant`) | `primary` |
| `outlined`, `bordered` | `outline` |
| `text`, `plain` (Button `variant`) | `ghost` |
| `small`, `s` | `sm` |
| `medium`, `m`, `default` (prop `size`) | `md` |
| `large`, `l` | `lg` |
| `left` | `start` |
| `right` | `end` |
| `middle` | `center` |
| `space-between` | `between` |
| `vertical` (prop `direction`) | `column` |
| `horizontal` (prop `direction`) | `row` |
| `grey`, `gray`, `subtle` (prop `tone`) | `muted` |

### 5.4 Placeholders

Rule text uses `{name}` placeholders filled by the rule: `{prop}`, `{value}`, `{component}` (id), `{Component}` (title), `{part}`, `{tag}`, `{class}`, `{attr}`, `{id}`, `{name}`, `{region}`, `{file}`, `{n}`, `{max}`, `{version}`, `{role}`, `{bp}`. A rule MUST NOT print a placeholder unfilled.

### 5.5 Rule registry

Each rule is one file `src/check/rules/<RULE>.ts` (ledger 5.1). Besides the `Rule` object with `meta: RuleMeta` that `07-manifest-registry-cli.md` section 9.3 requires, the file exports the rule's words:

```ts
// src/check/report.ts
export interface RuleText {
  problem: string;   // the `problem` cell; several forms are separated by " | " in the order of the table
  fix: string;       // the `fix` cell; the literal string "computed" when 07 section 9.5.1 computes it
  bad: string;       // smallest example that triggers the rule (shown in the rule page)
  good: string;      // the same example, fixed
}

// src/check/rules/RP306.ts (shape of every rule file's second export)
export const text: RuleText = {
  problem: 'checkout button has no name="checkout"',
  fix: 'name="checkout"',
  bad: '<button class="rp-button rp-checkout-button" type="submit">Check out</button>',
  good: '<button class="rp-button rp-checkout-button" type="submit" name="checkout">Check out</button>',
};
```

The table below is the normative content of `text.problem`, `text.fix` and `meta.why`; `meta.title` is the "Reports" cell. The "Sev" and "Layers" columns are COPIES of `07-manifest-registry-cli.md` section 9.6, shown for reading; when they differ, section 9.6 wins and this table is corrected. `allowed` is computed by the rule (the enumeration, or the expected structure). A rule builds the `problem` and `fix` strings of a diagnostic by filling the placeholders of 5.4 in these texts; it MUST NOT print wording that is not in this table. Every command inside a `fix` is printed in the command form (section 0).

The V1 set is exactly 55 ids (D-059): RP101 to RP105, RP110 to RP118, RP201 to RP204, RP301 to RP309, RP320, RP321, RP401 to RP406, RP501 to RP508, RP510 to RP512, RP601 to RP609. Every other number is reserved; `RP000` (internal error) and `RP509` are reserved by `07-manifest-registry-cli.md` and have no text here. No component document may introduce an `RPnnn` id.

Rewrites required by D-059 are applied: RP204 does not name Menu; RP303 does not name a drawer viewport; RP320 does not name Shop Pay. RP111 also reports a prohibited `ui-*` tag (D-022). RP118 is the rule added by the ledger; RP308, RP309, RP507 and RP508 are the rules added by the reconciliation (D-102).

Usage and structure:

| Id | Sev | Layers | Reports | `problem` | `fix` | `why` |
|---|---|---|---|---|---|---|
| RP101 | error | S (Liquid), H | A prop value outside its enumeration or scale | `unknown value "{value}" for prop "{prop}"` | computed (5.3) | Prop values are enumerated. An unknown value matches no CSS rule, so the component silently renders its default. |
| RP102 | error | S (Liquid) | An argument that is not a prop | `unknown argument "{name}"` | `remove {name}, or use one of the props listed in allowed` | A block ignores arguments it does not declare, so the value has no effect. |
| RP103 | error | S, H | Responsive value grammar | one of: `two values for breakpoint "{bp}" in prop "{prop}"`; `unknown breakpoint "{bp}" in prop "{prop}"`; `prop "{prop}" must be a quoted string in Liquid` | computed (the duplicate-breakpoint and unknown-breakpoint steps of `07-manifest-registry-cli.md` section 9.5.1); for the third form: `{prop}: '{value}'` | A responsive value is one string of tokens; a token that matches no rule is ignored by the CSS. |
| RP104 | error | S, H | A required prop or required id is missing or malformed | `{Component} requires "{prop}"` or `id "{id}" is not a valid id` | `add {prop}` (for `id`: `add id: a unique, stable id such as "size-guide"`); for a malformed id: `start with a letter; use only letters, digits, "-" and "_"` | Parts are linked by ids derived from this value; without it they cannot be connected. |
| RP105 | error | S (Liquid) | A boolean prop given a string | `prop "{prop}" is a boolean but got the string {value}` | `{prop}: true` (or `remove {prop}` when the string is `'false'`) | In Liquid the string 'false' is truthy, so the prop would turn on. |
| RP110 | error | H | A Ripple root class on the wrong element | `class "{class}" on <{tag}>` | `use the {Component} component, or remove the class` | Component CSS and scripts expect the documented element; other elements lose behaviour and semantics. |
| RP111 | error | S, H | An unknown `rp-` class or tag, or a prohibited `ui-*` tag | `"{name}" is not a Ripple class or element` (prohibited ui tag: `<{tag}> is not allowed; Ripple uses native controls instead`) | nearest manifest name by Levenshtein distance at most 2 as `use "{name}"`; else `remove it; names starting with rp- are reserved for Ripple` (prohibited ui tag: `use the {Component} component`) | Names starting with rp- are reserved; an unknown one matches no CSS and no element. |
| RP112 | error | H, P | A custom element tag whose component is not installed | `<{tag}> is used but {Component} is not installed` | `<command form> add {component}` | Nothing defines the element, so it stays inert. |
| RP113 | error | H | A structure rule of the manifest (`rules[]`) is violated | the manifest `rules[].message`, followed by one space and the rule id in square brackets: `{value} [{name}]`, for example `Dialog needs a DialogTitle [dialog-needs-title]` | the manifest `rules[].fix` | The component's script and CSS depend on this structure. |
| RP114 | error | H | Duplicate or mismatched ids | `duplicate id "{id}"` or `part id "{id}" does not match its root; expected "{value}"` | `rename one of them` or `id="{value}"` | Parts find each other by id; a duplicate or wrong id connects the wrong elements. |
| RP115 | error | H | A hand-rolled ARIA widget | `role="{role}" outside a Ripple component` | `use the {Component} component` (mapping: `dialog`, `alertdialog` to Dialog; `tablist` to Tabs; `radiogroup` to RadioGroup; `menu`, `menubar` to Popover with links; `listbox`, `combobox` to Select; for `slider`: `remove the role and use a native <input type="range">`; for `toolbar`, `tree`: `remove the role and use buttons or links in a list`) | Widget roles promise keyboard behaviour that hand-written markup does not provide. |
| RP116 | warning | S, H | A raw colour on or inside a Ripple root | `raw colour "{value}"` | `use a token, for example var(--color-primary)` | Raw colours ignore schemes and theme settings. |
| RP117 | warning | S | A forbidden import | `import of "{name}"` | `import from "<pkg>" or its documented entry points` | Internal and React UI SDK entries print different markup and can load a second copy of the kernel. |
| RP118 | error | H | `data-state`, an unknown `data-rp-*` attribute, or an unknown value of `data-rp-field` or `data-rp-js` | `attribute "{attr}" is not part of the Ripple contract` or `value "{value}" is not allowed for {attr}` | for `data-state`: `use a state attribute such as data-open or aria-expanded`; else nearest known `data-rp-*` name as `use {attr}`, else `remove {attr}`; for a value: computed (nearest allowed value) | Scripts and tests read a fixed list of attributes; others are ignored. |

Accessibility (static):

| Id | Sev | Layers | Reports | `problem` | `fix` | `why` |
|---|---|---|---|---|---|---|
| RP201 | error | H | A control with no accessible name | `{Component} has no accessible name` | `add ariaLabel (Liquid: aria_label)` (when the component allows text: `add ariaLabel (Liquid: aria_label), or visible text`) | Screen readers and agents find a control by its accessible name. |
| RP202 | error | H | A form control in a Field without a label | `control "{id}" has no label` | `add a Label with htmlFor="{id}" (Liquid: html_for)` | A control without a label cannot be identified by assistive technology. |
| RP203 | error | H | An image without `alt`, `width` or `height` | `Image is missing {attr}` | `add {attr}` (for `alt` on a decorative image: `alt=""`) | alt gives the image a text equivalent; width and height reserve space and prevent layout shift. |
| RP204 | error | H | An overlay inside a link or clickable card | `{Component} is inside a link` | `move the {Component} outside the <a>` | Interactive content inside a link is invalid and activates both. Applies to Dialog, Drawer, Popover and Tooltip roots. |

Progressive enhancement, commerce, agent attributes:

| Id | Sev | Layers | Reports | `problem` | `fix` | `why` |
|---|---|---|---|---|---|---|
| RP301 | error | H | A button that does nothing without JavaScript inside a commerce root | `button does nothing without JavaScript` | `put it in a <form>, or add commandfor / popovertarget, or mark it data-rp-js="inflow" if it only enhances` | Commerce actions must work as form posts when scripts do not load. |
| RP302 | error | H | An opener that is not a link although a page exists | `{Component} opener is not a link` | `use a Link with href="{value}" and dialog="{id}"; it prints <a href="{value}" data-rp-open="{id}">` | Without JavaScript the link still reaches the page. |
| RP303 | error | H (server HTML) | Wrong initial hidden state | one of: `unselected tab panel is not hidden`; `<dialog> is printed open`; `empty error or status message is not hidden`; `a no-JavaScript fallback control is hidden` | `add hidden` / `remove open; use defaultOpen (Liquid: default_open)` / `add hidden` / `remove hidden` | The server prints the closed state so that nothing flashes or shifts when scripts load. |
| RP304 | warning | H | A component that must work without JavaScript inside one that does not | `{Component} is inside {name}, which needs JavaScript` | `move it outside, or use Accordion instead of Tabs` | Content inside a JavaScript-only container is unreachable when scripts do not load. |
| RP305 | error | H | Wrong form field names for the backend | one of: `product form has no input named "id"`; `add form has no "merchandiseId" field`; `first submit button of a cart line form must be name="intent" value="set" hidden`; `first submit button of the cart form must be name="update"`; `{n} updates[] inputs for {max} cart lines` | `add the field shown in allowed` (for the last form: `print one updates[] input per cart line, in line order`) | The cart endpoint reads exactly these field names. |
| RP306 | error | H (Liquid) | A checkout submitter without `name="checkout"` | `checkout button has no name="checkout"` | `name="checkout"` | The platform's cart form goes to checkout only for a submitter with this name. |
| RP307 | error | S (Liquid) | A second configuration of `Shopify.actions.updateCart`, or one of the two base-theme files | `{file} configures Shopify.actions.updateCart` | `delete {file}` (for an inline call: `remove the configure call`) | Only one configuration takes effect; a second one disables Ripple's cart. |
| RP308 | warning / error | H | A refresh that names no region on the page (warning); an `rp-cart` inside the region it refreshes (error) | `region "{region}" is named in data-rp-refresh but is not on this page` or `rp-cart is inside region "{region}", which it refreshes` | `add an element with data-rp-region="{region}" (the component's region part), or remove "{region}" from the refresh prop` / `move the {Component} root outside the region; only its region part belongs inside` | A refresh replaces the region's markup: a region that is absent cannot update, and an element inside its own region is destroyed while it works. Only `rp-cart` roots are checked for containment; an `rp-live` root (VariantPicker, SortSelect, FilterChips) MAY be inside the region it refreshes. |
| RP309 | error | H | Commerce elements on a page with no commerce configuration | `<{tag}> is on a page with no commerce configuration` | `print <script type="application/json" id="rp-commerce"> in <head> before ripple.js (Liquid: {% render 'rp-head' %}; other hosts: the layout blueprint), or call configureCommerce(options) before the first commerce element connects` | Without its options the commerce runtime cannot find the cart endpoint or the cart drawer, so cart forms fall back to full page loads. |
| RP320 | error | H | An irreversible control without `data-agent-confirm` | `{Component} has no data-agent-confirm` | `data-agent-confirm="Goes to checkout with this cart"` | In-page agents must ask a person before actions that cannot be undone. Applies to the controls listed in manifest `agent.confirm` (CheckoutButton). |
| RP321 | warning | H | An unknown `data-agent-*` attribute | `attribute "{attr}" is not an agent attribute` | `use data-agent-confirm, data-agent-secret or data-agent-hidden` | The agent bridge reads only these three. |

Liquid source:

| Id | Sev | Layers | Reports | `problem` | `fix` | `why` |
|---|---|---|---|---|---|---|
| RP401 | error | S | `{% block %}` inside `blocks/` or `snippets/` | `{% block %} in {file}` | `{% render 'rp-{name}' %}` when that snippet exists; else `move the block call to a template or layout` | The platform allows block calls only in templates and layouts. |
| RP402 | error | S, P | A block call with no block file | `block "{name}" does not exist` | `<command form> add {name}` when `{name}` is a manifest block; else nearest block name as `'{name}'` | The call renders nothing. |
| RP403 | error | S | A region name with no partial, or a partial declared twice | `region "{region}" has no {% partial %}` or `partial "{region}" is declared twice` | `add {% partial '{region}' %} around the region snippet in the template or layout` / `remove one declaration` | A refresh fetches a partial by name; a missing or duplicate name cannot be refreshed. |
| RP404 | error | S | An overlay root inside the partial it refreshes | `{Component} root is inside partial "{region}"` | `move the partial inside the {Component} body` | A refresh replaces the partial's markup, which would close the overlay. |
| RP405 | error | P | Block file budget exceeded | `{n} block files; limit {max}` | `remove unused blocks` | The platform limits a theme to 300 block files; Ripple may use 150. |
| RP406 | error / warning | P | `AGENTS.md` too large (error); Ripple section missing or stale (warning) | `AGENTS.md is {n} bytes; limit 50000` or `the Ripple section of AGENTS.md is missing or out of date` | `shorten the text outside the Ripple markers` / `<command form> upgrade` | Shopify stores at most 50 kB; the section is the only guide an agent has in the theme editor. |

Project state:

| Id | Sev | Layers | Reports | `problem` | `fix` | `why` |
|---|---|---|---|---|---|---|
| RP501 | error | P | A missing dependency or file of an installed component | `{Component} needs {name}, which is not installed` | `<command form> add {name}` | Components embed each other; a missing file renders nothing. |
| RP502 | warning | P | Installed files older than the running package (file state `outdated`) | `{n} installed files are older than the package` | `<command form> upgrade` | Mixed versions can disagree about the contract. |
| RP503 | error | P | More than one copy or a wrong version of a pinned package | `{n} copies of {name} are installed` or `{name} is {version}; expected {value}` | `install exactly {name}@{value} and remove the duplicate` | Two copies of the kernel or of Hydrogen do not share state. |
| RP504 | error | P | A file at a registry path with no trailer | `{file} has no Ripple trailer` | `rename your file, or restore the trailer line` | Without the trailer Ripple cannot tell its file from yours and will not upgrade it. |
| RP505 | error | S | CSS layer order | one of: `the layer statement is not the first statement`; `ripple.css is imported after tailwindcss`; `theme.css is imported before tailwindcss`; `@tailwindcss/browser is used` | `import ripple.css first, then tailwindcss, then theme.css` (for the last form: `remove @tailwindcss/browser; compile Tailwind in the project's build`) | Layer order decides that utilities override components; it is fixed by the first statement. |
| RP506 | warning | P | Skills out of date | `skills are from version {version}` | `<command form> skills sync` | Old skills describe an old API. |
| RP507 | error | H | More than one Ripple runtime on the page | `{n} Ripple runtimes are loaded: {value}` | `load exactly one of ripple.js, ripple.elements.js, or the bundled imports` | Two runtimes define each element twice and can load a second copy of the kernel, which does not share state with the first. |
| RP508 | warning | P | `props.css` or `theme.css` older than `tokens.css` | `{file} is older than tokens.css` | `<command form> upgrade` | props.css and theme.css are derived from tokens.css; a stale copy applies the old scales and breakpoints. |
| RP510 | error | P | A patch that `init` could not apply is absent | `{file} is missing {value}` | `add the line {value}` | Without this line Ripple's styles or scripts do not load. |
| RP511 | error | S | Merge conflict markers | `unresolved merge conflict` | `keep both changes where possible, then delete the marker lines` | A file with conflict markers does not parse. |
| RP512 | warning | P | Two files with the same trailer id | `{file} duplicates {name}` | `delete the copy you do not use` | Only one of them will be upgraded. |

Browser (`--browser`):

| Id | Sev | Layers | Reports | `problem` | `fix` | `why` |
|---|---|---|---|---|---|---|
| RP601 | error | B | Markup changed when scripts loaded | `{Component} markup changed on upgrade: {attr}` | `print {attr} on the server, as in the component's reference HTML` | Server HTML must already be the final markup, or hydration and layout break. |
| RP602 | error | B | Layout shift on upgrade | `layout shifted by {value} when scripts loaded` | `give the element its final size in server HTML` | Content must not move after first paint. |
| RP603 | error | B | A console error, page error, failed same-origin request or hydration warning | `{value}` (the first line of the message) | `fix the error shown in found` | A storefront page must load cleanly. |
| RP604 | error | B | A custom element never defined | `<{tag}> was not defined after 2 seconds` | `load ripple.js once, or <command form> add {component}` | An undefined element has no behaviour. |
| RP605 | error | B | An ARIA pattern violation | `{Component}: {value}` (one problem reported by `checkPattern`) | `use the component's reference HTML unchanged` | The pattern defines the roles, states and keys users rely on. |
| RP606 | error | B | A no-JavaScript flow fails | `{Component} does not work with JavaScript off: {value}` | `make the action a form post or a link` | The storefront must work when scripts do not load. |
| RP607 | warning | B | Agent snapshot gaps, for roots that declare actions | `{Component} is missing from the agent snapshot` or `{n} {Component} roots cannot be told apart in the agent snapshot` | `load <pkg>/commerce (or ripple.js) before creating the agent` / `add ariaLabel (Liquid: aria_label) to each` | In-page agents address a component by its snapshot entry; a missing or ambiguous entry cannot be addressed. |
| RP608 | error | B | Horizontal overflow | `page is {value}px wider than the viewport at {n}px` | `remove the fixed width, or use the responsive props` | Horizontal scrolling hides content on phones. |
| RP609 | warning | B | Low text contrast, including a dial colour outside sRGB that yields an unreadable foreground | `contrast {value}:1 is below {max}:1` | `change the token, not the component` | Text must be readable (WCAG 2.2 AA). |

Notes:

- RP113 reports the component-specific structure rules, which are manifest `rules[]` entries with kebab-case ids (D-059). Their `message` and `fix` are written by the owning component document; this document owns only the bracket form and the `why`. Eval task T08 depends on two of them: `variant-picker-outside-form` (`11-components-commerce.md`) and `dialog-needs-title` (`10-components-interactive.md`).
- RP607 applies only to roots whose manifest `agent.actions` is non-empty (D-095). It never reports a missing label on `rp-dialog`, `rp-quantity` or `rp-navigation-menu` (section 7.5).
- RP308 and RP406 have two severities; which finding has which is stated in the "Reports" cell.
- Theme Check findings (`TC:<CheckName>`) carry Theme Check's own message. This document supplies no text for them; how they are merged and printed is `07-manifest-registry-cli.md` section 9.5.4.
- `bad` and `good` examples for `docs/rules/<RULE>.md` are written in each rule file's `text` export. They MUST be the smallest example that triggers the rule and the same example fixed, and each rule file's unit test MUST assert that `bad` produces exactly one diagnostic of this rule and `good` produces none.

### 5.6 Acceptance (checker text)

| Id | Test | Pass condition |
|---|---|---|
| K-30 | Retired: the output-format golden test belongs to `07-manifest-registry-cli.md` section 12. The id is not reused. | Not applicable. |
| K-31 | For every file `src/check/rules/RP*.ts`. | `meta.id` equals the file name; `text.problem`, `text.fix` and `meta.why` equal the tables of 5.5 (the test reads a JSON copy of those three columns, `src/check/rules/meta.expected.json`, written by hand from 5.5 and committed: an object keyed by rule id with the keys `problem`, `fix`, `why`). Severity and layers are tested by `07-manifest-registry-cli.md`. |
| K-32 | The set of rule files (and the key set of `meta.expected.json`). | Equals exactly the 55 ids of D-059: RP101 to RP105, RP110 to RP118, RP201 to RP204, RP301 to RP309, RP320, RP321, RP401 to RP406, RP501 to RP508, RP510 to RP512, RP601 to RP609. |
| K-33 | `FIX_SYNONYMS` unit tests (the other `fix` cases are tested by `07-manifest-registry-cli.md`). | `critical` on `tone` gives `destructive`; `align: 'middle'` gives `align: 'center'`; `justify: 'space-between'` gives `justify: 'between'`; `size: 'large'` gives `size: 'lg'`; `variant: 'solid'` on Button gives `variant: 'primary'`; `variant: 'solid'` on Badge (where `solid` is allowed) produces no finding. |
| K-34 | Each rule's `bad` / `good`. | As stated in the last note of 5.5. |
| K-35 | Run `check --json` on the T08 start state (section 8.6). | Valid JSON of the `Report` shape (`07-manifest-registry-cli.md` section 9.3); `counts.error` is 9 and `counts.warning` is 1; the rule ids are those listed for T08 in 8.6; the two RP113 findings end with `[variant-picker-outside-form]` and `[dialog-needs-title]`. |
| K-36 | Scan every `text.fix` and every `fix` string a rule module builds. | None contains `npx ` followed by the package name; each command is produced by the command-form helper of `07-manifest-registry-cli.md` section 7.1 rule 12. |

---

## 6. Development-mode warnings

There is no in-page development overlay and no development-only browser file (D-060). A development-mode warning is a `console` message that Ripple library code prints to help a coding agent while the project runs. The checker is the primary tool; warnings exist so that a mistake is visible in the terminal or browser console of a running dev server before the agent runs `check`.

### 6.1 Invariants (apply to every message Ripple prints, in any mode)

- **W-1** Every message starts with the literal prefix `[ripple] ` and is one line.
- **W-2** Library code MUST NOT throw because of a usage mistake. A mistake degrades to native behaviour (forms post, links navigate) and prints a message.
- **W-3** A development-only warning uses `console.warn`, is printed at most once per distinct message text per page load or server process, and MUST NOT change any return value or any printed markup. Development output and production output are byte-identical.
- **W-4** "Development" means `process.env.NODE_ENV !== "production"` evaluated as in `06-bindings.md` (rule V-2); where `process` does not exist the mode is production. The prebuilt browser files (`browser/*.js`, Liquid assets) are production builds and contain no development-only warnings.
- **W-5** A NEW message family about a mistake that a checker rule also reports SHOULD end with ` (<RULE>)`, for example ` (RP103)`, so that an agent can run `<command form> docs RP103`. The families already fixed by other documents (table 6.2) keep the text their owner defines; this rule does not change them.
- **W-6** Messages are English and not localised.

### 6.2 Catalogue

This is the complete list of message families. A new family MUST be added to this table in the same pull request.

| Family | Mode | Level | Emitted by | Text | Owner |
|---|---|---|---|---|---|
| Prop value validation | development | warn | `rv()` in TSX bindings (server and client) | `[ripple] <Component>.<prop>="<value>": <problem>` | `06-bindings.md` (V-2), grammar in `02-html-contract.md` |
| Binding wiring | development | warn | `useElement` | defined in `06-bindings.md` | `06-bindings.md` |
| Late configuration | all | warn | `configureCommerce` | `[ripple] configureCommerce: "<key>" was set after commerce started and is ignored.` | `05-commerce.md` 4.4 |
| Element failed to define or start | all | error | each `rp-*` module, the loader | `[ripple] <tag> failed to define`, `[ripple] chunk "<name>" failed to load`, `[ripple] <step> failed` | `04-elements.md` |
| Commerce disabled | all | error | commerce start | `[ripple] commerce failed to start; forms post natively.`, `[ripple] commerce disabled; forms post natively.` | `05-commerce.md` 4.5 |
| Cart action failed | all | error | `rp-cart` | `[ripple] cart action failed.` | `05-commerce.md` 9.2 |
| Analytics | all | error | commerce start | `[ripple] analytics not started.`, `[ripple] rp-view-event: invalid payload.` | `05-commerce.md` 12 |
| Agent action on a missing target | all | (thrown to the bridge, not logged) | commerce elements | `<tag>: nothing to <action> here` | this document 7.2 |

This document adds no new browser file and no new package entry for warnings (the `pkg/` tree of `01-architecture.md` 6.1 is closed). In the `html` and `liquid` hosts there are no development-only warnings; the checker (`check`, and `check --browser --url <url>` against a running server) is the development feedback loop there, and the eval task prompts never rely on warnings.

### 6.3 Liquid: silent fallback is reported by the checker

An invalid enumerated value falls back to the default in every host (D-073). In the TSX hosts `rv()` also warns in development. On Liquid the fallback (D-038 item 4) prints nothing, because a block cannot log and MUST NOT print extra markup. The mistake is reported by RP101 in layer S (literal arguments) and layer H (rendered `data-` attributes cannot show the invalid value, because the fallback replaced it; therefore layer S is the only detector for literals, and values that come from variables are NOT detectable). The `ripple-liquid` skill MUST state: "A wrong value renders the default silently. Run the checker."

### 6.4 Acceptance (warnings)

| Id | Test | Pass condition |
|---|---|---|
| K-40 | Scan every string literal passed to `console.warn(` or `console.error(` under `src/` (regular expression over source; template literals included). | Each starts with `[ripple] `. |
| K-41 | Grep `pkg/browser/*.js` for every string in `test/dev-only-strings.json` (a committed JSON array; each development-only message family of 6.2 MUST register one distinctive substring of its text there). | Zero matches. |
| K-42 | Render one React fixture page twice, with `NODE_ENV=development` and `NODE_ENV=production`, using an invalid `gap`. | HTML output is byte-equal; development prints exactly one warning; production prints none. |

---

## 7. In-page agent surface

Section 12 of `04-elements.md` fixes what non-commerce elements declare and how the bridge is loaded. This section fixes the rest: what an in-page agent can see and do, the commerce actions, confirmation, labels, and SPIKE-08. It is the owner of the commerce `agent.actions` list (D-095): `05-commerce.md` and `11-components-commerce.md` copy 7.2 verbatim.

Facts this section relies on (evidence):

- The bridge (`createAgent`, `registerTools`, `agentTools`) is re-exported unchanged from `@ui-sdk/web/agent` (`uisdk/packages/web/src/agent.ts`; implementation `uisdk/packages/core/src/page/agent/agent.ts`).
- `snapshot()` lists only UI SDK primitives. Native controls outside a primitive root are invisible to it (`uisdk/packages/core/skills/ui-sdk/references/agent-ready.md`; run in `ripple/docs/research/spikes/agent-kit/`).
- Native buttons INSIDE an `rp-*` root are listed under `buttons` and can be pressed with the generic `press` action; a pressed control carrying `data-agent-confirm` is refused with `Needs a person: "<sentence>". Ask them to press "<name>" themselves.` when no `allow` is given (run: `ripple/docs/research/spikes/elements-runtime/results-agent-confirm.txt`).
- A primitive's `agent` key accepts `actions`, `closed`, `items`, `reveals`, `shown`, `secret` (`uisdk/packages/core/src/foundation/kernel/primitive.ts`). There is NO per-action confirm option. A step's `confirm` text comes from `data-agent-confirm` on the step's target elements (`confirmOf(targets)` in `agent.ts`). Whether the targets of a METHOD step include a descendant control is UNVERIFIED: SPIKE-08.

### 7.1 What each audience sees

| Component kind | Any browser agent (accessibility tree) | In-page agent through the bridge |
|---|---|---|
| `static` | yes: real links, forms, native controls with names | no, unless inside an `rp-*` or `ui-*` root (then its buttons are pressable through that root) |
| `native` | yes | root listed with the actions of `04-elements.md` 12.2 |
| `ui` | yes | listed with UI SDK's own actions |
| `commerce` | yes | root listed with the actions of 7.2 |

Rule A-1: no storefront function may be reachable ONLY through the bridge. Every action of 7.2 is the programmatic twin of a form or link in the same root.

### 7.2 Commerce actions

Each commerce primitive declares `agent.actions` exactly as below. Method names use the bridge's verb vocabulary (`set<Key>`, `add`, `remove`, `submit`, `clear`) so they read naturally.

| Element | `agent.actions` (primitive) | Method signature | Implementation (the same code path as the user's control) |
|---|---|---|---|
| `rp-product-form` | `["setQuantity", "add"]` | `setQuantity(quantity: number): void`; `add(): void` | `setQuantity`: set `value` of `input[data-rp-field="quantity"]` in the root and dispatch a bubbling `change` event on it. `add`: `form.requestSubmit(<[data-rp-part="submit"]>)` on the root's add form. |
| `rp-cart` | `["setQuantity", "remove"]` | `setQuantity(line: string, quantity: number): void`; `remove(line: string): void` | `setQuantity`: find `[data-rp-line="<line>"]` in the root; set the `value` of its `input[data-rp-field="quantity"]`; dispatch a bubbling `change` event on it. `remove`: `click()` on that line's `a[data-rp-part="remove"]` (liquid backend); when the line has no such link (hydrogen backend), `requestSubmit(<button>)` on the line form with its `button[name="intent"][value="remove"]`. |
| `rp-live` | `["submit"]` | `submit(): void` | `requestSubmit()` on the first `form[method="get" i]` in the root. A root with no form (VariantPicker, FilterChips: links only) throws per A-3; agents follow its links through the accessibility tree. Agents set field values with the native controls; there is no per-field action in V1. |
| `rp-predictive-search` | `["setQuery", "clear"]` | `setQuery(query: string): void`; `clear(): void` | Set the `value` of the root's search input (the first `input` that is not `type="hidden"` in the root's GET form) and dispatch a bubbling `input` event on it; `clear` sets the empty string, which also hides the results panel. |
| `rp-recommendations` | `[]` with `shown: () => false` | none | Display only; hidden from agents (convention of `tobi/src/primitives/recommendations.ts`). |

There is NO `checkout` action and no `checkout()` method on the default path (D-050, 7.7).

Manifest form. Every component whose root (or, for CartDrawer, whose embedded root) is one of these elements records the same list in its manifest key `agent.actions[]`, as objects with the keys `name` and `description` (ledger 4.8), and `agent.surface: "bridge"`. The `description` texts are fixed:

| Element | `name` | `description` |
|---|---|---|
| `rp-product-form` | `setQuantity` | `Set how many to add` |
| `rp-product-form` | `add` | `Add the selected variant to the cart` |
| `rp-cart` | `setQuantity` | `Set the quantity of one cart line` |
| `rp-cart` | `remove` | `Remove one line from the cart` |
| `rp-live` | `submit` | `Apply the form and update the results` |
| `rp-predictive-search` | `setQuery` | `Type a search query and show suggestions` |
| `rp-predictive-search` | `clear` | `Clear the search query` |

No V1 action has a `confirm` key. Components by element: `rp-product-form`: ProductForm. `rp-cart`: CartLink, CartLines, CartSummary, CartNote, DiscountCode, and CartDrawer (through the `rp-cart` roots it contains). `rp-live`: VariantPicker, Filters, FilterChips, SortSelect, LiveForm. `rp-predictive-search`: PredictiveSearch. `rp-recommendations`: ProductRecommendations (`agent.actions: []`).

Rules:

- **A-2** An action MUST go through the same DOM event or form submission as the user's control, never a second implementation. Consequence: pending state, announcements, errors and region refresh behave identically.
- **A-3** When the root does not contain the markup an action needs (for example `setQuantity` on the `rp-cart` root of a CartLink, or `submit` on an `rp-live` root that has only links), the method throws `new Error("<tag>: nothing to <action> here")`. The bridge reports thrown messages to the agent.
- **A-4** `line` is the value of `data-rp-line`. Agents read line ids from the snapshot `items` of the `rp-cart` entry: the primitive declares `items: (api) => api.lines()` where `api.lines()` returns `Array<{ value: string; label: string }>` built at call time from `[data-rp-line]` elements in the root (`value` = the attribute; `label` = the text content of the line's first link or heading, whitespace collapsed). `lines` is a getter and is not listed in `agent.actions`.
- **A-5** No action may add a discount code, edit the note, change the locale or start checkout in V1; agents use the visible forms and links through `press` and the accessibility tree.
- **A-6** Every public method that changes state is listed in `agent.actions`; getters are not (`04-elements.md` 12.2 rule 1).

### 7.3 Confirmation

On the default path confirmation rests on ONE mechanism: the attribute `data-agent-confirm` on the control (D-050). No bridge action starts checkout.

1. The controls that MUST carry `data-agent-confirm` in V1 are exactly: the CheckoutButton control (both backends; REQUIRED, D-095), and the accelerated-checkout wrappers Ripple prints (`div.rp-product-form-accelerated`, `div.rp-cart-summary-accelerated`; the platform markup inside is opaque, D-004, so the attribute goes on Ripple's wrapper element around it). Manifest `agent.confirm[]` of CheckoutButton, ProductForm and CartSummary lists them. RP320 reports a CheckoutButton without the attribute; whether RP320 also checks the two wrappers is decided by the `agent.confirm[]` entries (`07-manifest-registry-cli.md` section 9.6).
2. Default sentences (locale keys, D-066): `ripple.checkout-button.agent_confirm` = `Goes to checkout with this cart`; `ripple.product-form.agent_confirm_accelerated` = `Buys this product now with an express checkout`; `ripple.cart-summary.agent_confirm_accelerated` = `Pays for this cart now with an express checkout`.
3. With an empty cart the checkout control is inert (`disabled` on the button; `aria-disabled="true"` and no `href` on the link, D-050) and still carries the attribute.
4. The attribute MUST be on the control itself or on a wrapper that contains ONLY that control. It MUST NOT be on an `rp-cart` or `rp-product-form` root (it would gate quantity changes too; `agent-ready.md`: "It covers the element and everything inside it").
5. An in-page agent created by the storefront MUST pass `allow` and MUST ask the person whenever `step.confirm` is set. Reference implementation (the only one docs and skills show):

   ```js
   const agent = createAgent({
     allow: (step) => (step.confirm ? window.confirm(step.confirm) : true),
   })
   ```

   Storefronts SHOULD replace `window.confirm` with their own UI; the function returns `true`, `false` or a promise of either.
6. Agents that drive the browser from outside (no bridge) are not constrained by the attribute. The `ripple-agent-ready` skill and guide `agent-ready` MUST contain this sentence: "A host agent that operates the page from outside MUST treat any control with `data-agent-confirm` as requiring the person's approval and MUST show them the attribute's sentence."
7. `data-agent-secret` MUST be printed by Ripple on: Input with `type="password"`. `data-agent-hidden` is never printed by Ripple; projects MAY add it.

### 7.4 Enabling the bridge

The bridge is never loaded by default (D-065). The three ways to load it are those of `04-elements.md` 12.2. The complete snippet shown in the guide and skill, per host:

```js
// bundled app (react)
import { createAgent, registerTools } from "<pkg>/agent"

// html, remix (the URL is paths.public + "/ripple.js"; default /ripple/ripple.js)
const { createAgent, registerTools } = await (await import("/ripple/ripple.js")).loadAgent()

// liquid (the import map resolves the specifier to assets/ripple-agent.js)
const { createAgent, registerTools } = await import("ripple/agent")

// all hosts, after the import
const agent = createAgent({ allow: (step) => (step.confirm ? window.confirm(step.confirm) : true) })
const unregister = registerTools(agent, { allow: () => true })   // WebMCP; a no-op without document.modelContext
```

`registerTools` "does nothing in a browser without `document.modelContext`" (`uisdk/packages/core/skills/ui-sdk/references/agent-ready.md`). The second `allow` returns `true` because the bridge's own `allow` already asks.

### 7.5 Labels

Decision (D-095; `04-elements.md` section 12.2):

- A snapshot entry's `label` comes from the root's own accessible name. `rp-dialog`, `rp-quantity` and `rp-navigation-menu` roots get NO label and no contract change is made for them. They, and the commerce roots, appear with `component: "<tag>"`; `rp-carousel` has a label because its contract has `aria-label`.
- An agent addresses an unlabeled entry by `ref`, which the snapshot always provides.
- Giving commerce roots `role="group"` and a required `ariaLabel` was considered and is NOT applied in V1.
- RP607 applies only to roots whose manifest `agent.actions` is non-empty. It reports two things: such a root is missing from the snapshot; or two or more such roots on one page have the same `component`, no label, and identical `items` and `buttons` lists, so an agent cannot tell them apart (for example two unlabeled `rp-product-form` roots). It never reports `rp-dialog`, `rp-quantity` or `rp-navigation-menu` for a missing label. Fix text: add `ariaLabel` (Liquid `aria_label`) to each such component; where the root accepts rest props, `aria-label` needs no contract change.

### 7.6 The agent test

One test per element with a non-empty `agent.actions`, in the element's own test file (`src/elements/<tag>.test.ts`, `src/commerce/<tag>.test.ts`), run in Chromium with the bridge loaded:

1. Mount the component's `default` fixture.
2. `const entry = createAgent().snapshot().find((e) => e.component === "<tag>")`: it exists.
3. `entry.actions` contains every `name` the manifest lists in `agent.actions[]` (it MAY also contain `press`).
4. For each action, `act({ steps: [{ ref: entry.ref, action, args }] })` resolves with `ok: true` and the documented state change is observed (for `rp-product-form` `add`: the adapter's `submitCart` was called once).
5. For CartSummary and CartDrawer fixtures: `act` with `{ action: "press", args: ["<checkout control name>"] }` and no `allow` resolves with `ok: false` and `error.message` starting with `Needs a person:`; the page did not navigate.

The manifest build additionally asserts, for every commerce component, that the `name` values of manifest `agent.actions[]` equal the primitive's declared list (read by importing the primitive in the test).

### 7.7 SPIKE-08 `agent-bridge-confirm`

Question (ledger section 3): does the bridge refuse, without approval, an action declared in an `rp-*` primitive's `agent` key, and does it honour `data-agent-confirm` on a native control inside an `rp-*` root?

Default path (specified in full above; implement this):

1. `data-agent-confirm` on the checkout control ONLY (7.3). `rp-cart` declares no `checkout` action and has no `checkout()` method. Manifest `agent.actions[]` of every `rp-cart` component is the 7.2 list.
2. Agents reach checkout by `press` on the control. That path is already verified to be refused without approval (7.6 step 5; `ripple/docs/research/spikes/elements-runtime/results-agent-confirm.txt`).
3. The `ripple-agent-ready` skill and guide `agent-ready` contain the sentence of 7.3 item 6.

The spike is a test that is written now and does not change shipped code: `src/commerce/rp-cart.agent-confirm.test.ts`. It defines a test-only variant of the `rp-cart` primitive that adds the method `checkout(): void` (implementation: `click()` on the root's checkout control, `button[name="checkout"]` or `a.rp-checkout-button`) and lists `"checkout"` in `agent.actions`. It mounts the CartSummary `two-lines` fixture and asserts:

- (a) `act({ steps: [{ ref, action: "checkout" }] })` with no `allow`: resolves `ok: false`, `error.message` starts with `Needs a person:`, and no navigation or form submission happened.
- (b) with `allow: () => false`: `ok: false`, and the message starts with `The person said no to`.
- (c) with `allow: () => true`: the checkout control was activated exactly once.

Addition when the spike passes (this is an addition, not a fallback: the default path is already the conservative one). When (a), (b) and (c) all pass in CI:

1. Move `checkout(): void` from the test-only variant into `src/commerce/rp-cart.ts` and add `"checkout"` to the primitive's `agent.actions`.
2. Add to the manifest `agent.actions[]` of CartSummary and CartDrawer (the components whose root contains a checkout control) the entry `{ "name": "checkout", "description": "Go to checkout with this cart", "confirm": "Goes to checkout with this cart" }`. The `confirm` sentence equals the control's `data-agent-confirm` default.
3. On an `rp-cart` root with no checkout control the method throws per A-3.
4. Add the row to the 7.2 tables, to `05-commerce.md` and to `11-components-commerce.md`; keep the test as a permanent regression test; write the result to `docs/research/spikes/agent-bridge-confirm/README.md`; update the ledger line for SPIKE-08 and non-goal 19 of ledger section 11.

When any of (a), (b), (c) fails, nothing changes: the test-only variant stays in the test file, case (a) is marked as an expected failure with the observed message, and the result is written to the same README.

Rule A-7: `"checkout"` MUST NOT appear in a published `agent.actions` (primitive or manifest) unless test (a) passes in CI. An unconfirmed method that spends money is the one failure this section exists to prevent.

### Fallback (SPIKE-08)

None. The default path of 7.7 is the conservative path (ledger section 3: "Not a fallback but an addition"); a failed spike leaves it unchanged.

### 7.8 Acceptance (agent surface)

| Id | Test | Pass condition |
|---|---|---|
| K-50 | Agent test 7.6 for `rp-product-form`, `rp-cart`, `rp-live`, `rp-predictive-search`. | Steps 1 to 4 pass. |
| K-51 | 7.6 step 5 on the `cart` blueprint page (html host). | Refused without `allow`; no navigation. |
| K-52 | `snapshot()` on the `product` blueprint page. | No entry for `rp-recommendations`; one entry for `rp-product-form` with actions including `setQuantity` and `add`. |
| K-53 | Bundle check. | `browser/ripple.js` and `browser/ripple.elements.js` do not contain the string `Needs a person` (the bridge is not in the main bundles). |
| K-54 | RP320 on every blueprint for every host. | Zero findings. |
| K-55 | SPIKE-08 test file. | Exists. Either `checkout` is absent from every published `agent.actions` (primitive and manifest; the default path, whatever the three cases report), or it is present and (a), (b) and (c) all pass. `checkout` present with (a) not passing fails CI. |
| K-56 | For every commerce component, compare manifest `agent.actions[].name` with the 7.2 table. | Equal, in the same order; every entry has a `description` equal to 7.2; no entry has `confirm`. |

---

## 8. Eval suite

The eval suite measures whether coding agents build correct, good-looking storefronts with Ripple, and it decides API questions with data (D-061). Nothing in this section has been run; it reuses the shape of Hydrogen's harness (`hydrogen/scripts/storefront-benchmark-harness/`), which exists for one harness.

### 8.1 Files

All under `evals/` (ledger 5.1; never published). Harness code is TypeScript with erasable syntax only, run directly by Node 22.18 or later (`node evals/adapters/run.ts`); no build step. `evals/adapters/package.json` is `"private": true` and depends on the built package as `"<pkg>": "file:../../pkg"` and on `playwright` at the root's exact version (`01-architecture.md` section 4 rule 2).

```text
evals/
  tasks/
    T01/ ... T17/
      task.json                 # 8.2
      checks.spec.ts            # deterministic Playwright checks, 8.6
      start/<host>/             # ONLY for tasks whose start state is an overlay (8.5): files copied over the base state
      reference/<host>/         # a human-reviewed passing solution (used for budgets, screenshots and the reference arm)
  adapters/
    package.json  Dockerfile  entrypoint.sh
    run.ts                      # CLI: runs a matrix (8.4)
    workspace.ts                # builds a start state (8.5)
    claude-code.ts  pi.ts  opencode.ts      # HarnessAdapter implementations (8.7)
    serve.ts                    # starts the app (npm hosts) or serveTheme from <pkg>/testing (liquid) for a workspace
    mockshop.ts                 # picks catalogue data from mock.shop for checks
    checks.ts                   # shared check helpers
    score.ts  outside.ts  friction.ts  judge.ts  report.ts  freeze-budgets.ts
    templates/<host>/           # base workspaces: html, react, remix, liquid (8.5)
    canary/SKILL.md             # skill discovery canary (8.4 step 6)
  rubric/
    visual.md                   # the judged criteria with anchors (8.9)
    bar.json                    # thresholds and models (8.12)
    golden/                     # at least 30 human-rated screenshots + ratings.json (8.9)
    api-decisions.md            # the decision log (8.13)
  runs/                         # output, git-ignored: runs/<run id>/<task>-<host>-<arm>-<n>/
```

The root `package.json` has the script `"eval": "node evals/adapters/run.ts"` (D-061, D-103). `pnpm eval` is not part of `pnpm test`.

### 8.2 `task.json`

```ts
interface EvalTask {
  id: string;                               // "T01"
  slug: string;                             // "home"
  set: "core" | "extended";
  hosts: Array<"html" | "react" | "remix" | "liquid">;
  start: { base: "template" | "initialised" | "reference" | "liquid-theme"; after?: string; overlay?: boolean };  // 8.5
  prompt: string;                           // exact text given to the agent; identical for every host
  routes: Record<string, string>;           // name to path, e.g. { "home": "/", "cart": "/cart" }; "{product}" and "{collection}" are filled by mockshop.ts
  screenshots: Array<{ name: string; route: string; steps?: string }>;   // extra states; steps names an exported function in checks.spec.ts
  expectedSkills: string[];                 // skill names from 4.4
  budgets: { turns: number; tokens: number; outside: number; modifiedScaffolded: number | null; frozen: boolean };  // 8.11
  codeDirs: { routes: string[]; data: string[] };   // directories whose JS/TS lines are NOT counted as outside-Ripple (8.10)
  timeoutMs: number;                        // default 2700000 (45 minutes)
  maxCostUsd: number;                       // default 25
}
```

### 8.3 Hosts, data and tiers

- npm hosts (`html`, `react`, `remix`) use `https://mock.shop/api` (Ben decision 10) through Hydrogen.
- mock.shop cannot back a Liquid theme (`ripple/docs/research/hydrogen-core.md` S19). Liquid tasks are scored in two tiers:
  - **local** (every run): Theme Check; `ripple check` layers S and P; the theme is served by `serveTheme` (D-104, D-106), which renders it through the Liquid shim with fixture data and emulates Standard Actions and partial rendering; layer H, layer B and `checks.spec.ts` run against that server. `serve.ts` MUST start a Liquid workspace with exactly this call and MUST NOT implement its own Liquid rendering:

    ```ts
    import { serveTheme } from "<pkg>/testing";

    const server = await serveTheme({ themeRoot: workspaceDir });   // options: ServeThemeOptions, 13-testing.md section 4.5
    // server.url is the base URL for checks; server.resetCart() empties the cart between checks; await server.close() at the end
    ```

    `serveTheme`, its options, the shim, its fixture data and the emulations are specified in `13-testing.md` section 4.5.
  - **live** (nightly, when a preview store exists; ledger Q5): the same checks against the store's preview URL. Until the store exists the live tier is skipped and reported as `skipped`, never as passed.
- A check that cannot run in a tier declares so (`test.skip(tier === "local", "<reason>")`); skipped checks are excluded from the functional fraction and listed in the report.

### 8.4 Running

Command: `pnpm eval -- --tasks <ids|core|all> --hosts <list|all> --adapter <claude-code|pi|opencode> --model <id> --arm <ripple|control|no-skills|pi-package> --runs <n> [--judge] [--out evals/runs/<run id>]`. Defaults: `--tasks core --hosts all --adapter pi --arm ripple --runs 1`. `<run id>` defaults to a UTC timestamp `YYYYMMDD-HHMMSS`.

For each (task, host, arm, run index), `run.ts` performs these steps in order:

1. `pnpm build` once per invocation; `npm pack` in `pkg/` to `evals/runs/<run id>/ripple.tgz`.
2. Build the workspace (8.5) in `evals/runs/<run id>/<task>-<host>-<arm>-<n>/workspace/`. The tarball is copied to `workspace/vendor/ripple.tgz`; npm hosts depend on it as `"<pkg>": "file:./vendor/ripple.tgz"`; Liquid workspaces run the CLI as `npx ./vendor/ripple.tgz`.
3. Initialise git in the workspace and commit the start state (the diff base for 8.10).
4. Start the container (`Dockerfile`: `node:24-bookworm-slim`, `git`, `ripgrep`, `pnpm`, the harness CLI at a pinned version, a non-root user; same layout as `hydrogen/scripts/storefront-benchmark-harness/Dockerfile`). Mount only the workspace. Network egress is limited to: the model endpoint, `registry.npmjs.org`, `mock.shop`. Environment: the model API key and `CI=1`.
5. Run the adapter (8.7) with `task.prompt`. The prompt is passed unchanged; the harness adds no system prompt.
6. Canary: before step 5 in the first run of an invocation only, run the adapter with the prompt `Which skill contains the phrase "ripple canary"? Answer with the skill name only.` in a workspace that contains `adapters/canary/SKILL.md` (name `benchmark-canary`). The answer MUST contain `benchmark-canary`; otherwise the invocation aborts with `skill discovery is not working in <adapter>`. (Method from Hydrogen's harness.)
7. After the agent exits: stop the container; in a fresh container without model access run the project's install; start the app with `serve.ts` (npm hosts: the template's `start` script; Liquid: `serveTheme` from `<pkg>/testing`, 8.3); wait up to 120 seconds for `routes` to answer.
8. Run gates, `checks.spec.ts`, `ripple check --browser --json --url <base>` for every route, build health commands, screenshots (8.9), outside-Ripple (8.10), friction extraction (8.13). Judge when `--judge`.
9. Write `result.json` (8.8) and copy the transcript. Never delete a run directory.

Runs are independent; `run.ts` MAY run up to 4 in parallel (`--parallel <n>`, default 2).

### 8.5 Start states

`workspace.ts` builds one of four base states and then, when the task has `start/<host>/`, copies that directory over it.

| `start.base` | Content |
|---|---|
| `template` | `adapters/templates/<host>/`: a minimal project with the data layer already wired and Ripple NOT installed. `react` and `remix`: Hydrogen storefront client pointed at mock.shop, the cart handlers mounted at `/api/cart`, route files for every path in the table below that return a page with only an `<h1>`, Tailwind v4 compiled by the bundler, Hydrogen's skills synced, an `AGENTS.md` with the project's commands (`install`, `dev`, `build`, `typecheck`, `start`). `html`: an empty directory with a 20-line Node static server and the same cart handlers. `liquid`: the platform skeleton only (`layout/theme.liquid`, empty `templates/*.liquid` for every template name, `config/settings_schema.json`, `locales/en.default.json`, `AGENTS.md` with the platform rules that D-039 keeps). |
| `initialised` | `template` + `ripple init` + `ripple add --blueprint layout` + `ripple skills sync`. On `liquid`, `workspace.ts` first deletes the skeleton `layout/theme.liquid` and passes `--host liquid` to both commands: the `layout` blueprint writes that file, and a collision with a file that has no trailer aborts the command (D-057, D-107 item 5). The resulting layout prints the Header with CartLink, the CartDrawer, the MobileNav, the search Dialog with PredictiveSearch, the AnnouncementBar, the Footer and the toast region (ledger 8.5). Tasks whose prompt asks for one of these start from an overlay that removes it (T03, T05, T12, T16). |
| `reference` | The complete example project `examples/<host>/` (all blueprints installed; for `liquid` the Ripple theme of `14-liquid-theme.md`) + `ripple skills sync`. |
| `liquid-theme` | `examples/liquid/` (same as `reference` for the liquid host; a separate name so that task files read naturally). |

`start.after: "T02"` means: the base state plus `tasks/T02/reference/<host>/` copied over it (the reference solution of the earlier task). Tasks never start from another run's output.

Fixed paths in every npm-host template: `/` (home), `/products/{product}`, `/collections/{collection}`, `/collections`, `/cart`, `/search`, `/pages/{page}`. Liquid uses the platform's paths, which are the same. `mockshop.ts` fills `{product}` with the handle of the first mock.shop product that has at least two variants and `{collection}` with the handle of the first collection that has at least 8 products (one Storefront API query at harness start; results cached in the run directory).

Arms change the start state as follows:

| Arm | Change |
|---|---|
| `ripple` | none |
| `no-skills` | delete `.claude/skills/ripple*` and `.agents/skills/ripple*` (the `AGENTS.md` section and docs remain) |
| `pi-package` | as `no-skills`, and the pi adapter adds `-e npm:./vendor/ripple.tgz` (tests loading skills from the package) |
| `control` | Ripple removed: `template` state for every task, with Tailwind and Hydrogen skills only; for `liquid`, the unmodified base theme `ripple/theme/` copied as the workspace. Checker score, Ripple adherence and outside-Ripple are not computed (scored as 0 and excluded; 8.12). |

### 8.6 Tasks

Seventeen tasks (T18 is dropped, D-061). Prompts are written as a merchant or developer would say them and contain no Ripple vocabulary unless the task is about Ripple itself (T08, T09, T13). The `prompt` in `task.json` MUST be byte-equal to the text below.

Check conventions (helpers in `adapters/checks.ts`): "JS off" means a Playwright context with `javaScriptEnabled: false`. "Settles" means: wait until no element has `data-pending` for 500 ms. Every check has an id `<task>-C<n>` used in reports. Each task also inherits two checks: `<task>-C0` every path in `routes` answers 200; `<task>-CL` the page has exactly one `main` landmark and one `h1`.

Core set: T01, T02, T03, T04, T06, T07, T08, T09, T10, T11. Extended: T05, T12, T13, T14, T15, T16, T17.

**T01 home** (core). Hosts: react, remix, liquid. Start: `template`. Expected skills: `ripple`, `ripple-setup`, `ripple-compose-page`.
Prompt: `Set up the storefront UI and build the home page: a header with the main navigation and a cart link, a large hero with a headline and a button, a grid of featured products from the store, and a footer.`
Checks: C1 `<command form> status --json` exits 0. C2 landmarks `header`, `main`, `footer` exist. C3 at least 4 product cards, each with an image (`alt`, `width`, `height`), a title that links to `/products/<handle>`, and a price. C4 every link inside `header nav` answers 200. C5 a link to `/cart` exists in the header. C6 JS off: C2 to C5 still pass. C7 no horizontal overflow at 375 px.
Screenshots: none extra.

**T02 product page** (core). Hosts: react, remix, liquid. Start: `initialised`. Expected skills: `ripple`, `ripple-commerce`.
Prompt: `Build the product page: image gallery, title, price, option selection, quantity, add to cart, and the product description.`
Checks: C1 each option value is a link or a GET form control; choosing a second value changes the URL. C2 reloading that URL shows the same value selected and the price of that variant. C3 an unavailable value is still selectable (not `disabled`). C4 JS off: submit the add form; then `/cart` lists the product. C5 JS on: click add; the URL path does not change; a cart count in the header becomes 1 after it settles. C6 the root that was submitted had `data-pending` at some time during C5 (observed with a `MutationObserver`). C7 the quantity input is `type="number"` with `min="1"`. C8 gallery images have `alt`, `width`, `height`.
Screenshots: `second-variant` (after C1).

**T03 cart** (core). Hosts: react, remix, liquid. Start: `initialised`, after T02, + overlay `start/<host>/`: the layout file with the CartDrawer removed and the Header called without its `cartDrawer` prop (the cart link navigates to `/cart`). Expected skills: `ripple`, `ripple-commerce`.
Prompt: `Add a cart drawer that opens from the cart link in the header, and a full cart page. Shoppers must be able to change quantities and remove items. Add a discount code field and a checkout button.`
Checks: C1 the header cart opener is `a[href="/cart"]`. C2 JS on, on `/`: clicking it opens a `dialog` (`:modal`) and does not navigate. C3 Escape closes it and focus returns to the opener. C11 the rendered `/cart` page has no cart drawer `dialog`, and every `data-rp-region` value occurs at most once on `/` and on `/cart`. C4 with one line in the cart, click the increment control 5 times within 1 second; after it settles the quantity input shows 6 and reloading `/cart` shows 6. C5 removing the line empties the cart; an empty state is shown. C6 the checkout control has `data-agent-confirm` with at least 3 words. C7 JS off on `/cart`: change the quantity to 2 and submit; the page shows 2. C8 JS off: the remove control removes the line. C9 a discount code field exists on `/cart` (hydrogen backend: inside a POST form with a field named `discountCode`; liquid: present and hidden without JS). C10 after adding from the product page with the drawer open, an element with `role="status"` or `role="alert"` INSIDE the dialog has non-empty text.
Screenshots: `drawer-open`, `cart-page-with-line`, `cart-empty`.

**T04 collection** (core). Hosts: react, remix, liquid. Start: `initialised`. Expected skills: `ripple`, `ripple-discovery`.
Prompt: `Build the collection page with product filters, sorting, chips for the active filters that can be removed, and pagination.`
Checks: C1 every filter control is inside ONE `form[method="get" i]` (or associated to it with the `form` attribute), and the sort control is inside a `form[method="get" i]` (the same form or its own). C2 JS off: check one filter and submit; the URL has a `filter.` param and the product list changed or the result count is shown. C3 reloading the filtered URL renders the control checked. C4 JS on: checking a filter updates the URL without a document navigation (no `load` event) and the results region is replaced. C5 a chip exists for the active filter; with two filters active, clicking one chip keeps the other param. C6 browser Back restores the previous URL and results. C7 choosing a sort option adds `sort_by` to the URL. C8 pagination controls are links with `page` in `href`; JS off: following "next" shows different products.
C9 JS off at 375 px: at least one filter control is visible without any interaction (filters are inline, not inside a `dialog` or a `popover`).
Screenshots: `filtered`, `mobile-filters` (375 px, scrolled to the filters).

**T05 search** (extended). Hosts: react, remix. Start: `initialised` + overlay `start/<host>/`: the layout file with the search Dialog and its PredictiveSearch removed and the Header called without its `searchDialog` prop. Expected skills: `ripple`, `ripple-discovery`.
Prompt: `Add search: a search field in the header that shows suggestions while typing, and a search results page.`
Checks: C1 the search field is inside `form[method="get" i]` whose action is `/search`. C2 JS off: submit `shirt`; the URL is `/search?q=shirt` and results or an empty state are shown. C3 JS on: typing 3 characters shows at least one suggestion link within 2 seconds. C4 ArrowDown moves focus to the first suggestion link; Escape hides the suggestions and returns focus to the field. C5 no element has `role="combobox"` or `role="listbox"`. C6 a live region announces the result count.
Screenshots: `suggestions-open`.

**T06 restyle** (core). Hosts: react, liquid. Start: `reference`. Expected skills: `ripple`, `ripple-theming`.
Prompt: `Restyle the store so it feels premium and dark: a near-black background, a warm gold accent colour, sharper corners, and more generous spacing.`
Checks: C1 `status --json`: zero files of type `css` under `components/` (liquid: zero component regions of `assets/ripple.css`) are `modified`. C2 the computed `background-color` of `body` has OKLCH lightness below 0.25. C3 the computed value of `--rp-radius` is smaller than the default `0.5rem`. C4 the computed value of `--rp-density` is greater than 1, or `--spacing` is greater than `0.25rem`. C5 body text contrast is at least 4.5:1 on home, product and cart. C6 the workspace diff contains no `#rgb`, `#rrggbb`, `rgb(` or `hsl(` literal outside `tokens.css` (liquid: outside `config/settings_data.json`, `config/settings_schema.json` and the token block of `assets/ripple.css`). C7 the primary button's background hue is between 60 and 110 degrees in OKLCH (gold).
Screenshots: none extra.

**T07 new section** (core). Hosts: react, remix, liquid. Start: `reference`. Expected skills: `ripple`, `ripple-compose-page`.
Prompt: `Add an editorial area to the home page: a large image on one side and, on the other side, a heading, a paragraph and two buttons. On phones it should stack with the image first.`
Checks: C1 a new region exists on `/` containing one `img`, one heading, one paragraph and two controls with class `rp-button`. C2 at 375 px the image's top edge is above the heading's top edge and both are at least 80% of the viewport width. C3 at 1024 px the image and the heading overlap vertically (same row). C4 no horizontal overflow at 375 px. C5 the image has `alt`, `width`, `height`. C6 the two buttons have different `data-variant` values.
Screenshots: none extra.

**T08 fix** (core). Hosts: react, liquid. Start: `reference` + overlay `start/<host>/` that seeds exactly these ten violations (one per row, each in a different file where possible):

| # | Seed | Rule |
|---|---|---|
| 1 | Button `variant` `outlined` | RP101 |
| 2 | Stack `gap` `2 md:4 md:6` | RP103 |
| 3 | IconButton without `ariaLabel` | RP201 |
| 4 | A `<div role="dialog">` written by hand | RP115 |
| 5 | VariantPicker placed inside the ProductForm form | RP113 (manifest rule id `variant-picker-outside-form`) |
| 6 | liquid: checkout button without `name="checkout"`; react: checkout link without `data-agent-confirm` | RP306 / RP320 |
| 7 | An inline `style="color:#b00020"` on a Text | RP116 (warning) |
| 8 | A dependency file of ProductCard deleted (`price` binding) | RP501 |
| 9 | A Popover placed inside a product card link | RP204 |
| 10 | A Dialog with no DialogTitle | RP113 (manifest rule id `dialog-needs-title`) |

Expected skills: `ripple`, `ripple-check-and-fix`.
Prompt: `The Ripple checker is failing on this project. Fix everything it reports, including warnings, without changing how the pages look or work.`
Checks: C1 `<command form> check --json --max-warnings 0` exits 0. C2 checks T02-C4, T02-C5, T03-C2, T03-C7 pass. C3 for each task route at 1440 px, Playwright's screenshot comparison (`expect(page).toHaveScreenshot`) against the screenshot of the unseeded `reference` state passes with `maxDiffPixelRatio: 0.015` and `threshold: 0.1`. C4 no installed component was removed (`status --json` lists the same component ids as the start state).

**T09 upgrade** (core). Hosts: react, liquid. Start: `reference` installed from a PREVIOUS package, then edited. The harness builds the previous package `ripple-prev.tgz` by running the normal build in a temporary copy of the repository in which (a) `VERSION` in `src/identity.ts` is replaced by `0.0.9` and (b) the overlay `tasks/T09/prev/` is copied over (older versions of two files: the Button CSS and the Card CSS). The workspace is scaffolded from `ripple-prev.tgz`; `vendor/ripple.tgz` is the current package. Then: the Button CSS edited locally (one added declaration `letter-spacing: 0.02em` in the base rule) and the Card CSS edited on a line that the new version also changes. Expected skills: `ripple`, `ripple-upgrade`.
Prompt: `Upgrade Ripple to the newest version available in vendor/ripple.tgz and keep our local changes to the button styles.`
Checks: C1 `status --json`: every file's version equals the new version. C2 the Button CSS file contains `letter-spacing: 0.02em`. C3 no file contains `<<<<<<< yours`. C4 `check` exits 0. C5 the Card CSS contains the new version's changed line. C6 skills are at the new version (`skills check` exits 0).

**T10 dialog and accordion** (core). Hosts: react, remix, liquid. Start: `initialised`, after T02. Expected skills: `ripple`, `ripple-compose-page` (and the host skill).
Prompt: `On the product page, add a size guide that opens in a pop-up window from a link near the size options, and a list of frequently asked questions under the description where each answer can be expanded.`
Checks: C1 a control opens a `dialog` (`:modal`). C2 the dialog has an accessible name (its `aria-labelledby` target has text). C3 Escape closes it; focus returns to the opener. C4 while open, `checkPattern(dialogElement, "dialog")` from `@ui-sdk/core/testing` does not throw (UNVERIFIED on a native `<dialog>`, D-108: when the task's own reference solution fails C4 in test K-62, C4 is deleted from `checks.spec.ts` and the deletion is recorded in `rubric/api-decisions.md`). C5 JS off: every FAQ answer's text is in the HTML and each item is a `details` element. C6 JS on: clicking a question toggles its `open` state. C7 no element other than a native `<dialog>` has `role="dialog"`, and no `ui-dialog` tag exists.
Screenshots: `size-guide-open`, `faq-one-open`.

**T11 Liquid dialect** (core). Hosts: liquid. Start: `liquid-theme`. Expected skills: `ripple`, `ripple-liquid`, `ripple-commerce`.
Prompt: `Add a "Complete the look" area to the product page that shows recommended products, with a heading the merchant can edit.`
Checks: C1 no file under `blocks/` or `snippets/` contains `{% block`. C2 Theme Check reports zero errors. C3 `check` exits 0. C4 the heading text comes from a block body or a locale key or a setting, not a hard-coded string inside a snippet (the string `Complete the look` appears in `templates/` or `locales/` or a `{% schema %}`, and nowhere under `snippets/`). C5 the template uses the `product-recommendations` block (default path of SPIKE-09) or, on the SPIKE-09 fallback, the `featured-collection` block; it does not slice `collection.products` by hand. C6 local tier: the rendered product page contains the heading and a region `rp-product-recommendations`.
Screenshots: `recommendations`.

**T12 Liquid cart** (extended). Hosts: liquid. Start: `liquid-theme` with the cart template emptied and the CartDrawer removed from the layout (overlay). Expected skills: `ripple`, `ripple-liquid`, `ripple-commerce`.
Prompt: `Build the cart page and a cart drawer that opens from the header cart link.`
Checks: C1 the cart form has `updates[]` inputs, a submitter `name="update"`, a submitter `name="checkout"`, and remove links. C2 on the rendered cart page, exactly one element has `data-rp-region="rp-cart-lines"` and exactly one has `data-rp-region="rp-cart-summary"`; on the rendered home page each occurs at most once; in the source, every `{% partial 'rp-cart-lines' %}` and `{% partial 'rp-cart-summary' %}` is in a file under `templates/` or `layout/` (RP403 clean). The layout omits the cart drawer on the cart page. C3 no `<dialog>` is inside a `{% partial %}` that its own content refreshes (RP404 clean). C4 the theme contains no `updateCart.configure` (RP307 clean). C5 on the rendered home page the header cart opener is `a[href]` with a `data-rp-open` attribute whose value is the id of a `dialog` on the page; no source file under `templates/` or `layout/` contains the text `data-rp-open` (the `dialog` or `drawer` param prints it). C6 local tier, JS on with the Standard Actions emulation: changing a quantity sends one `updateCart` call with the absolute quantity.
Screenshots: `drawer-open`.

**T13 plain HTML** (extended). Hosts: html. Start: `template`. Expected skills: `ripple`, `ripple-setup`.
Prompt: `Make a single landing page for one product from the store using Ripple, with no build step: product images, title, price, an add to cart button and a link to the cart.`
Checks: C1 the page loads exactly one stylesheet whose URL ends with `ripple.css` and one module script whose URL ends with `ripple.js`; the only other `script` elements are the Hydrogen script tags and the config element `script#rp-commerce`, both of which MUST be present before the `ripple.js` script (D-088, D-087). C2 the project has no bundler configuration and no `build` script. C3 `check --browser` on the page reports no errors. C4 JS off: the add form posts to `/api/cart` with a `merchandiseId` field and the response is a redirect. C5 a link to `/cart` exists.

**T14 markets** (extended). Hosts: react. Start: `reference`. Expected skills: `ripple`, `ripple-compose-page`.
Prompt: `Add a country and language selector to the header, and make prices follow the selected country's currency.`
Checks: C1 the selector is a form or a list of links; JS off: choosing another country changes the URL or sets a cookie and reloads. C2 after choosing a country with another currency, a product price's currency symbol or code differs from before. C3 the workspace diff contains no client-side money formatting (no `Intl.NumberFormat` and no `toFixed(` in files outside `codeDirs.data`). C4 the selector's control has an accessible name.

**T15 escape hatch** (extended). Hosts: react, liquid. Start: `reference`. Expected skills: `ripple`, `ripple-new-component`.
Prompt: `Add a size chart table to the product page with a header row that stays visible while scrolling and alternating row colours.`
Checks: C1 a `table` with `thead` and at least 4 body rows exists. C2 the header cells compute `position: sticky`. C3 odd and even body rows compute different background colours. C4 the diff contains no colour literal (as T06-C6) and no physical property (`margin-left`, `margin-right`, `padding-left`, `padding-right`, `left:`, `right:`, `text-align: left`, `text-align: right`). C5 no widget role added. C6 new class names do not start with `rp-`. C7 `check` has no errors (warnings allowed).

**T16 chrome** (extended). Hosts: react, liquid. Start: `initialised` + overlay `start/<host>/`: the layout file with the AnnouncementBar removed and the Footer called with a body that contains only its LinkList (id `footer-menu`), so that no NewsletterForm is printed. Expected skills: `ripple`, `ripple-compose-page`.
Prompt: `Add an announcement bar at the top of every page, a newsletter signup in the footer, and payment icons in the footer.`
Checks: C1 an announcement region exists before the header on two different routes. C2 the newsletter field is `input[type="email"]` with a label, inside a POST form. C3 JS off: submitting a valid address returns a page that shows a success message; submitting an empty field is blocked by `required`. C4 payment icons are present, each with a text alternative, or the list has an accessible name.

**T17 agent ready** (extended). Hosts: react. Start: `initialised`, after T03. Expected skills: `ripple`, `ripple-agent-ready`.
Prompt: `Make the storefront usable by in-page AI agents: they should be able to add products to the cart and change the cart, but must never go to checkout without the shopper's approval.`
Checks: C1 the bridge is loaded (a `createAgent` call exists in the client code) and `window` exposes nothing extra (the check obtains the agent by calling `createAgent()` itself from `<pkg>/agent`). C2 `snapshot()` on the product page has an `rp-product-form` entry with `add`. C3 `act` with `add` succeeds and the cart count becomes 1. C4 on `/cart`, pressing the checkout control through `act` with no `allow` returns `ok: false` and the URL is unchanged. C5 the app's own `createAgent` call passes an `allow` option (source scan). C6 `check --browser` reports no RP607 and no RP320.

### 8.7 Harness adapters

```ts
export interface HarnessAdapter {
  name: "claude-code" | "pi" | "opencode";
  run(input: {
    cwd: string; prompt: string; model: string; timeoutMs: number; maxCostUsd: number;
    env: Record<string, string>; extraArgs: string[];
  }): Promise<RunResult>;
}
export interface RunResult {
  exitCode: number; timedOut: boolean; wallMs: number;
  turns: number; toolCalls: number;
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };  // total = sum of the four
  costUsd: number | null;
  skillsRead: string[];          // skill names whose SKILL.md path appears in a file-read tool call
  commands: string[];            // every shell command the agent ran, in order
  toolOutputs: string[];         // every tool result text, in order (input to friction.ts)
  transcriptPath: string;        // the raw event stream, saved unmodified
}
```

| Adapter | Command (inside the container, cwd = workspace) | Parsing |
|---|---|---|
| `claude-code` | `claude -p "<prompt>" --output-format stream-json --verbose --permission-mode bypassPermissions --model <id> --max-budget-usd <maxCostUsd>` | One JSON object per line. `turns` = number of assistant messages. Tokens and cost from the final `result` record; its field names (`num_turns`, `usage`, `total_cost_usd`, `duration_ms`) are UNVERIFIED and MUST be read defensively (missing field gives 0 or `null`, never a crash). Flags verified against `claude --help` 2.1.330 (`ripple/docs/research/agent-kit-and-distribution.md` 2.7); there is no turn limit flag, so the limits are cost and wall time. Skills are read from `.claude/skills`. Before the run, when the workspace has `AGENTS.md` and no `CLAUDE.md`, the adapter writes a `CLAUDE.md` containing the single line `@AGENTS.md` (whether Claude Code reads `AGENTS.md` directly is UNVERIFIED). |
| `pi` | `pi --mode json --no-session --model <provider/id> "<prompt>"` | JSONL split strictly on `\n` (not Node `readline`). `turns` = number of `turn_end` records. Tokens = sum over assistant `message_end` records of their final `usage` (`input`, `output`, `cacheRead`, `cacheWrite`); cost = sum of `usage.cost.total`. The run is finished at `agent_settled`. Skills are read from `.agents/skills`; `AGENTS.md` is read natively. Record names are from the pi 1.6.0 documentation (same research section); the adapter's unit test uses a recorded stream. |
| `opencode` | `opencode run --pure --format json --thinking --dangerously-skip-permissions "<prompt>"` with the model from env `OPENCODE_MODEL` | As `hydrogen/scripts/storefront-benchmark-harness/opencode-runner.ts`, which is the reference implementation to port. |

Rules:

- **E-1** An adapter never edits the workspace except the `CLAUDE.md` line above.
- **E-2** A timeout kills the process group, sets `timedOut: true`, and the run is still scored on the workspace as left.
- **E-3** The `pi` adapter with the agent model of `rubric/bar.json` is the stand-in for Sidekick. How closely it matches Sidekick's real configuration (system prompt, tools, skill loading, the Canvas file API) is UNVERIFIED and is the largest threat to the validity of the bar; the report prints this sentence in its header.
- **E-4** Each adapter has a unit test that parses a committed sample transcript (`adapters/__fixtures__/<adapter>.jsonl`) into the expected `RunResult`.

### 8.8 Scoring

Gates. A failed gate scores the run 0 and records the gate name:

| Gate | Condition |
|---|---|
| `renders` | every path in `routes` answers 200 and has a non-empty `body` |
| `no-page-error` | no uncaught page error on any task route with JavaScript on |
| `stayed-in-workspace` | no file outside the workspace was created or changed (the container mounts nothing else; the gate checks the adapter's `commands` for writes to absolute paths outside cwd and fails on any) |
| `no-secret` | no file served to the browser contains the model API key, a string matching `shpat_[a-f0-9]{32}`, or a private Storefront token |

Score components (total 100; D-061 weights 35 / 15 / 20 / 10 / 10 / 10):

| Component | Weight | Measure |
|---|---|---|
| Functional | 35 | `35 x passed / applicable` over the task's deterministic checks, including the inherited ones and the no-JS ones |
| Checker | 15 | From `ripple check --browser --json` plus the deterministic visual checks of 8.9: `max(0, 15 - 3 x errors - min(3, 0.5 x warnings))` |
| Visual | 20 | `20 x (mean of the nine criterion medians) / 4` (8.9). Without `--judge` the component is `null` and the total is scaled to the remaining 80 points (`total = 100 x sum / 80`) and marked `unjudged`; unjudged runs never count toward the bar |
| Ripple adherence | 10 | `10` when `outside <= budget`; `0` when `outside >= 3 x budget`; linear between. When `budgets.modifiedScaffolded` is a number and the count exceeds it, the component is 0 |
| Build health | 10 | `10` when all of these exit 0, else `0`: npm hosts: the template's `typecheck` and `build` scripts; liquid: Theme Check with zero errors |
| Efficiency | 10 | `5 x f(turns, budget.turns) + 5 x f(tokens.total, budget.tokens)` where `f(x, b) = 1` for `x <= b`, `0` for `x >= 2b`, linear between |

A run **passes** when: all gates pass; total is at least 80; the functional fraction is at least 0.9; and the checker reports zero errors.

`result.json` (one per run):

```json
{
  "task": "T02", "host": "react", "arm": "ripple", "adapter": "pi", "model": "<id>", "run": 1,
  "package": "<pkg>@<version>", "gates": { "renders": true, "no-page-error": true, "stayed-in-workspace": true, "no-secret": true },
  "functional": { "passed": 8, "applicable": 9, "skipped": ["T02-C6"], "failed": ["T02-C3"] },
  "checker": { "errors": 0, "warnings": 1, "rules": { "RP116": 1 } },
  "visual": { "criteria": { "layout": 3, "spacing": 3, "type": 3, "colour": 4, "consistency": 4, "responsive": 3, "imagery": 3, "states": 3, "fit": 4 }, "capped": [] },
  "outside": { "cssLines": 0, "jsLines": 12, "rawInteractive": 0, "arbitraryValues": 1, "modifiedScaffolded": 0, "total": 14 },
  "build": { "typecheck": true, "build": true, "themeCheck": null },
  "efficiency": { "turns": 41, "tokens": 2100000, "wallMs": 612000, "costUsd": 7.4 },
  "scores": { "functional": 31.1, "checker": 14.5, "visual": 16.7, "adherence": 10, "build": 10, "efficiency": 10, "total": 92.3 },
  "passed": false,
  "secondary": { "skillsRead": ["ripple", "ripple-commerce"], "skillsExpected": ["ripple", "ripple-commerce"], "checkInvocations": 3, "checksUntilClean": 3, "docsInvocations": 2 },
  "friction": { "firstCheck": ["RP101"], "ruleHits": { "RP101": 2 }, "guessed": [{ "rule": "RP101", "component": "button", "prop": "variant", "found": "outlined" }] }
}
```

(The example is not a pass because the functional fraction 8/9 is below 0.9.)

### 8.9 Visual rubric and judging

Screenshots are taken by the harness, never by the agent: Playwright Chromium, `reducedMotion: "reduce"`, animations disabled, after `document.fonts.ready`, full page.

- Each path in `routes` at 375x812, 768x1024 and 1440x900.
- Each entry of `task.screenshots` at 1440x900 and 375x812.
- Each path in `routes` at 1440x900 with JavaScript disabled.

Deterministic visual checks (counted as checker errors, one per occurrence type per route): RP608 overflow; RP602 layout shift; an image whose rendered aspect ratio differs from its intrinsic ratio by more than 2% while `object-fit` is not `cover` or `contain`; text clipped (`scrollHeight > clientHeight + 1` on an element with `overflow: hidden` that contains text and has no `line-clamp`). RP609 contrast counts as a warning.

Judged criteria, each scored 0 to 4. `rubric/visual.md` MUST contain this table and, for each criterion, one paragraph per score level:

| Key | Criterion | 0 | 2 | 4 |
|---|---|---|---|---|
| `layout` | Layout integrity | overlapping or cut-off content | aligned, minor inconsistencies | everything on a clear grid, nothing cut off |
| `spacing` | Spacing rhythm | cramped or random gaps | mostly consistent steps | consistent steps, clear grouping |
| `type` | Typographic hierarchy | no visible hierarchy | hierarchy present, some awkward sizes or line lengths | one clear order, comfortable line lengths |
| `colour` | Colour and contrast | unreadable or clashing | readable, accents overused or absent | consistent palette, accents used sparingly |
| `consistency` | Component consistency | the same control looks different in places | small differences | the same control looks the same everywhere |
| `responsive` | Responsive adaptation | broken at one width | works, looks squeezed at one width | each width looks designed |
| `imagery` | Imagery | stretched or missing media | correct ratios, weak crops | correct ratios, sensible crops |
| `states` | State quality | overlays, errors or empty states broken | usable but unfinished | open overlays, errors and empty states look finished |
| `fit` | Task fit | the requested content is missing | present, arranged oddly | everything asked for, arranged sensibly for a store |

Scores 1 and 3 are the midpoints ("poor", "good"). Score 4 means "indistinguishable in quality from the reference blueprint".

Procedure (`judge.ts`):

1. The judge model is the `judgeModel` of `rubric/bar.json`, temperature 0. Input: `rubric/visual.md`, the task prompt, and the screenshots. It never receives code, the arm name or the adapter name. Output: JSON `{ "<key>": { "score": 0-4, "evidence": "<what was seen>" } }` for the nine keys; invalid JSON is retried at most twice, then the judgement is discarded.
2. Pairwise cap: for each criterion the judge is also shown the reference solution's screenshot for the same route and viewport (order randomised, labelled A and B) and asked "Is B at least as good as A on <criterion>? Answer yes or no." When the run's image is judged worse, that criterion's score is capped at 2 and its key is added to `visual.capped`.
3. Three independent judgements per run; each criterion's score is the median.
4. Calibration: `rubric/golden/` holds at least 30 screenshots with human ratings (`ratings.json`: `{ file, criteria: { <key>: 0-4 } }`). A judge configuration is accepted only when, against the human ratings, Spearman correlation is at least 0.7 and mean absolute error is at most 0.75 (`pnpm eval -- --calibrate`). Calibration MUST be re-run when `judgeModel` or `visual.md` changes; `bar.json` records the date and the two numbers. Until a calibration passes, visual scores are reported with the label `uncalibrated` and the bar cannot be declared met.
5. Ben signs off the default look (ledger Q14) by rating the golden set's reference-blueprint screenshots; the reference blueprints MUST have a human median of at least 3 on every criterion before they are used as the pairwise anchor.

### 8.10 Outside-Ripple measure

Computed by `outside.ts` from the git diff between the start commit and the end state, over files the agent created or changed:

| Term | Definition |
|---|---|
| `cssLines` | Added non-blank, non-comment CSS lines outside `tokens.css` and outside Ripple marker regions; on Liquid also excluding the token block of `assets/ripple.css` |
| `jsLines` | Added non-blank, non-comment JavaScript or TypeScript lines that are not in a file with an unmodified trailer, not under `codeDirs.routes` or `codeDirs.data`, and not JSX or TSX lines that only compose components (a line is "composition" when, after trimming, it starts with `<`, `</`, `/>`, `)`, `}` or is an `import` of a Ripple binding) |
| `rawInteractive` | In the rendered HTML of the task routes: count of `button`, `input`, `select`, `textarea`, `dialog`, `details` elements and elements with a widget `role` that are neither a Ripple root or part (an `rp-` class) nor inside a Ripple root |
| `arbitraryValues` | Added Tailwind arbitrary-value classes (a class token containing `[` and `]`) |
| `modifiedScaffolded` | Count of files that `status --json` reports as `modified` and that were not modified in the start state |

`outside = cssLines + jsLines + 5 x rawInteractive + 2 x arbitraryValues + 10 x modifiedScaffolded`.

### 8.11 Budgets

Budgets are per task (not per host). Provisional values below are used until the first baseline; `freeze-budgets.ts` then replaces them with the median of 10 passing runs of the reference configuration (pi adapter, agent model of `bar.json`, arm `ripple`), multiplied by 1.25 and rounded up (turns to an integer, tokens to 100,000, outside to an integer), writes them to each `task.json`, and sets `budgets.frozen: true`. Frozen budgets change only by a recorded decision (8.13).

| Task | Turns | Tokens (total) | Outside | `modifiedScaffolded` |
|---|---|---|---|---|
| T01 | 80 | 6,000,000 | 40 | null |
| T02 | 80 | 6,000,000 | 30 | null |
| T03 | 80 | 6,000,000 | 30 | null |
| T04 | 80 | 6,000,000 | 30 | null |
| T05 | 60 | 5,000,000 | 30 | null |
| T06 | 40 | 3,000,000 | 20 | 0 |
| T07 | 40 | 3,000,000 | 20 | null |
| T08 | 50 | 4,000,000 | 10 | null |
| T09 | 40 | 3,000,000 | 10 | null (merged files are expected to be modified) |
| T10 | 50 | 4,000,000 | 15 | null |
| T11 | 50 | 4,000,000 | 20 | null |
| T12 | 80 | 6,000,000 | 30 | null |
| T13 | 50 | 4,000,000 | 20 | null |
| T14 | 60 | 5,000,000 | 30 | null |
| T15 | 40 | 3,000,000 | 120 | null |
| T16 | 40 | 3,000,000 | 15 | null |
| T17 | 50 | 4,000,000 | 30 | null |

### 8.12 The Sidekick bar

`rubric/bar.json` (exact keys; model ids are configuration, not specification):

```json
{
  "agentModel": "anthropic/claude-opus-4-6",
  "weakModel": null,
  "judgeModel": null,
  "adapter": "pi",
  "runsPerCell": 5,
  "passRate": 0.9,
  "minCellPassRate": 0.7,
  "visualMedian": 3.0,
  "visualCriterionMedian": 2.5,
  "cleanWithinChecks": 3,
  "cleanWithinChecksRate": 0.8,
  "controlVisualMargin": 0.5,
  "weakPassRate": 0.75,
  "releaseMaxDrop": 0.05,
  "calibration": { "date": null, "spearman": null, "mae": null }
}
```

`agentModel` defaults to the model Hydrogen's harness uses (`hydrogen/scripts/storefront-benchmark-harness/opencode-runner.ts`, `DEFAULT_MODEL`); it MUST be replaced by the model Sidekick uses when Ben names it. `weakModel` (a Sonnet-class model) and `judgeModel` (an Opus-class model, pinned) MUST be set before the first bar run; `run.ts` exits with code 2 and `bar.json: <key> is not set` when a needed key is `null`.

A **cell** is one (task, host) pair of the core set: T01, T02, T03, T04, T07, T10 on react, remix, liquid (18 cells); T06, T08, T09 on react, liquid (6 cells); T11 on liquid (1 cell): 25 cells, 125 judged runs at 5 runs per cell.

The bar is met when ALL of these hold on one invocation (`pnpm eval -- --bar`):

| # | Condition |
|---|---|
| B-1 | Pass rate over all 125 runs is at least 90% (at least 113 passes). |
| B-2 | Every cell has at least 4 passes of 5 (3 of 5 is 60%, below `minCellPassRate` 0.7). |
| B-3 | Median visual score (mean of the nine criteria per run, median over runs) is at least 3.0; no criterion's median over runs is below 2.5. |
| B-4 | In at least 80% of runs the agent's first clean `check` came within its first 3 `check` invocations (`secondary.checksUntilClean <= 3`). A run in which the agent never ran `check` counts as not meeting this. |
| B-5 | For T01 to T04 the median `outside.total` is within budget on every host; for T06 every run has `modifiedScaffolded` 0. |
| B-6 | Control arm (same cells that exist without Ripple: T01, T02, T03, T04, T07, T10; 5 runs each; checker and adherence components excluded and the total scaled to the remaining 75 points): the `ripple` arm has a higher pass rate, a median visual score at least 0.5 higher, and a median `tokens.total` not higher. |
| B-7 | Weak-model arm (`weakModel`, arm `ripple`, all 25 cells, 3 runs each): pass rate at least 75%. |
| B-8 | Liquid live tier: T11 and T12 pass 4 of 5 on the preview store. Until a preview store exists (ledger Q5) B-8 is reported `blocked` and the Liquid host MUST NOT be described as ready. |

Control-arm scoring: checks tagged `rippleOnly` in `checks.spec.ts` (those that read `status`, an `rp-` class, a `data-rp-*` or `data-agent-*` attribute: T01-C1, T03-C6, T03-C9, T07-C1, T07-C6) are skipped. A control run passes when the gates pass, the scaled total is at least 80 and the functional fraction is at least 0.9.

### 8.13 How eval results gate API decisions

The API (component names, prop names, enumerated values, the responsive grammar, skill text, `AGENTS.md` text, checker `fix` text, the synonym table) is changed by evidence from runs, under these rules. The names in ledger sections 6 and 8 are final; a rule below that leads to renaming one of them produces a proposal for Ben and a ledger change, never a silent rename.

**Friction data.** `friction.ts` extracts from each run's `toolOutputs`:

- every checker diagnostic the agent saw: lines matching `/^(RP\d{3}|TC:\w+) (error|warning)  /m` with the following `found:` line (text format: `07-manifest-registry-cli.md` section 9.4.1); and every `--json` output that parses as a `Report` (section 9.3 there);
- `firstCheck`: rule ids of the first `check` invocation;
- `guessed`: for RP101, RP102, RP104, RP105, RP111, RP115 diagnostics, the tuple (rule, component, prop, found);
- from `commands`: the number of `check` and `docs` invocations.

`report.ts` aggregates per cell and across the invocation and prints, besides scores: the 20 most frequent `guessed` tuples with their run share; rule hit rates; skills read versus `expectedSkills`; the share of runs that never ran `check`.

**Decision rules.**

| Rule | Trigger (computed over one invocation with at least 10 runs per cell) | Required action |
|---|---|---|
| G-1 Guessed name | The same `guessed` tuple appears in at least 30% of the runs of a cell, or in at least 15% of all runs | Open a decision. Options are tried in this fixed order, each as an A/B (below): (1) change documentation text (`{% doc %}` description, component summary, skill, `AGENTS.md` line); (2) add the found value to `FIX_SYNONYMS` so the first `check` gives the exact replacement; (3) propose renaming the API to the guessed name. Aliases (two accepted spellings for one meaning) MUST NOT be added. |
| G-2 Missing capability | For a core task, median `outside.total` exceeds the budget in two consecutive invocations, or at least 30% of runs hand-write the same kind of markup (same `rawInteractive` element or same widget role) | Open a decision: add a prop, a component, or a blueprint variation. The proposal names the manifest change. |
| G-3 Unused component | A component used by a task's reference solution is used by fewer than 50% of passing runs of that task | Open a decision: fix discoverability first (summary, `useWhen`, index, skill routing). Only if an A/B shows no gain: propose merging or cutting the component. |
| G-4 Skill routing | For a task, fewer than 60% of runs read every skill in `expectedSkills`, AND the pass rate of the runs that did not is at least 10 points lower | Change the skill `description` (trigger sentence) or the routing table 4.4; verify by A/B. When the pass rate is NOT lower, the skill is not needed for that task: remove it from `expectedSkills`. |
| G-5 Rule noise | A checker rule fires in at least 20% of runs and at least half of those runs end with the rule still firing or with the component replaced by raw markup | Open a decision on the rule: improve `fix` text first; then consider changing the API so the mistake cannot be written. Severity is never lowered to make a bar pass. |
| G-6 Skills value | Arm `no-skills` pass rate is within 5 points of arm `ripple` on the core set | Record it. Do not delete skills; prefer moving any content that explains the gap into `AGENTS.md` and docs (K-1). |
| G-7 Regression | Any change to a manifest entry's `props`, `parts`, `summary`, `useWhen`, to a skill, to `UNIVERSAL_RULES`, to the `AGENTS.md` host rules, or to rule text | MUST pass the change gate below before merge. |

**A/B protocol.** Arms A (current) and B (proposed) are built as two tarballs. Run the affected cells (the cells where the trigger fired, plus T01 and T02 on react and liquid as sentinels), 10 runs per cell per arm, same adapter and model. B is **adopted** when all hold: B's pass rate is not lower than A's; and at least one of: (a) the triggering metric improves by at least half (guessed-tuple share, outside median, or rule hit rate), (b) median turns drop by at least 10%, (c) pass rate rises by at least 10 points. Otherwise B is rejected and the next option in the rule's order is tried. Three rejected options close the decision as "accepted friction", recorded with the data.

**Change gate (G-7).** Core set, arm `ripple`, 5 runs per cell: pass rate MUST NOT drop by more than 5 points against the last recorded baseline, and no cell may fall below 4 of 5. A change that only touches one host runs only that host's cells. Documentation-only changes to files that agents do not read (guides not linked from a skill) are exempt.

**Status promotion.** A component's manifest `status` moves from `beta` to `stable` only when: it is exercised by at least one task's reference solution; every cell of those tasks meets B-2 in the latest bar run; and no open decision names it. After `stable`, renaming a prop or value requires a major version.

**Decision log.** Every decision is one entry appended to `evals/rubric/api-decisions.md`:

```markdown
## AD-<nnn> <short title>
- Date: <YYYY-MM-DD>   Rule: <G-n>   Status: open | adopted | rejected | accepted-friction | needs-ben
- Trigger: <metric and value, run id>
- Options tried: <1..3 with the A/B numbers: pass rate A/B, triggering metric A/B, median turns A/B>
- Outcome: <what changed, with file paths>; ledger change required: yes | no
```

An entry with "ledger change required: yes" has status `needs-ben` until the ledger is updated.

### 8.14 Release gate and milestones

- **Release gate.** A release candidate MUST run the core set (arm `ripple`, bar adapter and model, 5 runs per cell, judged). Its pass rate MUST NOT be more than 5 points below the previous release's recorded run (`releaseMaxDrop`). The run's `report.md` is attached to the release.
- **M3 (commerce milestone), D-061:** the harness exists (8.1 files, the `pi` adapter and one more adapter, scoring without the judge) and T01, T02 and T08 have been run at least once on react and liquid (local tier), with results committed as `docs/research/spikes/evals-baseline/README.md`. No threshold applies at M3; the purpose is to find harness and API problems early. Rules G-1 to G-5 apply from this first run.
- **M4 and M5:** by the end of M4 all 17 tasks have `task.json`, `checks.spec.ts` and a reference solution for each npm host they list; by the end of M5 (the Liquid theme, D-067) also for `liquid`. Every reference solution passes its own checks and scores at least 95 with efficiency and adherence components set to full (test K-62).
- **M6:** judge calibrated; budgets frozen; the bar (8.12) run in full.
- **Nightly job.** `13-testing.md` rule CI-8 leaves the eval job to this document. From M3 onward `.github/workflows/nightly.yml` contains this job in addition to the jobs of `13-testing.md` section 17.4. It runs the core set once without the judge and never gates a merge:

  ```yaml
    evals:
      runs-on: ubuntu-24.04
      timeout-minutes: 360
      env:
        RIPPLE_EVAL_API_KEY: ${{ secrets.RIPPLE_EVAL_API_KEY }}
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with:
            node-version: "24"
            cache: pnpm
        - run: pnpm install --frozen-lockfile
        - run: pnpm exec playwright install --with-deps chromium
        - run: pnpm build
        - run: pnpm eval -- --tasks core --hosts all --adapter pi --arm ripple --runs 1
          if: env.RIPPLE_EVAL_API_KEY != ''
        - uses: actions/upload-artifact@v4
          if: always()
          with:
            name: eval-runs
            path: evals/runs/
            if-no-files-found: warn
  ```

  `run.ts` reads the model API key from `RIPPLE_EVAL_API_KEY` and passes it to the adapter under the name the harness CLI expects. While the secret is unset the eval step is skipped and the job is green; its result is reported as `skipped`, never as passed.

### 8.15 Acceptance (evals)

| Id | Test | Pass condition |
|---|---|---|
| K-60 | List `evals/tasks/`. | Exactly `T01` to `T17`; each has `task.json` valid against the `EvalTask` interface, with `prompt` byte-equal to 8.6 and `set` matching the core list. |
| K-61 | Adapter unit tests (E-4). | Each sample transcript parses to the expected `RunResult`; a transcript with missing usage fields parses without throwing. |
| K-62 | `pnpm eval -- --reference --tasks all` (scores each task's `reference/<host>/` as if an agent produced it; no model call). | Every reference passes all its applicable checks, has zero checker errors, and passes the gates. |
| K-63 | `score.ts` unit tests with fixed inputs. | The example of 8.8 yields the listed scores (to one decimal) and `passed: false`; changing `functional.passed` to 9 yields `passed: true`. |
| K-64 | `outside.ts` on a fixture diff. | Counts equal hand-computed values for each of the five terms. |
| K-65 | `friction.ts` on the two sample transcripts (each contains the example diagnostic of `07-manifest-registry-cli.md` section 9.4.1 in a tool output). | Extracts one `guessed` tuple: rule `RP101`, component `button`, prop `variant`, found `outlined`. |
| K-66 | `workspace.ts` for T08 on react and liquid, then `check --json`. | Test K-35. |
| K-67 | Canary (8.4 step 6) with a stub adapter that cannot see skills. | The invocation aborts with the stated message. |
| K-68 | `pnpm eval -- --bar` with any `null` model key. | Exit code 2 and the stated message. |
| K-69 | No file under `evals/` is in `pkg/`. | `npm pack --dry-run` in `pkg/` lists no path starting with `evals/`. |

---

## 9. Evidence and UNVERIFIED

Evidence read in source or run (by the research reports cited):

- Skills format, sync to `.claude/skills` and `.agents/skills`, metadata block, staged writes: `hydrogen/packages/hydrogen/src/cli/skills.ts`; skill names: `hydrogen/packages/hydrogen/skills/`.
- Eval harness shape, canary skill, default model: `hydrogen/scripts/storefront-benchmark-harness/` (`README.md`, `Dockerfile`, `opencode-runner.ts`).
- Agent bridge API and marks: `uisdk/packages/web/src/agent.ts`, `uisdk/packages/core/src/page/agent/agent.ts`, `uisdk/packages/core/src/foundation/kernel/primitive.ts` (the `agent` key), `uisdk/packages/core/skills/ui-sdk/references/agent-ready.md`.
- Bridge behaviour on Ripple-shaped pages: `ripple/docs/research/spikes/agent-kit/` (native controls outside a primitive are invisible; `rp-*` primitive with actions is callable) and `ripple/docs/research/spikes/elements-runtime/results-agent-confirm.txt` (native button with `data-agent-confirm` inside `rp-dialog` is refused through `press`).
- `checkPattern` and its patterns: `uisdk/packages/core/src/testing.ts`.
- Generated index pattern: `remix/packages/remix/INDEX.md`; "installed docs are canonical": `remix/.agents/skills/remix/SKILL.md`.
- Checker message format and prototype output: `ripple/docs/research/agent-kit-and-distribution.md` 7.2, 7.3; prototype in `ripple/docs/research/spikes/agent-kit/`.
- Agent action conventions in prior art: `tobi/src/primitives/cart.ts`, `product.ts`, `recommendations.ts`.

UNVERIFIED (each with what settles it):

| Item | Settled by |
|---|---|
| Whether Sidekick reads `.agents/skills`, loads pi packages, or sees anything beyond `AGENTS.md` and theme files | Ben / Shopify; until then K-1 is the design assumption and arm `no-skills` measures it |
| How closely the `pi` adapter matches Sidekick | Ben / Shopify (E-3) |
| Claude Code's `result` record field names; whether it reads `AGENTS.md` | First real run of the `claude-code` adapter; the adapter reads defensively and writes `CLAUDE.md` |
| pi JSONL record names beyond the documentation | First real run; adapter unit test with a recorded stream |
| Whether a METHOD step is gated by `data-agent-confirm` on a descendant control | SPIKE-08 (7.7) |
| The whole eval design (no run executed) | M3 baseline (8.14) |
| mock.shop catalogue shape assumed by `mockshop.ts` (a product with two or more variants; a collection with eight or more products) | First harness run; `mockshop.ts` exits with a clear message when no such product or collection exists |
| `checkPattern(element, "dialog")` on a native `<dialog>` (T10-C4; D-108) | Test K-62 on the T10 reference solution |
| Whether `<pm> exec ripple` and `npx <pkg>` both resolve the binary in every package manager (the static spelling of the command form, section 0) | First run of T01 on each npm host; `07-manifest-registry-cli.md` section 7.1 rule 12 |
| The name of the environment variable each harness CLI reads its model key from | First real run of each adapter |

---

## Ledger issues

None open. See `00-decisions.md` section 13.2.
