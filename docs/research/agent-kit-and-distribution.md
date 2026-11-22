# Agent kit and distribution: manifest, registry, CLI, checker, skills, evals, package

Scope: how Ripple is packaged, installed, upgraded, documented for agents, checked and evaluated.
Status: research findings. Normative statements are collected in section 12, "What the spec must say".

Paths are relative to the local clones: `uisdk/`, `hydrogen/`, `remix/`, `tobi/`, `ripple/` (so `ripple/theme/AGENTS.md` is the base theme guide). `spike/` means `ripple/docs/research/spikes/agent-kit/`. Other research reports are cited by file name (`uisdk-web-elements.md`, `react-and-custom-elements.md`, `hydrogen-core.md`, `liquid-blocks-partials.md`, `remix-3.md`, `styling-spike.md`, `base-theme.md`).

Labels used: **[RUN]** I executed it and the output is in `spike/`. **[SRC]** read in source or shipped docs. **[MEM]** from memory, not checked against a source in this session. **UNVERIFIED** not checked at all, or cannot be checked from here.

---

## 0. What was run and what was only read

| Item | How | Where |
|---|---|---|
| Hydrogen skills CLI on a directory with no `package.json` | [RUN] `npx @shopify/hydrogen@2026.10.3 skills sync`, then `skills check`, then check again after editing a synced skill | section 2.1 |
| UI SDK agent bridge on a native-first page | [RUN] real `@ui-sdk/web@0.1.0-beta.14` in Chromium: `snapshot()`, `act()` | `spike/agent/run.cjs`, `result.txt` |
| `checkPattern` from `@ui-sdk/core/testing` in a real browser, also injected into a page that has no UI SDK | [RUN] | `spike/agent/pat.cjs`, `pat-result.txt` |
| Zero-dependency three-way merge | [RUN] 2,000 random cases compared with `git merge-file -p --diff3` | `spike/merge/diff3.mjs`, `test.mjs`, `result.txt` |
| Provenance trailer and upgrade decision table | [RUN] 10 cases | `spike/merge/upgrade.mjs`, `upgrade-result.txt` |
| Manifest JSON Schema with four worked entries | [RUN] validated with `jsonschema` 4.26 (Draft 2020-12); 8 negative cases rejected | `spike/manifest/` |
| One contract template, three emitters (reference HTML, Liquid, React TSX) | [RUN] 10 prop cases, canonical HTML equal across all three | `spike/gen/emit.mjs`, `test.mjs`, `result.txt` |
| Liquid `{% doc %}` + `{% schema %}` + trailer generated from the manifest, linted by Theme Check 4.0.2 | [RUN] | `spike/gen/from-manifest.mjs`, `theme-check.txt` |
| Checker prototype, teaching message format | [RUN] 11 diagnostics on a sample | `spike/check/check.mjs`, `result.txt` |
| shadcn CLI 4.23.0, `@shadcn/registry` 0.2.1 | [SRC] npm tarballs unpacked and grepped (`ui.shadcn.com` is blocked by the proxy) | section 2.5 |
| pi coding agent 1.6.0 (`@earendil-works/pi-coding-agent`) | [SRC] docs shipped in the npm tarball | section 2.7 |
| Claude Code 2.1.330 | [RUN] `claude --help` only | section 2.7 |
| Shopify theme storage of root files, LiquidDoc, Theme Check | [SRC] `mcp__Shopify__search_docs_chunks` | section 3 |
| npm name availability | [RUN] `npm view` on 2026-11-21 | section 11.4 |
| Radix Themes, Base UI `llms.txt`, shadcn `components.json` | [MEM] | section 2.5, 2.6 |

Not done: no eval run was executed (no model credentials, no Docker in this session). Section 10 is a design built on Hydrogen's existing harness, not a measured result.

---

## 1. Headline conclusions

1. **A lockfile at the project root cannot be the record of what is installed in a Liquid theme.** Shopify stores only the theme directories plus `AGENTS.md` and `DESIGN.md` at the theme root ("Shopify supports the files only at the theme root"; "Shopify doesn't save other casings", docs: `/docs/storefronts/themes/agentic-workflows`). A `ripple.lock.json`, `.claude/skills` or `.agents/skills` next to them does not survive a round trip through Canvas/Sidekick or the GitHub integration (UNVERIFIED for arbitrary root files; the docs list only those two). Ripple MUST record provenance **inside each scaffolded file** as a one-line trailer (`ripple <id> <pkg>@<version> <sha256>`). Hydrogen already does exactly this for skills (`hydrogen/packages/hydrogen/src/cli/skills.ts`, `METADATA_BLOCK_PATTERN`) and it worked in a directory with no `package.json` [RUN]. The trailer passes Theme Check when placed after `{% endschema %}` [RUN].
2. **In a Canvas/Sidekick session the only agent context that travels with a theme is `AGENTS.md` (max 50 KB) and the theme files themselves.** The base theme's `AGENTS.md` is already 37,487 bytes. So for Liquid, the per-component reference MUST be the generated `{% doc %}` header of each block file, and Ripple's part of `AGENTS.md` MUST be a small, generated, marker-delimited section. Skills are an extra for local agents and for harnesses that load them from the package.
3. **UI SDK's agent bridge does not see native controls.** On a page with a native search form, `<select>`, `<details>`, a native Add to cart button and a link, `createAgent().snapshot()` returned only the `ui-button`, the `ui-input` and the `rp-product-form` primitive; `act()` on the native input failed with `No component "Search products" on the page` [RUN]. Ripple is native-first (decision 2; `uisdk-web-elements.md` 9.1), so "agent actions" in the manifest exist only for `ui` and `commerce` components. Static components are reached through the accessibility tree. `data-agent-confirm` on a native button is not enforced by anything.
4. **The bridge costs about 12 kB gzip** (`button` alone 15,719; `button` + `createAgent` 27,695) [RUN]. It MUST be a separate opt-in entry, never part of `ripple.js`.
5. **Theme Check already validates part of a Liquid call, and misses the rest.** With a generated `{% doc %}`, Theme Check 4.0.2 reported an unknown argument, a bad literal for a doc-declared union and a number passed for a string. It did not report `size: 'huge'` (a schema `select` setting), `gap: '2 md:99'` or `align: 'middle'` [RUN], which agrees with `liquid-blocks-partials.md` conclusion 4. `ripple check` MUST cover schema-backed enumerations and responsive strings, and SHOULD run Theme Check rather than re-implement it.
6. **One data template per component can generate the React binding, the Liquid block body and the fixtures.** A JSON tree with three condition forms and three value forms, plus 94 lines of emitters, produced canonical-equal HTML from the reference renderer, liquidjs and `react-dom/server` for Button and Stack over 10 prop cases, including invalid enumerations and the string `'false'` for a boolean [RUN]. This supports the recommendation in `remix-3.md` section 12 for static components. It is not proven for `ui` and `commerce` components.
7. **A zero-dependency three-way merge is small and can match git.** A 69-line LCS-based diff3 gave byte-identical clean merges and identical conflict/no-conflict classification to `git merge-file --diff3` on 2,000 random cases [RUN]. The first version merged adjacent edits that git reports as conflicts (199 of 2,000 cases); the fix is one rule: hunks that touch are one region. The spec MUST state that rule.
8. **shadcn does not merge.** `shadcn@4.23.0` contains no three-way merge; `diff` is deprecated in favour of `add --diff` [SRC]. Ripple's upgrade path is new work, not a copy.
9. **One npm package, as Hydrogen does it.** Hydrogen ships core, `/react`, `/vue`, a CLI bin and `skills/` in one package with optional peers (`hydrogen/packages/hydrogen/package.json`). The same shape fits Ripple, and it is required by the fact that Ripple's CSS and fixtures encode the exact UI SDK version (`uisdk-web-elements.md` 9.8).
10. **Placeholder package name: `ripple-kit`.** Free on npm on 2026-11-21. `ripple`, `rippleui` and the `@ripple-ui` scope are taken by unrelated UI projects [RUN].

---

## 2. Evidence from prior art

### 2.1 Hydrogen: skills system

Source: `hydrogen/packages/hydrogen/src/cli/skills.ts` (659 lines), `src/cli/index.ts`, `src/cli/setup.ts`, `package.json`, `skills/*`.

Packaging [SRC]:

- 21 skills in `packages/hydrogen/skills/<name>/SKILL.md`, some with `references/` or `steps/`. `package.json` has `"files": ["README.md", "bin", "dist", "skills", "ts-plugin"]` and an export `"./skills/*": "./skills/*"`.
- `"bin": { "hydrogen": "./bin/hydrogen.mjs" }`; the bin imports `../dist/cli/index.mjs`.
- CLI runtime dependencies are only `cross-spawn` and `gql.tada`. The CLI uses Node built-ins (`node:fs`, `node:crypto`, `node:util` `parseArgs`).
- Frontmatter of every skill: `name`, `description` (folded scalar, "what it is" then "Use when ..."). Sizes: 50 to 375 lines per `SKILL.md`, 3,659 lines total.
- Skills are written "from the consumer project's perspective" and MUST NOT reference repository-only paths (`hydrogen/packages/hydrogen/AGENTS.md`).
- Skills refer to each other by name: "Use the local `hydrogen-routing` skill for the required routing options" (`skills/hydrogen-cart-drawer/SKILL.md`). `hydrogen-setup` is an orchestrator whose steps are files in `steps/1-inspect-app.md` to `11-verify.md`.

Commands [SRC] (`src/cli/index.ts`): `certs install`, `certs uninstall`, `setup`, `skills check`, `skills sync`, `gql check`.

`skills sync` algorithm [SRC]:

1. Package root = `packageRoot` option, else the installed package resolved with `createRequire(join(appRoot, "package.json")).resolve("@shopify/hydrogen/package.json")`, else the CLI's own package (`getPackageRoot()`). This is why it works with no `package.json`.
2. Destinations are **always both** `.claude/skills` and `.agents/skills` ("Claude Code reads `.claude/skills`, while Codex, Cursor, and OpenCode read `.agents/skills`. Writing both means no project has to declare which agents it uses").
3. For each shipped skill: hash = `sha256` over every file in the skill directory, sorted by POSIX path, each as `path \0 content \0`, with CRLF normalised to LF and the injected metadata block stripped from `SKILL.md`. The written `SKILL.md` gets this block appended to its frontmatter:

   ```yaml
   metadata:
     source: "@shopify/hydrogen"
     version: "2026.10.3"
     hash: "sha256:29ee79...dd16"
   ```

4. Destination state is one of `absent`, `partial` (directory without `SKILL.md`), `unmanaged` (no metadata block), `managed` with `modified = currentHash !== metadata.hash`.
5. Decision table (`decideShippedAction`):

   | State | Action |
   |---|---|
   | absent | add |
   | partial | update |
   | unmanaged | conflict; with `--force` update |
   | managed, unmodified, same version and hash | unchanged |
   | managed, unmodified, different | update |
   | managed, modified, shipped is the same version | unchanged (nothing new to pull) |
   | managed, modified, shipped differs | skip; with `--force` update |

6. Skills no longer shipped: managed and unmodified are removed; managed and modified are "orphans" and need a yes/no answer; with no TTY or `CI` set the answer is "keep".
7. Any `unmanaged` collision aborts the whole run **before any write**.
8. Writes are staged: copy to `<skill>.hydrogen-sync`, then `rmSync` the old directory and `renameSync`. A leftover staging directory is always removed on the next run.

`skills check [--mode error|warn]` [SRC]: computes the same plan without writing. `error` throws on drift (for CI); `warn` prints and continues (for a dev script prefix). "A project with no synced skills counts as drift".

[RUN] in an empty directory containing only `blocks/` and `templates/` (no `package.json`):

```
$ npx --yes @shopify/hydrogen@2026.10.3 skills sync
Synced Hydrogen 2026.10.3 skills to .../.claude/skills: 21 added, 0 updated, 0 unchanged, 0 removed.
Synced Hydrogen 2026.10.3 skills to .../.agents/skills: 21 added, 0 updated, 0 unchanged, 0 removed.
$ npx @shopify/hydrogen@2026.10.3 skills check        -> "up to date", exit 0
$ echo x >> .claude/skills/hydrogen-money/SKILL.md
$ npx @shopify/hydrogen@2026.10.3 skills check        -> "up to date", exit 0
```

The last line is by design (a local edit of the current version is not drift). Ripple needs a different answer for component files: a modified file must be visible in `status`.

`setup` [SRC] (`src/cli/setup.ts`): detects the package manager from `packageJson.packageManager`, then lockfiles (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`, `bun.lock`), then `npm_config_user_agent`, default `npm`. With no `package.json` and no terminal it logs "No package.json found and no terminal to prompt; installing skills only." It prompts only when `canPromptInTerminal()`.

Evaluation harness [SRC] (`hydrogen/scripts/storefront-benchmark-harness/README.md`): a Dockerized OpenCode run. The host wrapper deletes and recreates a workspace from `workspace-template/`, builds and packs the current package into `vendor/hydrogen.tgz`, and the seeded app depends on `"file:./vendor/hydrogen.tgz"` so that a normal install extracts `skills/`. A canary skill (`.opencode/skills/benchmark-canary/SKILL.md`) verifies skill discovery. Artifacts: raw JSON event stream, exported session, summary. Default model in that harness: `anthropic/claude-opus-4-6`. The expected flow inside the container is `pnpm install`, `pnpm hydrogen setup`, then the `hydrogen-setup` skill.

Verification skill [SRC]: `skills/hydrogen-smoke-test/SKILL.md` is a copyable checklist (static checks, request handlers, navigation, product page, cart, collection and search, analytics, markets and money, production pass). Ripple's check skill should defer to it for everything that is data wiring.

### 2.2 UI SDK: skill, docs, agent bridge, testing, size budget

Skill [SRC]: one skill, `uisdk/packages/core/skills/ui-sdk/SKILL.md` (56 lines) plus `references/` (`agent-ready.md`, `build-interface.md`, `create-component.md`, `patterns.md`, `styles.md`, `testing.md`, `web-components.md`). The skill routes ("Pick your path"), states rules for every path, and ends with a done-checklist. `uisdk/skills.sh.json` is `{ "paths": ["./packages/core/skills"] }` (how the skills.sh tool consumes it is UNVERIFIED). `@ui-sdk/core` ships `"files": ["dist", "docs", "skills"]`. No CLI copies the skill into a project.

Docs for agents [SRC]: every package ships Markdown docs: "`node_modules/@ui-sdk/<framework>/docs/llms.txt` is the index. Read it first ... Then read only the pages your task needs ... Prefer the installed copy: it matches the version in the project." `@ui-sdk/web` also ships `custom-elements.json` and `html-custom-data.json` (`uisdk/packages/web/package.json` `files`, `customElements`), generated by `uisdk/scripts/package-docs.mjs`.

Agent bridge [SRC] (`uisdk/packages/core/src/page/agent/agent.ts`, exported as `@ui-sdk/core/agent` and re-exported unchanged by `@ui-sdk/web/agent`):

```ts
function createAgent(options?: {
  allow?: (step: AgentAction, context: { signal: AbortSignal }) => boolean | Promise<boolean>
  timeout?: number            // ms a step waits for allow; default 5 minutes
}): {
  snapshot(): AgentComponent[]
  act(input: { steps: AgentStep[] }): Promise<{ ok: boolean; error?: { step: number; message: string }; steps: ...; appeared: ...; values: ... }>
  query(input: { text?: string; within?: string; kind?: string }): Promise<...>
}
function registerTools(agent, { allow }: { allow: Allow }): () => void   // WebMCP: document.modelContext.registerTool
const agentTools: { name: "snapshot" | "act" | "query"; description: string; inputSchema: object }[]

type AgentStep = { ref: string; action: string; args?: unknown[] }
type AgentComponent = { ref: string; component: string; label?: string; row?: string; items?: {value,label}[];
  text?: string[]; buttons?: string[]; pending?: boolean; error?: string; confirm?: string; offPage?: boolean;
  source?: string; actions: string[]; [state: string]: unknown }
```

The return shape of `act` is as observed in [RUN]; its TypeScript type was not read. A primitive declares its agent surface with `agent: { actions, closed, items, reveals, shown, secret }` on `definePrimitive` (`uisdk/packages/core/src/foundation/kernel/primitive.ts`, `skills/ui-sdk/references/agent-ready.md`). Without `actions`, only api methods matching a verb pattern (`set[A-Z]`, `open`, `close`, `toggle`, `select`, `clear`, `next`, `previous`, `add`, `remove`, `submit`, ...) are offered. Three marks exist and only these three: `data-agent-confirm="<sentence>"`, `data-agent-secret`, `data-agent-hidden`. A change made by an agent reports `details.source === "agent"`.

The bridge lists only UI SDK primitives. The skill says so: "`snapshot()` lists only ui-sdk components. These are invisible ... a plain `<button>` ... a bare `<input>`, `<textarea>` or `<select>`" (`references/agent-ready.md`, checklist item 2).

[RUN] `spike/agent/result.txt`, page `spike/agent/page.html`:

```
SNAPSHOT
{"ref":"c1","component":"button","actions":["press"],"label":"Check out","confirm":"Goes to Shopify checkout"}
{"ref":"c3","component":"input","actions":["setValue","clear"],"label":"Email","value":""}
{"ref":"c4","component":"rp-product-form","actions":["setQuantity","add"],"label":"Snowboard purchase"}
ACT rp-product-form            {"ok":true,...}   (window.__added = 3)
ACT confirm (not approved)     {"ok":false,"error":{"step":0,"message":"The person said no to \"Goes to Shopify checkout\"."}}
ACT native input               {"ok":false,"error":{"step":0,"message":"No component \"Search products\" on the page. Its labels: Check out, Email, Snowboard purchase."}}
ACT press native button inside rp element   {"ok":false,"error":{"step":0,"message":"rp-product-form c4 has nothing to press now."}}
```

Consequences:

- The native search input, `<select>`, `<details>`, the link and both native buttons inside `<rp-product-form>` are invisible to the bridge.
- An `rp-*` primitive with `agent.actions` is visible and callable, and takes its label from `aria-label` on the root.
- `data-agent-confirm` on `<ui-button>`'s button is enforced by the bridge. The same attribute on a native button inside `rp-product-form` is not reachable, so not enforced.
- Bundle cost of `createAgent`: 27,695 minus 15,719 = 11,976 bytes gzip on top of the `button` entry.

Testing API [SRC] (`uisdk/packages/core/src/testing.ts`), exact exports:

```ts
export { attrs as partAttrs, partState, present as partPresent } from "./foundation/kernel/part"
export { setPlatform } from "./foundation/platform/platform"
export { checkDirection } from "./testing/check-direction"
export { checkPattern, type Pattern } from "./testing/check-pattern"
export { checkServer } from "./testing/check-server"
export { settle } from "./testing/input"
export { mount } from "./testing/mount"
```

```ts
type Pattern = "listbox" | "menu" | "menubar" | "tabs" | "radio-group" | "toolbar" | "tree" | "dialog"
  | "alertdialog" | "disclosure" | "accordion" | "combobox" | "slider" | "switch" | "checkbox"
async function checkPattern(root: Element, pattern: Pattern): Promise<void>   // @experimental
```

`checkPattern` checks roles, required states, names and id references, one tab stop per composite, then drives keys from the focused element, and throws one `Error` whose message lists every problem (`check-pattern.ts`). Usage from the skill: `mount(primitive, options, markup)` returns a view with `keys`, `part`, `state`, `changes`, `announced`, `settle`, `unmount`; `checkServer(primitive, options, markup)`; `await checkDirection(primitive, options, markup)` (`skills/ui-sdk/references/testing.md`). All are marked experimental or undocumented as stable; Ripple MUST treat them as test-time tools pinned with the UI SDK version.

[RUN] `spike/agent/pat-result.txt`: `checkPattern` works in real Chromium, both bundled with the page and injected into an arbitrary page with `page.addScriptTag` (testing-only bundle: 10,904 bytes gzip). It reported 9 specific problems on a hand-rolled `role="tablist"`. It reported **nothing** for an open `ui-dialog` that has no title. So an untitled dialog is not caught by `checkPattern("dialog")` in beta.14, and Ripple needs its own static rule for it.

Size budget [SRC]: `uisdk/size-budget.json` maps every entry (and `(lazy)` chunk) to a gzip byte budget; `scripts/size.mjs` bundles each entry as an app would, compares with 3% tolerance, `--strict` fails, `--update` rewrites (`uisdk/tests/README.md`, "Bundle size"). It also fails when production code contains development-only strings. Ripple should copy this mechanism for `ripple.js`, each `rp-*` entry and `ripple.css`.

Test taxonomy [SRC] (`uisdk/tests/README.md`): specs are named by kind: `<name>.spec.ts` (behaviour), `.a11y.spec.ts`, `.sr.spec.ts`, `.rtl.spec.ts`, `.ssr.spec.ts`, `.counts.spec.ts`, `.kitchen-sink.spec.ts`, plus unit tests and docs tests, run per framework project. Ripple's equivalent of "framework project" is "host".

### 2.3 Remix 3: generated index, one skill

[SRC] `remix/packages/remix/INDEX.md` (81 lines): a generated table of guides and of package exports with a one-line description and a link to the README shipped in the package. `package.json` `files` includes `INDEX.md`; `prepack` runs `scripts/sync-remix-package-files.ts`; `manifest.test.ts` asserts that the export manifest, the index and the READMEs agree.

[SRC] `remix/.agents/skills/remix/SKILL.md`: "Search `node_modules/remix/INDEX.md` by task, export, or keyword, for example `grep -i 'session' node_modules/remix/INDEX.md` ... Treat the installed documentation as canonical, including when it differs from this skill." The app template's `AGENTS.md` points to `./.agents/skills/remix/SKILL.md`. Remix's README states new apps include the skill. No `skills sync` command exists in the Remix CLI.

[SRC] `remix/.agents/skills/publish-placeholder-package/SKILL.md`: reserve an npm name by publishing `0.0.0` from a temporary directory.

Takeaways: one searchable, generated index file in the package; docs for the installed version are canonical; a test keeps index and exports in sync.

### 2.4 Tobi's prior art

[SRC] `tobi/AGENTS.md`: "Agent-ready by default. Every meaningful user action is exposed on `api` and declared in `agent.actions` ... Interactive controls must always have accessible names (zero unnamed controls in `agent.snapshot()`), and irreversible actions like checkout must be gated with `data-agent-confirm`."

[SRC] declarations in `tobi/src/primitives/`:

| Primitive | `agent` |
|---|---|
| `cart.ts:429` | `actions: ["add", "setQuantity", "remove", "restore", "applyDiscount", "removeDiscount", "setNote"]` |
| `product.ts:157` | `actions: ["setVariant", "setOption", "setQuantity", "add"], shown: (state) => Boolean(state.product)` |
| `variant-selector.ts:244` | `actions: ["setValue", "setOption"]` |
| `catalog.ts:421` | `actions: ["setQuery", "setFilter", "setVendor", "setOnSale", "setSort", "reset", "loadMore"]` |
| `search.ts:185` | `actions: ["setQuery", "clear"]` |
| `product-media.ts:339` | `actions: ["setValue", "next", "previous", "open", "close"]` |
| `market-selector.ts:322` | `actions: ["setCountry", "setLanguage"]` |
| `price.ts`, `image.ts`, `recommendations.ts`, `shop-promise.ts`, `shop-pay.ts` | `actions: [], shown: () => false` (display-only primitives hidden from agents) |

Confirm marks: `"data-agent-confirm": "Go to Shopify checkout for this bag"` on the checkout control (`src/react/cart.tsx:361`, `src/solid/cart.tsx:320`) and `"Buy now with Shop Pay"` (`src/primitives/shop-pay.ts:161`).

Tobi's package pins `@ui-sdk/*` at `0.1.0-beta.5` as peer dependencies and exports `.`, `./core`, `./solid`, `./react`, `./styles.css` from source. Every control there is a UI SDK part, which is why the bridge sees all of it. Ripple cannot inherit that property (conclusion 3).

### 2.5 shadcn

Verified from the `shadcn@4.23.0` and `@shadcn/registry@0.2.1` tarballs [SRC]:

- Commands: `init`, `add`, `apply`, `build`, `diff`, `docs`, `eject`, `info`, `mcp`, `migrate`, `preset`, `registry`, `search`, `validate`, `view`. `diff` is described as "[DEPRECATED] Use `add [component] --diff` instead." `docs` is "get docs, api references and usage examples for components". `validate` is "validate a shadcn registry".
- Registry item types present in code: `registry:base`, `registry:block`, `registry:component`, `registry:example`, `registry:file`, `registry:font`, `registry:hook`, `registry:internal`, `registry:item`, `registry:lib`, `registry:page`, `registry:style`, `registry:theme`, `registry:ui`.
- Field names present in the schema code: `registryDependencies`, `devDependencies`, `cssVars`, `envVars`, `categories`, `target`, `docs`, `meta`, `extends`, `css`, `registries`, `iconLibrary`, `aliases`.
- MCP tools: `get_project_registries`, `list_items_in_registries`, `search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`, `get_add_command_for_items`, `get_audit_checklist`.
- The CLI has 32 runtime dependencies (`ts-morph`, `recast`, `postcss`, `zod`, `commander`, `prompts`, ...). No string "three-way" exists in the bundle.

From memory [MEM], not checked: `components.json` holds `$schema`, `style`, `rsc`, `tsx`, `tailwind { config, css, baseColor, cssVariables, prefix }`, `aliases { components, utils, ui, lib, hooks }`, `iconLibrary`, `registries { "@ns": "<url with {name}>" }`. A registry item is JSON with `name`, `type`, `title`, `description`, `dependencies`, `registryDependencies`, `files[] { path, type, target, content }`, `cssVars { theme, light, dark }`. `add` asks before overwriting an existing file (`--overwrite` skips the question). Namespaced install: `npx shadcn add @acme/button`.

What makes it work for agents (judgement):

1. The code is in the repository, so the agent can read exactly what it will run and edit it.
2. One flat, enumerable JSON description per item, with file targets.
3. A deterministic CLI with non-interactive flags.
4. List, search, view and examples tools, and an audit checklist tool to run after adding.

What Ripple takes: per-item `files` with a `target`, a dependency list between items, tokens declared with the item, `add --diff`, a `docs` command, and the "audit after adding" step (as `check`). What Ripple MUST add, because shadcn does not have it: provenance per file, upgrade with merge, a contract checker, fixtures. What Ripple MUST NOT copy: the dependency weight of the CLI (decision 3).

MCP: not needed in V1. Every agent that can run the CLI can call `docs`, `manifest` and `check --json`. An agent that cannot run a CLI (Sidekick in Canvas, UNVERIFIED) reads `AGENTS.md` and `{% doc %}`. An MCP server would be a third surface to keep in sync.

### 2.6 Radix Themes and Base UI docs [MEM]

- Radix Themes: a library (not scaffolded) where a single `<Theme accentColor grayColor radius scaling appearance>` sets a few dials, and components take props on fixed, small scales (`size="1"` to `"9"`, `gap="3"`), with responsive values as objects (`{ initial: "1", md: "3" }`). Customising means changing tokens, not component code. This is the model for "good enough that most never edit it" and for dials. `styling-spike.md` section 7 covers what Ripple copies and avoids.
- Base UI docs publish `llms.txt` as an index of Markdown versions of each docs page. UI SDK ships the same thing inside each package (2.2), which is stronger because it is versioned with the install.

### 2.7 Harnesses: pi and Claude Code

pi [SRC] (docs in the `@earendil-works/pi-coding-agent@1.6.0` tarball; the older `@mariozechner/pi-coding-agent` is at 0.73.1):

- Skills follow the Agent Skills specification: a directory with `SKILL.md` and frontmatter `name`, `description` (also `license`, `compatibility`, `metadata`, `allowed-tools`, `disable-model-invocation`). "At startup, Pi scans configured skill locations and adds each skill's name, description, and path to the system prompt. It does not add the full instructions." `/skill:name` forces a load.
- Locations: `.pi/skills/` (project), and "Pi also supports the Agent Skills locations `~/.agents/skills/` and `.agents/skills/`", discovered from the working directory up to the repository root. `--skill <path>` loads one explicitly; `-ns` disables discovery.
- Context files: `AGENTS.md` and `CLAUDE.md` are discovered and loaded; `-nc` disables that.
- An npm package can be a pi package: `package.json` `"keywords": ["pi-package"]` and `"pi": { "skills": ["./resources/skills"] }`; installed with `pi install npm:<name>@<version>` or loaded for one run with `pi -e npm:<name>`.
- Headless: `pi --mode json "<prompt>"` writes JSONL to stdout (first record `{"type":"session",...}`, then `agent_start`, `turn_start`, `message_start`, `message_update`, `message_end`, `turn_end`, `agent_end`, `agent_settled`). "A turn is one assistant response plus any tool calls and tool results produced by that response." `message_update.usage` carries `input`, `output`, `cacheRead`, `cacheWrite`, `totalTokens`, `cost.total`. `-p` prints only the final text. `--model <provider/id>[:<thinking>]`, `--no-session`, `--tools`, `--append-system-prompt`. The docs warn that Node `readline` is not suitable for splitting the stream.

Claude Code [RUN] (`claude --help`, version 2.1.330): `-p/--print`, `--output-format` (with `stream-json`), `--verbose`, `--model`, `--permission-mode`, `--dangerously-skip-permissions`, `--allowedTools`, `--disallowedTools`, `--append-system-prompt`, `--max-budget-usd`, `--mcp-config`, `--setting-sources`, `--bare`, `--json-schema`, `--add-dir`. `--max-turns` is not listed in this version's help. The fields of the final `result` event (`num_turns`, `usage`, `total_cost_usd`, `duration_ms`) are [MEM]; the adapter MUST read them defensively. Project skills are read from `.claude/skills` (Hydrogen's code comment, 2.1).

---

## 3. The base theme: confirms, constrains, conflicts

Read: `ripple/theme/AGENTS.md` in full, `blocks/button.liquid`, `config/styles.css` (head), `snippets/import-map.liquid`, `DESIGN.md` markers, directory listing. A full inventory is in `base-theme.md`.

| Theme fact | Evidence | Effect on distribution and the agent kit | Resolution |
|---|---|---|---|
| The theme root holds only theme directories, `AGENTS.md` and `DESIGN.md`. No `package.json`, no lockfile, no `.agents/`. | directory listing; docs `/docs/storefronts/themes/agentic-workflows` | **Constrains.** No root lockfile, no config file, no `node_modules`. | Provenance trailer in every file (section 6.2); host detected from directories (6.4); CLI run with `npx` (6.8). |
| `AGENTS.md` is the agent guide, limit 50 KB; the theme's is 37,487 bytes. Sidekick reads it before changing the theme and may update `DESIGN.md`. | docs, `wc -c` | **Constrains.** Ripple cannot add a second guide file and cannot add much text. | A generated, marker-delimited Ripple section of at most 12 KB, listing only installed components (9.4). The Ripple base theme's own guide gets shorter because component rules move into `{% doc %}`. Check rule RP406 guards the 50 KB limit. |
| `DESIGN.md` already has a generated region between `<!-- design-tokens:generated:start -->` and `<!-- design-tokens:generated:end -->`. | `ripple/theme/DESIGN.md` lines 1 and 94 | **Confirms** marker-delimited generated regions in root Markdown files. | Same mechanism for Ripple's `AGENTS.md` section and for the token index when Ripple owns the tokens. |
| "Every block has a `{% doc %}` header with typed params and a `{% schema %}` tag", `@example` required for snippets. | `AGENTS.md` "Required shape", `blocks/button.liquid` | **Confirms** generating `{% doc %}` and `{% schema %}` from the manifest. | Section 5; verified with Theme Check [RUN]. |
| Schema settings are overridden with bare kwargs and are not doc params ("keep its ID out of `{% doc %}` params"). | `AGENTS.md` "Merchant settings" | **Constrains** the generator and the checker: a setting-backed enumeration is invisible to Theme Check. | Manifest flag `liquid.surface: "setting" | "param"` per prop; settings are listed in the doc description; RP101 checks them (verified gap, conclusion 5). |
| "Aim for 3 or fewer styling settings per block schema". | `AGENTS.md` | **Constrains** the manifest. | Manifest build fails when a component has more than 3 `surface: "setting"` props of enumerated type. |
| `button` variants are class names (`button-primary`, ...); `class` carries size and shape as utilities; the `{% doc %}` teaches `class: 'px-4 h-11 text-sm'`. | `blocks/button.liquid` | **Conflicts** with enumerated props printed as `data-` attributes. | Ripple's contract wins (decision 5: props with opinionated scales). The checker reports hand-rolled utility sizing on a Ripple root only as a warning (RP116), because utilities are the escape hatch. |
| "Canvas/Sidekick compiles `config/styles.css` and persists `assets/styles.min.css` ... Classic Edit Code alone does not invoke the compiler." `source(none)` with explicit `@source` globs including `blocks/**/*.liquid` and `snippets/**/*.liquid`. | `AGENTS.md`, `config/styles.css` lines 1 to 6 | **Constrains.** There is a compiler Ripple does not control and cannot run from the CLI. `{% doc %}` examples are scanned for class names. | `ripple add` on a theme patches `config/styles.css` inside a marker region and also writes the precompiled fallback (decision of `base-theme.md` item 17 and `liquid-blocks-partials.md` 7.3). Generated `{% doc %}` text MUST NOT contain utility-looking tokens. |
| "One custom element per JS file", `@theme/*` import-map specifiers, "Never use relative `./` or `../` imports between `assets/*.js` modules". | `AGENTS.md` "Component rules", `snippets/import-map.liquid` | **Constrains** how `ripple.js` is installed: flat files in `assets/`, entries added to the one import map. | Files of type `asset` are flat; the import-map change is a one-line `{% render %}` patch (6.6). |
| The guide refers to validators that are not in the repository: `validate:block-settings`, "the theme CSS linter", `reviewing-theme-css`, "the spec audit validates the entries in this file". | `blocks/button.liquid` doc, `AGENTS.md`, `snippets/import-map.liquid` doc | **Confirms** the need for a shipped checker: the theme's rules are enforced by tools an outside agent does not have. | `ripple check` ships in the package and is runnable with `npx` (section 7). |
| Commands (`commandfor`/`command`), native `<dialog>`/`<details>`/popover first. | `AGENTS.md` "Native browser behavior first", "Commands" | **Bears on** `kind` and on agent surface: native overlays are also invisible to the bridge. | The manifest has four kinds (`static`, `native`, `ui`, `commerce`) so either decision on Dialog fits the schema (4.3). |
| "Commerce contracts": `name="checkout"` on checkout submitters, `input[name="id"]` as the variant source of truth, quantity rules. | `AGENTS.md` "Commerce contracts" | **Confirms** checker rules RP305 and RP306. | Section 7. |
| Translated UI only; schema labels are `t:` keys. | `AGENTS.md` "Translations" | **Constrains** generation: every label in a generated `{% schema %}` is a `t:ripple.*` key, and `add` patches locale files. | Section 5, 6.6. |

One conflict between investigators that the spec author must settle: `base-theme.md` (section 5 item 4) says Dialog and Drawer are native `<dialog>` with `commandfor`; `uisdk-web-elements.md`, `react-and-custom-elements.md`, `liquid-blocks-partials.md` and `remix-3.md` all built and tested Dialog on `ui-dialog`. The manifest schema here supports both. The worked Dialog entry in 4.3 uses the `ui-dialog` contract because that is the one with zero-diff fixtures.

---

## 4. The component manifest

### 4.1 Purpose and shape

The manifest is the machine-readable source for everything that must be identical across hosts: names, props, enumerations, parts, fixtures, rules, files. It is **not** what an agent reads to learn a component: four entries serialise to 22.9 kB, so about 90 entries would be roughly 500 kB. Agents read the generated per-component Markdown page (or the `{% doc %}` header in Liquid) and the index.

Layout in the Ripple repository (hand-written source):

```text
manifest/
  manifest.schema.json            # section 4.2
  base.json                       # package, prefix, pins, scales, hosts
  components/<name>.json          # one file per component, without fixture html for templated components
  fixtures/<name>/<fixture>.html  # only for fixtures with generated: "hand" or "upgrade-snapshot"
  blueprints/<name>.json
```

Build output shipped in the package: `manifest.json` (all components, fixture HTML inlined) and `manifest.schema.json`.

### 4.2 JSON Schema

The complete schema is `spike/manifest/manifest.schema.json` (Draft 2020-12, 294 lines), validated with `jsonschema` 4.26 [RUN]. Structure:

```text
manifest
  manifestVersion: 1
  package: { name, version }
  prefix: { css: "rp-", element: "rp-", liquidFile: "" | "rp-" }
  pins: { "@ui-sdk/core", "@ui-sdk/web", "@shopify/hydrogen": exact versions, no ranges }
  scales: { breakpoint: [...], <name>: [...] }
  hosts: ["html", "react", "remix", "liquid"]
  components: { <kebab-name>: component }
  blueprints: { <kebab-name>: blueprint }

component (all required unless marked ?)
  name, title, category, kind, status, since, summary
  useWhen?[], dontUseWhen?[{ case, use }], partOf?
  root: { elements[], class, requiresId? }
  props[]: prop
  content: { model: "none" | "text" | "flow" | "parts", required?, description? }
  parts[]: part
  template?: node                 # contract template; static, native and ui kinds
  state?[]: { name, type, attribute, defaultAttribute?, property?, reflects?[] }
  events?[]: { dom, react?, detail, bubbles, cancelable? }
  commands?[]: { command, description, data?[] }          # Invoker Commands, when the spec uses them
  fixtures[]: fixture             # at least 1
  noJs: { level: "full" | "degraded" | "none", behavior, fallbackHref?, hideUntilDefined?[] }
  a11y: { pattern, checkPattern?, name: { required, sources[] }, keyboard?[], focus?, announces?[] }
  agent: { surface: "accessibility-tree" | "bridge", component?, actions?[], confirm?[], secret?[] }
  dependencies: { components[], embeds?[], elements[], uiSdk?[], hydrogen?[], tokens?[], icons?[], locale?[] }
  liquid?: { block?, snippet?, partials?[], formDialect? }
  hydrogenHost?: { formDialect? }
  rules?[]: structureRule
  files: { shared[], html?[], react?[], remix?[], liquid?[] }

prop
  name (camelCase), type: "enum" | "scale" | "boolean" | "string" | "number" | "id" | "url" | "object"
  values[] (required for enum), scale (required for scale), objectType? ("<liquid drop> | <TS type>")
  default?, required?, responsive? (only enum or scale), attribute?
  liquid?: { name (snake_case), surface: "param" | "setting", settingType? }
  hosts?[] (only when the prop does not exist in every host), description

part
  name, component?, elements[], class, required, multiple?, authoredBy: "author" | "component", parent?, description?

fixture
  name, props, children?, parts?, html, hosts?[], mask?[], generated?: "template" | "upgrade-snapshot" | "hand"

structureRule
  id, kind: "requires-ancestor" | "forbids-ancestor" | "requires-descendant" | "requires-attribute" | "max-count" | "requires-sibling",
  selector?, target?, message, fix?

file
  source (path in the package's registry/), target (path in the project, may start with @components, @styles),
  type: "css" | "binding" | "block" | "snippet" | "asset" | "types" | "blueprint",
  mode?: "owned" | "patch", generated?: boolean

node (contract template)
  { tag, part?, when?, attrs[{ name, value?, when? }], children[node] }
  | { slot } | { text: value } | { embed: <component>, props?, children?, when? } | { host: <named host-owned region> }
  tag:   "div" | { prop } | { if: cond, then, else }
  value: "literal" | { prop, suffix? } | { t: <locale key> } | [value, ...]      # array = joined with one space, empty parts dropped
  cond:  { set: prop } | { true: prop } | { eq: [prop, value] } | { not: cond } | { all: [cond, ...] }
```

Constraints the schema enforces [RUN, each rejected in a negative test]: an `enum` prop without `values`; `responsive: true` on a boolean; an unknown `kind`; a non-camelCase prop name; a component without `noJs`; a `checkPattern` value that `@ui-sdk/core/testing` does not accept; a version range in `pins`; an empty `fixtures` array.

Constraints that need a build-time validator beyond JSON Schema (the spec MUST list them as build checks):

1. Every `scale` names a key of `scales`; every `dependencies.components` and `embeds` entry names a component; every `part.component` names a component whose `partOf` points back.
2. Every `liquid.name` is the snake_case of `name` and is not reserved (`true`, `false`, `nil`, `blank`, `empty`, `content`, `block`, `section`, `form`, `settings`, `for`; `liquid-blocks-partials.md` L-5).
3. At most 3 enumerated props with `liquid.surface: "setting"` per component.
4. Every enumerated prop has a `default` that is in `values`, unless `responsive` is true and the component CSS supplies the default.
5. `agent.surface` is `"bridge"` only for `kind` `ui` or `commerce`, and `agent.actions` is then non-empty or the entry is explicitly display-only.
6. `noJs.level` is `"none"` only for `kind: "ui"`. A `commerce` component is always `"full"` or `"degraded"`.
7. Every template `{ prop }` names a declared prop or `class`; every `slot` is `children` or a part name.
8. For `generated: "template"` fixtures, `html` equals the reference renderer's output (so nobody hand-edits it).
9. `a11y.name.required: "always"` implies a `rules` entry or a template attribute that provides the name.

### 4.3 Worked entries

Full JSON: `spike/manifest/components/button.json`, `stack.json`, `dialog.json`, `product-form.json`, assembled into `spike/manifest/ripple.manifest.json`. All four validate against the schema [RUN]. They are reproduced here in JSON5-style shorthand (repetitive arrays abbreviated with `...`); the files are the reference.

The contract content (which attributes, which elements) is owned by the other reports. These entries show how that content is recorded.

#### Button (kind `static`)

```jsonc
{
  "name": "button", "title": "Button", "category": "actions", "kind": "static", "status": "beta", "since": "0.1.0",
  "summary": "A button or a link that looks like a button. Zero JavaScript.",
  "useWhen": ["Submitting a form", "Navigating to a route with button styling (pass href)",
              "Triggering a command on another element (commandfor/command via attributes)"],
  "dontUseWhen": [
    { "case": "The control shows only an icon", "use": "icon-button" },
    { "case": "Inline text link inside a paragraph", "use": "link" },
    { "case": "Going to checkout", "use": "checkout-button" }
  ],
  "root": { "elements": ["button", "a"], "class": "rp-button" },
  "props": [
    { "name": "variant", "type": "enum", "values": ["primary", "secondary", "outline", "ghost", "link", "destructive"],
      "default": "primary", "attribute": "data-variant",
      "liquid": { "name": "variant", "surface": "setting", "settingType": "select" }, "description": "Visual treatment." },
    { "name": "size", "type": "enum", "values": ["sm", "md", "lg"], "default": "md", "attribute": "data-size",
      "liquid": { "name": "size", "surface": "setting", "settingType": "select" }, "description": "Control height and padding." },
    { "name": "type", "type": "enum", "values": ["button", "submit", "reset"], "default": "button", "attribute": "type",
      "liquid": { "name": "type", "surface": "param" }, "description": "Native button type. Ignored when href is set." },
    { "name": "href", "type": "url", "attribute": "href", "liquid": { "name": "href", "surface": "param" },
      "description": "When set, the root element is <a>." },
    { "name": "disabled", "type": "boolean", "default": false, "liquid": { "name": "disabled", "surface": "param" },
      "description": "Native disabled on <button>; aria-disabled=\"true\" and tabindex=\"-1\" on <a>." },
    { "name": "fullWidth", "type": "boolean", "default": false, "attribute": "data-full-width",
      "liquid": { "name": "full_width", "surface": "param" }, "description": "Stretch to the container width." },
    { "name": "name", "type": "string", "attribute": "name", "liquid": { "name": "name", "surface": "param" }, "description": "Form field name (button only)." },
    { "name": "value", "type": "string", "attribute": "value", "liquid": { "name": "value", "surface": "param" }, "description": "Form field value (button only)." },
    { "name": "ariaLabel", "type": "string", "attribute": "aria-label", "liquid": { "name": "aria_label", "surface": "param" },
      "description": "Accessible name. Required when the content has no text." },
    { "name": "id", "type": "id", "attribute": "id", "liquid": { "name": "id", "surface": "param" }, "description": "Root element id." }
  ],
  "content": { "model": "text", "required": true, "description": "The label. May include an icon." },
  "parts": [],
  "template": {
    "tag": { "if": { "set": "href" }, "then": "a", "else": "button" },
    "attrs": [
      { "name": "class", "value": ["rp-button", { "prop": "class" }] },
      { "name": "id", "value": { "prop": "id" }, "when": { "set": "id" } },
      { "name": "href", "value": { "prop": "href" }, "when": { "set": "href" } },
      { "name": "type", "value": { "prop": "type" }, "when": { "not": { "set": "href" } } },
      { "name": "name", "value": { "prop": "name" }, "when": { "all": [{ "set": "name" }, { "not": { "set": "href" } }] } },
      { "name": "value", "value": { "prop": "value" }, "when": { "all": [{ "set": "value" }, { "not": { "set": "href" } }] } },
      { "name": "disabled", "when": { "all": [{ "true": "disabled" }, { "not": { "set": "href" } }] } },
      { "name": "aria-disabled", "value": "true", "when": { "all": [{ "true": "disabled" }, { "set": "href" }] } },
      { "name": "tabindex", "value": "-1", "when": { "all": [{ "true": "disabled" }, { "set": "href" }] } },
      { "name": "data-variant", "value": { "prop": "variant" } },
      { "name": "data-size", "value": { "prop": "size" } },
      { "name": "data-full-width", "when": { "true": "fullWidth" } },
      { "name": "aria-label", "value": { "prop": "ariaLabel" }, "when": { "set": "ariaLabel" } }
    ],
    "children": [{ "slot": "children" }]
  },
  "fixtures": [
    { "name": "default", "props": {}, "children": "Add to cart", "generated": "template",
      "html": "<button class=\"rp-button\" type=\"button\" data-variant=\"primary\" data-size=\"md\">Add to cart</button>" },
    { "name": "submit-outline-lg", "props": { "variant": "outline", "size": "lg", "type": "submit", "name": "add" }, "children": "Add to cart", "generated": "template",
      "html": "<button class=\"rp-button\" type=\"submit\" name=\"add\" data-variant=\"outline\" data-size=\"lg\">Add to cart</button>" },
    { "name": "link", "props": { "href": "/cart" }, "children": "View cart", "generated": "template",
      "html": "<a class=\"rp-button\" href=\"/cart\" data-variant=\"primary\" data-size=\"md\">View cart</a>" },
    { "name": "link-disabled", "props": { "href": "/cart", "disabled": true }, "children": "View cart", "generated": "template",
      "html": "<a class=\"rp-button\" href=\"/cart\" aria-disabled=\"true\" tabindex=\"-1\" data-variant=\"primary\" data-size=\"md\">View cart</a>" },
    { "name": "invalid-enum-falls-back", "props": { "variant": "loud" }, "children": "Buy", "generated": "template",
      "html": "<button class=\"rp-button\" type=\"button\" data-variant=\"primary\" data-size=\"md\">Buy</button>" }
  ],
  "noJs": { "level": "full", "behavior": "Native <button> or <a>. Nothing to enhance." },
  "a11y": { "pattern": "native", "checkPattern": null,
    "name": { "required": "when-no-text", "sources": ["text content", "aria-label"] },
    "keyboard": [{ "keys": "Enter, Space", "does": "Activates (native)." }],
    "focus": "Focus ring from :focus-visible using --color-ring." },
  "agent": { "surface": "accessibility-tree" },
  "dependencies": { "components": [], "elements": [], "tokens": ["--color-primary", "--color-primary-foreground", "--radius-button", "--color-ring"] },
  "liquid": { "block": "button", "snippet": "rp-button" },
  "rules": [
    { "id": "no-interactive-descendant", "kind": "forbids-ancestor", "selector": ".rp-button", "target": "a, button",
      "message": "A Button is inside another link or button.",
      "fix": "Move the Button out, or make the outer element a non-interactive container." }
  ],
  "files": {
    "shared": [{ "source": "css/components/button.css", "target": "@styles/components/button.css", "type": "css", "generated": false }],
    "react":  [{ "source": "react/button.tsx", "target": "@components/button.tsx", "type": "binding", "generated": true }],
    "remix":  [{ "source": "remix/button.tsx", "target": "@components/button.tsx", "type": "binding", "generated": true }],
    "liquid": [
      { "source": "liquid/snippets/rp-button.liquid", "target": "snippets/rp-button.liquid", "type": "snippet", "generated": true },
      { "source": "liquid/blocks/button.liquid", "target": "blocks/button.liquid", "type": "block", "generated": true },
      { "source": "liquid/locales/button.json", "target": "locales/*.schema.json", "type": "asset", "mode": "patch", "generated": true }
    ]
  }
}
```

Notes. Token names are placeholders; the real names come from `styling-spike.md` and `base-theme.md` item 14. Button has `liquid.snippet` because other components embed it (`liquid-blocks-partials.md` L-3).

#### Stack (kind `static`, responsive props)

```jsonc
{
  "name": "stack", "title": "Stack", "category": "layout", "kind": "static", "status": "beta", "since": "0.1.0",
  "summary": "Vertical flex layout with a gap. Zero JavaScript.",
  "useWhen": ["Stacking children vertically with consistent spacing"],
  "dontUseWhen": [{ "case": "Children flow horizontally and wrap", "use": "inline" }, { "case": "Columns", "use": "grid" }],
  "root": { "elements": ["div", "section", "article", "aside", "header", "footer", "nav", "main", "ul", "ol"], "class": "rp-stack" },
  "props": [
    { "name": "tag", "type": "enum", "values": ["div", "section", "article", "aside", "header", "footer", "nav", "main", "ul", "ol"],
      "default": "div", "liquid": { "name": "tag", "surface": "param" }, "description": "Root element." },
    { "name": "gap", "type": "scale", "scale": "space", "responsive": true, "attribute": "data-gap",
      "liquid": { "name": "gap", "surface": "param" }, "description": "Space between children." },
    { "name": "align", "type": "enum", "values": ["start", "center", "end", "stretch", "baseline"], "responsive": true,
      "attribute": "data-align", "liquid": { "name": "align", "surface": "param" }, "description": "Cross-axis alignment." },
    { "name": "justify", "type": "enum", "values": ["start", "center", "end", "between"], "responsive": true,
      "attribute": "data-justify", "liquid": { "name": "justify", "surface": "param" }, "description": "Main-axis distribution." },
    { "name": "p", "type": "scale", "scale": "space", "responsive": true, "attribute": "data-p",
      "liquid": { "name": "p", "surface": "param" }, "description": "Padding on all sides." },
    { "name": "id", "type": "id", "attribute": "id", "liquid": { "name": "id", "surface": "param" }, "description": "Root element id." }
  ],
  "content": { "model": "flow", "required": false, "description": "Any elements." },
  "parts": [],
  "template": {
    "tag": { "prop": "tag" },
    "attrs": [
      { "name": "class", "value": ["rp-stack", { "prop": "class" }] },
      { "name": "id", "value": { "prop": "id" }, "when": { "set": "id" } },
      { "name": "data-gap", "value": { "prop": "gap" }, "when": { "set": "gap" } },
      { "name": "data-align", "value": { "prop": "align" }, "when": { "set": "align" } },
      { "name": "data-justify", "value": { "prop": "justify" }, "when": { "set": "justify" } },
      { "name": "data-p", "value": { "prop": "p" }, "when": { "set": "p" } }
    ],
    "children": [{ "slot": "children" }]
  },
  "fixtures": [
    { "name": "default", "props": {}, "children": "<p>One</p><p>Two</p>", "generated": "template",
      "html": "<div class=\"rp-stack\"><p>One</p><p>Two</p></div>" },
    { "name": "responsive-gap", "props": { "gap": "2 md:6", "align": "start" }, "children": "<p>One</p><p>Two</p>", "generated": "template",
      "html": "<div class=\"rp-stack\" data-gap=\"2 md:6\" data-align=\"start\"><p>One</p><p>Two</p></div>" },
    { "name": "list", "props": { "tag": "ul", "gap": "4" }, "children": "<li>One</li>", "generated": "template",
      "html": "<ul class=\"rp-stack\" data-gap=\"4\"><li>One</li></ul>" }
  ],
  "noJs": { "level": "full", "behavior": "CSS only." },
  "a11y": { "pattern": "none", "checkPattern": null, "name": { "required": "never", "sources": [] } },
  "agent": { "surface": "accessibility-tree" },
  "dependencies": { "components": [], "elements": [], "tokens": ["--spacing"] },
  "liquid": { "block": "stack" },
  "files": {
    "shared": [
      { "source": "css/components/stack.css", "target": "@styles/components/stack.css", "type": "css", "generated": false },
      { "source": "css/props.css", "target": "@styles/props.css", "type": "css", "generated": true }
    ],
    "react":  [{ "source": "react/stack.tsx", "target": "@components/stack.tsx", "type": "binding", "generated": true }],
    "remix":  [{ "source": "remix/stack.tsx", "target": "@components/stack.tsx", "type": "binding", "generated": true }],
    "liquid": [{ "source": "liquid/blocks/stack.liquid", "target": "blocks/stack.liquid", "type": "block", "generated": true }]
  }
}
```

Notes. The prop list is cut down (`px`, `py`, `wrap` omitted). A responsive prop's value is the string defined in `styling-spike.md` 1.1; the template prints it unchanged and the checker validates it (RP103).

#### Dialog (kind `ui`, parts, state, events, bridge)

```jsonc
{
  "name": "dialog", "title": "Dialog", "category": "overlays", "kind": "ui", "status": "beta", "since": "0.1.0",
  "summary": "A modal window over the page, opened by a trigger button.",
  "useWhen": ["Short, self-contained content that must interrupt: size guide, confirm, quick view"],
  "dontUseWhen": [
    { "case": "Panel sliding from a screen edge (cart, mobile menu)", "use": "drawer" },
    { "case": "Content that must be reachable when JavaScript never loads", "use": "a link to a page, or accordion" }
  ],
  "root": { "elements": ["ui-dialog"], "class": "rp-dialog", "requiresId": true },
  "props": [
    { "name": "id", "type": "id", "required": true, "attribute": "id", "liquid": { "name": "id", "surface": "param" },
      "description": "Unique, stable id. Part ids derive from it: <id>-trigger, <id>-title, <id>-description." },
    { "name": "defaultOpen", "type": "boolean", "default": false, "attribute": "default-open", "hosts": ["html", "react", "remix"],
      "description": "Open on first render. Not available in Liquid V1: the server cannot print open-state markup." },
    { "name": "open", "type": "boolean", "hosts": ["react"], "description": "Controlled open state (React only). Use with onOpenChange." }
  ],
  "content": { "model": "parts", "required": true },
  "parts": [
    { "name": "trigger", "component": "dialog-trigger", "elements": ["ui-dialog-trigger"], "class": "rp-dialog-trigger",
      "required": true, "multiple": true, "authoredBy": "author", "parent": "root", "description": "Wraps one native <button class=\"rp-button\">." },
    { "name": "backdrop", "elements": ["ui-dialog-backdrop"], "class": "rp-dialog-backdrop", "required": true, "authoredBy": "component", "parent": "root" },
    { "name": "content", "component": "dialog-content", "elements": ["ui-dialog-content"], "class": "rp-dialog-content", "required": true, "authoredBy": "author", "parent": "root" },
    { "name": "title", "component": "dialog-title", "elements": ["ui-dialog-title"], "class": "rp-dialog-title", "required": true, "authoredBy": "author", "parent": "content" },
    { "name": "description", "component": "dialog-description", "elements": ["ui-dialog-description"], "class": "rp-dialog-description", "required": false, "authoredBy": "author", "parent": "content" },
    { "name": "close", "elements": ["ui-dialog-close"], "class": "rp-dialog-close", "required": true, "authoredBy": "component", "parent": "content",
      "description": "Icon button printed by dialog-content; label from locale key dialog.close." }
  ],
  "template": {
    "tag": "ui-dialog",
    "attrs": [
      { "name": "id", "value": { "prop": "id" } },
      { "name": "class", "value": ["rp-dialog", { "prop": "class" }] },
      { "name": "default-open", "when": { "true": "defaultOpen" } }
    ],
    "children": [{ "slot": "children" }]
  },
  "state": [{ "name": "open", "type": "boolean", "attribute": "default-open", "defaultAttribute": "default-open", "property": "open",
              "reflects": ["data-open", "data-closed", "hidden"] }],
  "events": [{ "dom": "openchange", "react": "onOpenChange", "detail": "{ value: boolean, reason: string, source: string }", "bubbles": false, "cancelable": true }],
  "fixtures": [
    { "name": "closed", "props": { "id": "size-guide" }, "generated": "upgrade-snapshot",
      "parts": { "trigger": "Size guide", "title": "Size guide", "content": "<p>Measure your foot.</p>" },
      "html": "<ui-dialog id=\"size-guide\" class=\"rp-dialog\"><ui-dialog-trigger class=\"rp-dialog-trigger\"><button type=\"button\" id=\"size-guide-trigger\" class=\"rp-button\" data-variant=\"link\" data-size=\"md\" aria-haspopup=\"dialog\" data-closed data-slot=\"dialog-trigger\">Size guide</button></ui-dialog-trigger><ui-dialog-backdrop class=\"rp-dialog-backdrop\" hidden data-slot=\"dialog-backdrop\"></ui-dialog-backdrop><ui-dialog-content class=\"rp-dialog-content\" hidden data-slot=\"dialog-content\"><ui-dialog-title id=\"size-guide-title\" class=\"rp-dialog-title\" role=\"heading\" aria-level=\"2\" data-slot=\"dialog-title\">Size guide</ui-dialog-title><p>Measure your foot.</p><ui-dialog-close class=\"rp-dialog-close\"><button type=\"button\" class=\"rp-icon-button\" aria-label=\"Close\" data-slot=\"dialog-close\"></button></ui-dialog-close></ui-dialog-content></ui-dialog>" }
  ],
  "noJs": { "level": "none", "hideUntilDefined": [],
    "behavior": "The trigger does nothing and the content stays hidden. Do not put required content only in a Dialog. For an opener with a page equivalent, use a plain link (see drawer / cart-drawer)." },
  "a11y": { "pattern": "dialog (modal)", "checkPattern": "dialog",
    "name": { "required": "always", "sources": ["dialog-title (aria-labelledby is wired by ui-dialog)"] },
    "keyboard": [{ "keys": "Escape", "does": "Closes and returns focus to the trigger." },
                 { "keys": "Tab, Shift+Tab", "does": "Cycle inside the dialog; the page behind is inert." }],
    "focus": "On open, focus moves into the content. On close, focus returns to the trigger." },
  "agent": { "surface": "bridge", "component": "dialog",
    "actions": [
      { "name": "setOpen", "args": [{ "name": "open", "type": "boolean" }], "description": "Open or close the dialog." },
      { "name": "press", "args": [{ "name": "buttonText", "type": "string" }], "description": "Press a button inside the dialog by its text; opens the dialog first." }
    ] },
  "dependencies": { "components": ["button", "icon-button", "icon"], "embeds": ["button", "icon-button"],
    "elements": ["ui-dialog", "ui-dialog-trigger", "ui-dialog-backdrop", "ui-dialog-content", "ui-dialog-title", "ui-dialog-description", "ui-dialog-close"],
    "uiSdk": ["@ui-sdk/web/dialog"], "tokens": ["--color-overlay", "--radius-card", "--ease-drawer"], "icons": ["x"], "locale": ["dialog.close"] },
  "liquid": { "block": "dialog" },
  "rules": [
    { "id": "dialog-needs-title", "kind": "requires-descendant", "selector": "ui-dialog.rp-dialog", "target": "ui-dialog-title",
      "message": "A Dialog has no title, so it has no accessible name.", "fix": "Add a dialog-title part inside dialog-content." },
    { "id": "dialog-not-in-form", "kind": "forbids-ancestor", "selector": "ui-dialog.rp-dialog:has(form)", "target": "form",
      "message": "A Dialog that contains a form is inside another form.", "fix": "Move the Dialog outside the outer form." },
    { "id": "dialog-content-hidden", "kind": "requires-attribute", "selector": "ui-dialog:not([default-open]) > ui-dialog-content", "target": "hidden",
      "message": "Closed dialog content is not hidden in server HTML; it shows until JavaScript loads.",
      "fix": "Use the dialog-content binding instead of hand-written markup." }
  ],
  "files": {
    "shared": [{ "source": "css/components/dialog.css", "target": "@styles/components/dialog.css", "type": "css", "generated": false }],
    "react":  [{ "source": "react/dialog.tsx", "target": "@components/dialog.tsx", "type": "binding", "generated": true }],
    "remix":  [{ "source": "remix/dialog.tsx", "target": "@components/dialog.tsx", "type": "binding", "generated": true }],
    "liquid": [
      { "source": "liquid/blocks/dialog.liquid", "target": "blocks/dialog.liquid", "type": "block", "generated": true },
      { "source": "liquid/blocks/dialog-trigger.liquid", "target": "blocks/dialog-trigger.liquid", "type": "block", "generated": true },
      { "source": "liquid/blocks/dialog-content.liquid", "target": "blocks/dialog-content.liquid", "type": "block", "generated": true },
      { "source": "liquid/blocks/dialog-title.liquid", "target": "blocks/dialog-title.liquid", "type": "block", "generated": true },
      { "source": "liquid/locales/dialog.json", "target": "locales/*.json", "type": "asset", "mode": "patch", "generated": true }
    ]
  }
}
```

Notes.

- The fixture is the closed-state, post-upgrade markup of `uisdk-web-elements.md` 3.2 with `rp-` classes, as required by `react-and-custom-elements.md` section 8 item 2. Its `generated` value is `"upgrade-snapshot"`: it is produced by loading author markup in Chromium and serialising after upgrade, not by the template renderer.
- The agent action names `setOpen` and `press` are what the bridge offered for UI SDK components in [RUN] (`press` on the button; `setOpen` is named in `agentTools`' description). The exact action list `snapshot()` reports for `ui-dialog` was not captured: UNVERIFIED, and the manifest build SHOULD assert it with a test.
- Each author-callable part (`dialog-trigger`, `dialog-content`, `dialog-title`, `dialog-description`) is its own manifest entry with `partOf: "dialog"` and its own template and fixtures. They are not shown.
- If the spec chooses native `<dialog>`: `kind` becomes `"native"`, `root.elements` becomes `["dialog"]`, `dependencies.uiSdk` empties, `agent.surface` becomes `"accessibility-tree"`, `commands` lists `show-modal` and `close`, and `noJs.level` stays `"none"` unless openers are links. No schema change.

#### ProductForm (kind `commerce`, host-owned form internals)

```jsonc
{
  "name": "product-form", "title": "ProductForm", "category": "product", "kind": "commerce", "status": "beta", "since": "0.1.0",
  "summary": "The add-to-cart form for one product. Works as a plain form post; enhanced through the Hydrogen cart store.",
  "useWhen": ["Selling one product: wraps quantity, selling plan and the submit button"],
  "dontUseWhen": [
    { "case": "Choosing options/variants", "use": "variant-picker (outside the form; option values are links)" },
    { "case": "Changing a line already in the cart", "use": "cart-line" }
  ],
  "root": { "elements": ["rp-product-form"], "class": "rp-product-form" },
  "props": [
    { "name": "product", "type": "object", "objectType": "product | ProductInput", "required": true,
      "liquid": { "name": "product", "surface": "param" }, "description": "The product being sold." },
    { "name": "variant", "type": "object", "objectType": "variant | ProductVariant",
      "liquid": { "name": "variant", "surface": "param" }, "description": "Selected variant. Default: the selected or first available variant." },
    { "name": "acceleratedCheckout", "type": "boolean", "default": false,
      "liquid": { "name": "accelerated_checkout", "surface": "param" }, "description": "Print accelerated checkout buttons after the body." },
    { "name": "id", "type": "id", "attribute": "id", "liquid": { "name": "id", "surface": "param" }, "description": "Id of the inner <form>." }
  ],
  "content": { "model": "flow", "required": true,
    "description": "Form controls and exactly one submit Button. In Liquid the submit Button MUST have name: 'add'." },
  "parts": [
    { "name": "fields", "elements": ["form"], "class": "rp-product-form-fields", "required": true, "authoredBy": "component", "parent": "root",
      "description": "The native form. action, method and hidden inputs are host-owned." },
    { "name": "error", "elements": ["p"], "class": "rp-form-message", "required": true, "authoredBy": "component", "parent": "fields",
      "description": "role=\"alert\", hidden until an add fails." }
  ],
  "state": [
    { "name": "pending", "type": "boolean", "attribute": "data-pending", "reflects": ["data-pending", "aria-busy"] },
    { "name": "unavailable", "type": "boolean", "attribute": "data-unavailable", "reflects": ["data-unavailable"] }
  ],
  "events": [{ "dom": "add", "react": "onAdd", "detail": "{ merchandiseId: string, quantity: number }", "bubbles": false, "cancelable": true }],
  "fixtures": [
    { "name": "available", "props": { "product": "$fixture:product.snowboard", "id": "pf" }, "generated": "hand",
      "children": "<button class=\"rp-button\" type=\"submit\" name=\"add\" data-variant=\"primary\" data-size=\"md\">Add to cart</button>",
      "mask": ["form[action]", "form[method]", "form > input[type=hidden]", "[data-product-id]"],
      "html": "<rp-product-form class=\"rp-product-form\" data-product-id=\"MASKED\"><form id=\"pf\" class=\"rp-product-form-fields\" action=\"MASKED\" method=\"MASKED\"><input type=\"hidden\" data-rp-field=\"merchandise-id\" name=\"MASKED\" value=\"MASKED\"><button class=\"rp-button\" type=\"submit\" name=\"add\" data-variant=\"primary\" data-size=\"md\">Add to cart</button><p class=\"rp-form-message\" data-rp-part=\"error\" data-tone=\"critical\" role=\"alert\" hidden></p></form></rp-product-form>" }
  ],
  "noJs": { "level": "full",
    "behavior": "The inner form posts to the host cart endpoint (Liquid: /cart/add with id; Hydrogen host: /api/cart with merchandiseId) and the browser navigates. If ripple.js fails to load or the cart store cannot be created, the element MUST NOT call preventDefault()." },
  "a11y": { "pattern": "native", "checkPattern": null, "name": { "required": "never", "sources": [] },
    "announces": ["\"Added to cart\" via announce() after a confirmed add", "error text in the role=\"alert\" part"] },
  "agent": { "surface": "bridge", "component": "rp-product-form",
    "actions": [
      { "name": "setQuantity", "args": [{ "name": "quantity", "type": "number" }], "description": "Set the quantity field." },
      { "name": "add", "description": "Add the selected variant to the cart (same path as submitting the form)." }
    ],
    "confirm": [{ "part": "accelerated checkout buttons", "sentence": "Buys this product now with accelerated checkout" }] },
  "dependencies": { "components": ["button", "form-message"], "embeds": ["form-message"], "elements": ["rp-product-form"],
    "hydrogen": ["createCartStore", "CartStore.handleFormSubmit"], "tokens": [], "locale": ["product_form.added", "product_form.error"] },
  "liquid": { "block": "product-form",
    "formDialect": { "variant": "id", "quantity": "quantity", "sellingPlan": "selling_plan", "lineProperty": "properties[<key>]", "submit": "button[name=\"add\"]" },
    "partials": [{ "name": "cart-lines", "refreshedBy": "rp-cart", "on": "cart store confirms a change" }] },
  "hydrogenHost": { "formDialect": { "variant": "merchandiseId", "quantity": "quantity", "sellingPlan": "sellingPlanId",
    "lineProperty": "attributes.<key>", "submit": "button[name=\"intent\"][value=\"add\"] or bare submit" } },
  "rules": [
    { "id": "product-form-one-submit", "kind": "requires-descendant", "selector": "rp-product-form", "target": "button[type=submit]",
      "message": "A ProductForm has no submit button, so nothing can be added to the cart.", "fix": "Put one Button with type submit inside the ProductForm." },
    { "id": "variant-picker-outside-form", "kind": "forbids-ancestor", "selector": ".rp-variant-picker", "target": "rp-product-form form",
      "message": "A VariantPicker is inside the ProductForm form. Option values are links and must not submit with the form.",
      "fix": "Render VariantPicker as a sibling before ProductForm." }
  ],
  "files": {
    "shared": [{ "source": "css/components/product-form.css", "target": "@styles/components/product-form.css", "type": "css", "generated": false }],
    "react":  [{ "source": "react/product-form.tsx", "target": "@components/product-form.tsx", "type": "binding", "generated": false }],
    "remix":  [{ "source": "remix/product-form.tsx", "target": "@components/product-form.tsx", "type": "binding", "generated": false }],
    "liquid": [
      { "source": "liquid/blocks/product-form.liquid", "target": "blocks/product-form.liquid", "type": "block", "generated": false },
      { "source": "liquid/locales/product-form.json", "target": "locales/*.json", "type": "asset", "mode": "patch", "generated": true }
    ]
  }
}
```

Notes.

- There is no `template`: the markup contains host-owned form internals, so bindings are hand-written (`generated: false`) and the fixture is hand-written with a `mask`. The two form dialects are recorded as data (`hydrogen-core.md` section 4, S6 to S9). The markup follows `liquid-blocks-partials.md` 5.5.
- The agent actions are the ones the spike element exposed and that worked through `act()` [RUN]. They follow Tobi's `product.ts` (`setQuantity`, `add`). Variant selection is not an action here because option values are links (`hydrogen-core.md` S14).
- The `confirm` entry is a requirement on the markup, and it is enforceable only if the control is visible to the bridge (section 8.3).

---

## 5. Generated versus hand-written

### 5.1 The contract template: verified for static components

`spike/gen/emit.mjs` holds three emitters over the `node` tree of 4.2:

1. `renderHtml(component, props, children)`: the reference renderer. It defines the fixtures. It normalises props first: an enumerated prop whose value is not in `values` becomes the default; a boolean prop is true only for the boolean `true`.
2. `emitLiquid(component)`: the Liquid body, with the allow-list guard for every enumerated prop (`assign allowed_x = '...' | split: ','` / `unless allowed_x contains x`), `== true` tests for booleans, `| escape` on every printed prop, and both branches written out for a conditional tag.
3. `emitReact(component)`: a TSX component with a typed props interface, the same enumeration guard (`oneOf`), `className`/`tabIndex` mapping, `""` for presence attributes and `undefined` for absent ones.

[RUN] `spike/gen/test.mjs`: for Button (7 cases) and Stack (3 cases), the canonical HTML (the canonicaliser of the Liquid spike, `spikes/liquid/canon.mjs`) from the reference renderer, from liquidjs rendering the emitted Liquid, and from `react-dom/server` rendering the emitted TSX were equal in all 10 cases: `{ pass: 10, fail: 0 }`. Cases include `variant: 'loud'` (falls back), `disabled: 'false'` (not true), `tag: 'script'` (falls back), special characters in `ariaLabel` and a query string in `href`.

Limits of this evidence:

- Only two static components. The `embed` and `host` node kinds, `{ t }` values and `eq` conditions are in the schema but not exercised.
- The emitted code is correct but not yet idiomatic: the conditional-tag case prints dead branches in Liquid (`{% if href != blank %}href=...{% endif %}` inside the `<button>` branch), and the React emitter casts the tag type. The generator needs constant folding per branch before its output is good enough to scaffold into projects ("readable, idiomatic source", `remix-3.md` section 12).
- The Remix emitter was not written. Per `remix-3.md` section 12 it differs from React by a fixed substitution table.
- liquidjs is not Shopify Liquid (`liquid-blocks-partials.md` 9.2).

Recommendation: adopt the template for `static` components in milestone "foundations" (roughly half of the inventory by `uisdk-web-elements.md` 9.1). For `ui` components, generate the root and static parts from templates and keep the fixture as an upgrade snapshot. For `commerce` components, hand-write bindings and use `{ host: ... }` only after a second spike proves it. This keeps the template language at three condition forms and three value forms. The spec MUST NOT let it grow loops or expressions; a component that needs them is hand-written.

### 5.2 Liquid doc, schema and types: verified

`spike/gen/from-manifest.mjs` generates, from `manifest.json`:

- `blocks/<name>.liquid`: `{% doc %}` (summary, settings listed in the description, one `@param` per code-level prop with a union type for non-responsive enumerations, `class`, `attributes`, `content`, one `@example` from the first fixture), the body or a `{% render %}` of the snippet, `{% schema %}` with `select` settings whose option values are the prop tokens and whose labels are `t:ripple.*` keys, and the provenance trailer.
- `snippets/rp-<name>.liquid` when the component is embedded by others.
- `<Title>Props` TypeScript interfaces with `Responsive<...>` for responsive props and JSDoc from descriptions.
- A Markdown page per component (summary, kind, no-JS level, a11y pattern, agent surface, use/avoid lists, props table, fixtures).

[RUN] Theme Check 4.0.2 (`theme-check:recommended`) on a theme containing the generated `button` and `stack` files reported no offence in those files. On deliberately wrong calls it reported exactly (`spike/gen/theme-check.txt`):

```
warning UnrecognizedBlockArguments templates/index.liquid:4 Unknown argument 'colour' in block tag for 'button'.
warning ValidBlockArgumentTypes templates/index.liquid:5 Invalid value for argument 'type': expected 'button' | 'submit' | 'reset', got 'sumbit'
warning ValidBlockArgumentTypes templates/index.liquid:6 Type mismatch for argument 'gap': expected string, got number
```

and nothing for `size: 'huge'`, `gap: '2 md:99'`, `align: 'middle'` on the same lines.

### 5.3 The split

| Artifact | Generated from the manifest | Hand-written |
|---|---|---|
| Manifest component JSON, templates, rules, a11y and agent data | | yes (the source) |
| `manifest.json`, `manifest.schema.json` in the package | yes (assembled, validated) | |
| TypeScript prop types, `Responsive<T>`, JSX `IntrinsicElements` for `rp-*` and `ui-*` | yes | |
| Liquid `{% doc %}`, `{% schema %}`, enumeration guards, schema locale keys | yes | |
| Binding bodies for `static` components (React, Remix, Liquid, plain HTML snippet) | yes (5.1) | |
| Binding wiring for `ui` components in React (`useElement`, events, controlled state) | later, from `state` and `events` tables (`react-and-custom-elements.md` section 8 item 9) | yes in milestone 1 |
| Bindings for `commerce` components, host-owned regions | | yes |
| `rp-*` elements (`definePrimitive` + `createParts`), Hydrogen adapters | | yes |
| Component CSS, `tokens.css`, `base.css` | | yes |
| `props.css` (responsive attribute selectors) | yes, from `scales` (`styling-spike.md` 1.2) | |
| Pre-upgrade `display` rules for `ui-*`/`rp-*` tags | yes, from the installed UI SDK (`uisdk-web-elements.md` 9.4) | |
| Fixtures, `generated: "template"` | yes (reference renderer) | |
| Fixtures, `generated: "upgrade-snapshot"` | yes (headless browser; `react-and-custom-elements.md` item 3) | |
| Fixtures, `generated: "hand"` (commerce) | | yes |
| `docs/components/<name>.md`, `docs/INDEX.md`, `docs/llms.txt`, `docs/rules/<id>.md` | yes | |
| `custom-elements.json`, `html-custom-data.json` | yes (as `@ui-sdk/web` ships them) | |
| Checker tables (enumerations, structure rules, name rules, part trees) | yes (the checker reads `manifest.json` at run time) | |
| Checker engine and rule code | | yes |
| Registry index (which files per host per component) | yes | |
| The Ripple section of `AGENTS.md`; the component index table inside skills | yes, between markers | |
| Skills prose, guides, blueprints, eval tasks | | yes |

Build rule: every generated artifact in the Ripple repository is produced by one command (`pnpm gen`) and CI runs `pnpm gen --check`, which writes nothing and fails when any committed output differs. UI SDK does this for its perf catalog (`pnpm docs:perf --check`, `uisdk/tests/README.md`) and Remix does it with `manifest.test.ts`.

Generated files that are scaffolded into a project carry no "do not edit" banner: in the project they are the user's files (decision 5).

---

## 6. Registry and CLI

### 6.1 Terms

- **Registry**: the directory `registry/` inside the npm package. It holds every scaffoldable file for every host, addressed by the `files[].source` paths of the manifest. There is no network registry: the installed (or `npx`-fetched) package version **is** the registry version. This is what makes one version number determine elements, CSS, bindings and fixtures together.
- **Owned file**: a file Ripple writes whole (`mode: "owned"`). It ends with a provenance trailer.
- **Patch**: a keyed insertion into a file the project owns (`mode: "patch"`): an import line, a locale subtree, a marker region.
- **Upstream body**: the content of an owned file as shipped by a given package version, without the trailer.

### 6.2 Provenance trailer (the lock record)

Every owned file ends with exactly one trailer line, written by the CLI:

| File type | Trailer |
|---|---|
| `.liquid` | `{% comment %} ripple <id> <pkg>@<version> sha256:<64 hex> {% endcomment %}` |
| `.css`, `.ts`, `.tsx`, `.js` | `/* ripple <id> <pkg>@<version> sha256:<64 hex> */` |
| `SKILL.md` | Hydrogen's frontmatter form: `metadata:` / `source` / `version` / `hash` (2.1), so both tools' skills look the same |

- `<id>` is `<component>/<file key>`, for example `button/block`, `button/css`, `dialog/block:dialog-title`. It is stable across renames of the target path.
- `<version>` and the hash describe the **upstream body this file derives from**, never the local content. After a merge the trailer names the new upstream version and the new upstream hash, so the file still reads as "modified relative to that version" and the next merge has the right base.
- Hash input: the upstream body with CRLF normalised to LF, UTF-8, SHA-256. (Hydrogen normalises line endings the same way so that a checkout through git autocrlf still verifies.)
- `modified` is computed, not stored: `sha256(local body without trailer) !== trailer hash`.
- The regular expression MUST accept any package name (`\S+@`), so a later rename of the package does not orphan installed files.

Verified: a generated block file with the trailer after `{% endschema %}` produced no Theme Check offence [RUN]; a CRLF checkout of an unmodified file is still read as unmodified [RUN `spike/merge/upgrade-result.txt`].

Why not a lockfile: in a theme it cannot be stored (conclusion 1); in every host a second record can disagree with the files. With trailers, deleting a file uninstalls it, copying a file between projects keeps its provenance, and a file whose trailer was removed is simply `unmanaged`.

### 6.3 Lock format (computed, never stored)

`ripple status --json` prints the lock, computed by scanning for trailers. It is the format other tools and the eval harness read. The CLI MUST NOT write it to disk in V1.

```json
{
  "lockVersion": 1,
  "package": { "name": "ripple-kit", "installed": "0.2.0", "source": "node_modules" },
  "host": "liquid",
  "prefix": { "css": "rp-", "element": "rp-", "liquidFile": "" },
  "components": {
    "button": {
      "state": "modified",
      "files": [
        { "id": "button/snippet", "path": "snippets/rp-button.liquid", "version": "0.1.0",
          "upstream": "sha256:3893...", "local": "sha256:3893...", "state": "current" },
        { "id": "button/css", "path": "assets/ripple/button.css", "version": "0.1.0",
          "upstream": "sha256:77aa...", "local": "sha256:c01d...", "state": "modified" }
      ]
    }
  },
  "patches": [
    { "id": "init/styles-import", "path": "config/styles.css", "state": "present" },
    { "id": "init/agents-section", "path": "AGENTS.md", "state": "stale" }
  ],
  "unmanaged": ["blocks/price.liquid"],
  "skills": { "version": "0.2.0", "pending": { "add": 0, "update": 2, "remove": 0, "modified": 0 }, "conflicts": [] }
}
```

`package.source` is `"node_modules"` when the package resolves from the project, else `"npx"`. File `state` is one of `current` (unmodified, same hash as the running package ships), `outdated` (unmodified, package ships a different body), `modified`, `modified-outdated`. `unmanaged` lists files at a path the registry would write that have no trailer. The `skills` object is Hydrogen's `SkillsSyncStatus` shape (2.1).

### 6.4 Host detection

Evaluated in this order; the first match wins; nothing is guessed.

1. `--host <html|react|remix|liquid>` flag.
2. `ripple.json` at the project root with a `host` key (npm hosts only; see 6.5).
3. **Liquid theme**: the working directory contains `layout/theme.liquid` and `templates/` and `config/settings_schema.json`. No `package.json` is needed. Within Liquid:
   - `sections/` exists or any `templates/*.json` exists: stop with an error that names the block-first architecture as a requirement (`ripple/theme/AGENTS.md` non-negotiables). V1 supports only themes built with `{% block %}`.
   - `config/styles.css` exists and contains `@import "tailwindcss"`: **compiled mode** (Ripple CSS is patched into `config/styles.css`; `ripple/theme/config/styles.css` line 1). Otherwise **precompiled mode** (`assets/ripple.css`).
4. `package.json` exists: `dependencies` or `devDependencies` contains `remix` (major 3) → `remix`; else contains `react` → `react`; else → `html`.
5. Otherwise: error `No host detected. Run from a theme root or an app root, or pass --host.`

Package manager detection, where a dependency must be installed: copy Hydrogen's order (`packageManager` field, lockfiles, `npm_config_user_agent`, default npm; `hydrogen/packages/hydrogen/src/cli/setup.ts`).

### 6.5 Configuration

- npm hosts: `ripple.json` at the project root, written by `init`. It holds configuration only, never hashes.

  ```json
  {
    "$schema": "./node_modules/ripple-kit/config.schema.json",
    "host": "react",
    "paths": { "components": "app/components/ripple", "styles": "app/styles/ripple" },
    "css": "app/app.css",
    "prefix": { "css": "rp-", "element": "rp-" }
  }
  ```

- Liquid: no configuration file. The host is detected, target paths are fixed by the theme architecture, and the file prefix is read from the trailers of installed files (first install: `--prefix` flag, default none).

### 6.6 Commands

General rules, taken from Hydrogen's CLI: built-in `node:util` `parseArgs` with `strict: true`; never prompt unless `process.stdin.isTTY` and `CI` is unset, and every prompt has a flag; errors are one line plus the fix; exit code 0 success, 1 problems found or conflicts, 2 usage error. Every command that writes first computes a complete plan, prints it, aborts before writing anything if the plan contains an `unmanaged` collision, then writes each file to a temporary name and renames it.

| Command | Behaviour |
|---|---|
| `ripple init [--host h] [--prefix p] [--yes]` | Detect host. Install base files (`tokens.css`, `base.css`, `props.css`, layer declaration, head snippet or CSS imports). Apply patches (table below). Add `@shopify/hydrogen` and the package itself to `package.json` when missing (npm hosts). Run `skills sync`. Write or refresh the Ripple section of `AGENTS.md`. Print next steps. Idempotent: a second run reports `unchanged`. |
| `ripple add <component...>` | Resolve `dependencies.components` transitively. For each file of the host plus `shared`: decide with the table in 6.7 (`absent` → add). Apply the component's patches (locale keys). Refresh `AGENTS.md` section. `--all` installs everything; on Liquid it stops with RP405 if the block-file budget would be exceeded. `--blueprint <name>` installs a blueprint and its components. `--dry-run` prints the plan. `--diff` prints, for each file that exists, the unified diff between the local file and the body the package ships (shadcn's `add --diff`). |
| `ripple diff [component...]` | Read-only. For each owned file: state and a unified diff of local against the upstream body of the **running** package. When the base version is fetchable, also says which hunks are the user's and which are upstream's. |
| `ripple upgrade [component...] [--dry-run] [--ours] [--theirs] [--write-conflicts] [--force]` | For every installed owned file, apply 6.7. Re-apply patches. Run `skills sync`. Exit 1 when any file is left in `merge-conflict` or `needs-base`. |
| `ripple remove <component...>` | Delete owned files that are unmodified; list modified ones and stop unless `--force`. Refuse when another installed component depends on it. |
| `ripple status [--json]` | Print the computed lock (6.3). |
| `ripple check [paths...] [--json] [--url u] [--browser] [--rule id] [--max-warnings n]` | Section 7. |
| `ripple docs [component] [--host h]` | Print `docs/components/<name>.md` for the detected host; with no argument print `docs/INDEX.md`. `ripple docs --rule RP101` prints the rule page. |
| `ripple manifest [component]` | Print manifest JSON. |
| `ripple skills sync [--force]`, `ripple skills check [--mode error|warn]` | Hydrogen's algorithm and messages (2.1), with `source: "<pkg>"`, only for skills whose `hosts` include the detected host. |

Patches applied by `init` and `add`:

| Target | Mechanism | Liquid | npm hosts |
|---|---|---|---|
| CSS entry | marker region `/* ripple:start */ ... /* ripple:end */` holding the layer declaration and one `@import` per installed component file; the region is regenerated on every `add`/`upgrade`; content outside is untouched | `config/styles.css` (compiled mode) | `ripple.json` `css` |
| Head | one line `{% render 'rp-head' %}` inserted after the import-map render and before `{{ content_for_header }}`; `snippets/rp-head.liquid` is an owned file (`liquid-blocks-partials.md` 7.2) | `layout/theme.liquid` | document shell: printed as an instruction, not edited |
| Import map | one line `{% render 'rp-import-map-entries' %}` inside the `"imports"` object of the existing map, placed first; the snippet is owned and prints complete `"key": "value",` lines | `snippets/import-map.liquid` | none |
| Locales | JSON merge under the single top-level key `ripple`: add missing keys; never change an existing value | every `locales/*.json` and `locales/*.schema.json` present | none |
| Theme settings | one settings group whose `name` is `t:ripple.settings.name`; added when missing, replaced as a whole when present | `config/settings_schema.json` | none |
| `AGENTS.md` | marker region `<!-- ripple:start -->` ... `<!-- ripple:end -->` (same technique as `DESIGN.md`'s `design-tokens:generated` region) | theme root | project root |
| `package.json` | add dependencies | none | yes |

A patch target that cannot be located (no import map, no `content_for_header`) is not guessed: the command prints the exact line to add and where, and `check` reports it (RP510) until it is present.

Whether Liquid comments or a `{% render %}` are tolerated inside the JSON of a `<script type="importmap">` on Shopify is UNVERIFIED (the rendered output is valid JSON; Theme Check was not run on that case).

### 6.7 Upgrade decision table and three-way merge

Inputs per owned file: `local` (file text in the project, or absent), `next` (body shipped by the running package), `base` (body shipped by the version named in the trailer; fetched only when needed).

| # | Local state | Condition | Action | Writes |
|---|---|---|---|---|
| 1 | absent | | `add` | `next` + trailer(next) |
| 2 | no trailer | | `conflict-unmanaged`; abort the run. With `--force`: `overwrite` | |
| 3 | unmodified | `hash(next)` equals trailer hash | `unchanged` | nothing |
| 4 | unmodified | differs | `update` | `next` + trailer(next) |
| 5 | modified | `hash(local body)` equals `hash(next)` | `restamp` | `next` + trailer(next) |
| 6 | modified | `--theirs` or `--force` | `overwrite` | `next` + trailer(next) |
| 7 | modified | `--ours` | `keep-local`, restamp only | local body + trailer(next) |
| 8 | modified | base cannot be fetched, or its hash differs from the trailer hash | `needs-base`; file untouched; exit 1 | nothing |
| 9 | modified | `hash(base)` equals `hash(next)` | `keep-local` | nothing |
| 10 | modified | merge is clean | `merged` | merged body + trailer(next) |
| 11 | modified | merge has conflicts | `merge-conflict`; file untouched; print the conflict hunks; exit 1. With `--write-conflicts`: write the merged text with markers + trailer(next) | see left |

Rows 1, 2, 4, 5, 8, 9, 10, 11 were run in the prototype [RUN `spike/merge/upgrade-result.txt`].

Rules:

- Files of type `blueprint` use only rows 1 to 5 and 9; a modified blueprint is always `keep-local`. A blueprint is a starting point and is expected to diverge.
- Conflict markers are never written by default, because a Liquid file with markers breaks the storefront if it is pushed. Rule RP511 fails `check` when any file contains `<<<<<<< yours`.
- Obtaining `base`: (a) a cache directory `<os cache dir>/ripple/<pkg>/<version>/`; (b) `npm pack <pkg>@<version>` into that cache (npm is present whenever `npx` was used); (c) otherwise row 8. Unmodified files never need a base, so an offline upgrade of an untouched project always succeeds.
- An owned file the new package no longer ships: unmodified → remove; modified → keep and report (Hydrogen's orphan rule, non-interactive default "keep").

Merge algorithm (`spike/merge/diff3.mjs`, 69 lines, zero dependencies):

1. Split `base`, `ours` (local body), `theirs` (`next`) into lines after normalising CRLF to LF and removing one trailing newline.
2. Compute the longest common subsequence of lines between `base` and `ours`, and between `base` and `theirs` (dynamic programming over a `Uint32Array`; if either file has more than 5,000 lines, treat the whole file as one conflict).
3. From each LCS derive hunks `[baseStart, baseEnd, otherStart, otherEnd)` where the other side differs from base.
4. Sort all hunks of both sides by `baseStart`. Walk them, grouping into one **region** every hunk whose `baseStart` is less than **or equal to** the current region's `baseEnd`. (Two hunks of the same side never touch, so touching hunks come from different sides.)
5. For each region take the base lines, the `ours` lines and the `theirs` lines covering it. If only one side changed, emit that side. If both changed to identical lines, emit them once. Otherwise it is a conflict: emit `<<<<<<< yours`, ours, `||||||| installed`, base, `=======`, theirs, `>>>>>>> upstream`.
6. Emit unchanged base lines between regions.

[RUN] against `git merge-file -p --diff3` on 2,000 generated cases (5 to 45 lines, 0 to 3 random edits per side): 1,602 clean merges byte-identical to git, 398 conflicts in both, 0 cases where the two disagree on whether a conflict exists. With step 4 written as "less than" (touching hunks not grouped), 199 cases merged cleanly where git reports a conflict. Those are adjacent-line edits (a user changes a line and upstream inserts a line next to it), where a silent merge is not safe. The spec MUST use "less than or equal to".

The implementation MUST be this built-in algorithm, not a shell-out to git: one code path, and git may be absent.

### 6.8 Liquid themes with no `package.json`

Verified pattern: `npx <pkg> <command>` in a directory with no `package.json` runs the CLI from the npx cache, and the CLI resolves its own package root when the project has none [RUN with Hydrogen, 2.1].

- All commands are `npx ripple-kit@<version> <command>`. `init` prints the pinned form so that later runs use the same version until the developer chooses to upgrade: `npx ripple-kit@0.2.0 check`.
- `upgrade` on a theme: `npx ripple-kit@latest upgrade`. The running CLI is "next"; trailers name the base; bases for modified files come from `npm pack`.
- JavaScript and CSS are prebuilt files copied to `assets/` as owned files (`ripple.js`, `ripple.css`, or one module per element, per `base-theme.md` item 32). No bundler runs. In compiled mode the theme's own compiler (Canvas/Sidekick) compiles `config/styles.css`; the CLI cannot invoke it ("Classic Edit Code alone does not invoke the compiler", `ripple/theme/AGENTS.md`), so `init` and `add` MUST end with the sentence telling the developer that `assets/styles.min.css` is stale until the platform recompiles, and precompiled `assets/ripple.css` MUST still be installed and loaded so the storefront is correct before that happens. Whether loading both is free of double rules depends on the layer design in `styling-spike.md`; UNVERIFIED here.
- Skills are synced to `.claude/skills` and `.agents/skills` for local agents. They do not travel through Shopify (conclusion 1). `.shopifyignore` is not needed for them because Shopify CLI only handles the theme directories and the two root Markdown files (docs: Shopify CLI 4.8.4 "includes `AGENTS.md` and `DESIGN.md`" in pull, push and package). UNVERIFIED: whether `shopify theme push` warns about unknown root directories.
- Canvas/Sidekick edits happen with no CLI (UNVERIFIED that Sidekick cannot run one). Files it edits keep their trailers, so the next local `ripple status` shows them as `modified`, and `upgrade` merges them. Files it creates by copying a Ripple block keep the copied trailer with a different path; `status` reports two files with the same `<id>` (rule RP512).
- Block-file budget: a theme has a hard limit of 300 block files (`liquid-blocks-partials.md` conclusion 11). `add` counts `blocks/*.liquid` before writing and refuses to exceed 150 Ripple-owned or 300 total.

---

## 7. The checker

### 7.1 Architecture

Three layers share the manifest. A project can run the first two with no browser.

| Layer | Input | How | Used for |
|---|---|---|---|
| **S: source** | project files | text scan and small parsers (Liquid `{% block %}`/`{% render %}` tags, `{% partial %}` names, `import` specifiers, trailers, marker regions) | Liquid call sites (the only host where a wrong value is invisible to a type checker), installation state, imports |
| **H: HTML contract** | any HTML: static `.html` files, saved server output, or `document.documentElement.outerHTML` captured by layer B | `parse5` tree with source locations; finds every element with a manifest root class or tag and validates it | all hosts, one implementation: this is where "one HTML contract" pays off |
| **B: browser** | a URL (`--url`) or a dev-server command | Playwright (optional peer); loads each route with JavaScript disabled and enabled | upgrade stability, no-JS flows, APG patterns, layout shift, console errors, agent snapshot |

Per host:

- **React and Remix**: enumerations and unknown props are TypeScript errors through the generated types, so layer S does not parse JSX. `check` runs layer S for imports and installation, and layer H/B on rendered routes. Rules RP101 to RP105 still apply to the rendered HTML, which catches values that came from variables.
- **Liquid**: layer S parses call sites; Theme Check runs as a sub-step when `@shopify/theme-check-node` or the `shopify` CLI is resolvable, and its offences are printed in Ripple's format with ids `TC:<CheckName>`. When neither is available, `check` prints one line saying how to run it. Layer H needs rendered HTML, which needs a store or the local shim of `liquid-blocks-partials.md` section 9; without either, layer H is skipped with a notice.
- **HTML**: layer H on the files.

`parse5` MUST be bundled into the CLI build, not listed in `dependencies` (decision 3).

### 7.2 Message format

Text format (default), exactly:

```
<RULE> <severity>  <location>  <component>: <problem>
  found:   <the exact source text or opening tag>
  allowed: <the enumeration, or the expected structure>
  fix:     <literal replacement text, or one imperative sentence>
  why:     <one sentence>
  docs:    npx <pkg> docs <component>
```

- `<RULE>` is `RP` plus three digits, or `TC:<CheckName>` for Theme Check.
- `<severity>` is `error` or `warning`.
- `<location>` is `<file>:<line>:<col>` for layers S and H on files, and `<url> <css selector>` for layer B.
- `found`, `allowed`, `fix`, `why`, `docs` appear in this order; a line is omitted only when it has no value. Labels are padded to 9 characters.
- `fix` MUST be text that can replace `found` whenever the checker can compute it.
- One diagnostic per root cause. Diagnostics are sorted by file, then line. At most 50 are printed, then `... and N more`.
- Last line: `N problems in M files. Fix the first one and run \`npx <pkg> check\` again.` or `No problems in M files.`
- Exit code 1 when any `error` exists or warnings exceed `--max-warnings`.

Real output of the prototype [RUN `spike/check/result.txt`]:

```
RP101 error  sample/templates/index.liquid:3:3  button: unknown value "outlined" for prop "variant"
  found:   variant: 'outlined'
  allowed: primary | secondary | outline | ghost | link | destructive
  fix:     variant: 'outline'
  why:     Prop values are enumerated. An unknown value matches no CSS rule, so the component silently renders its default.
  docs:    npx ripple-kit docs button

RP201 error  sample/out/page.html:5:1  button: Button has no accessible name
  found:   <button class="rp-button" type="button" data-variant="ghost" data-size="md">
  allowed: text content | aria-label
  fix:     add ariaLabel (Liquid: aria_label), or visible text
  why:     Screen readers and agents find a control by its accessible name.
  docs:    npx ripple-kit docs button
```

JSON format (`--json`), one object on stdout:

```json
{
  "version": 1,
  "ok": false,
  "counts": { "error": 11, "warning": 0 },
  "diagnostics": [
    { "rule": "RP101", "severity": "error", "file": "sample/templates/index.liquid", "line": 3, "col": 3,
      "url": null, "selector": null, "component": "button",
      "problem": "unknown value \"outlined\" for prop \"variant\"",
      "found": "variant: 'outlined'", "allowed": "primary | secondary | outline | ghost | link | destructive",
      "fix": "variant: 'outline'", "why": "Prop values are enumerated. ...", "docs": "npx ripple-kit docs button" }
  ]
}
```

How `fix` is computed MUST be specified, because the prototype's naive nearest-string choice gave poor suggestions (`data-size="xl"` → `sm`; `md:99` → `md:0`):

1. Enumerations: the value with the smallest Levenshtein distance, if the distance is at most 2; otherwise the prop's default.
2. Numeric scales: the scale value numerically nearest to the found number; ties go to the smaller.
3. Named size scales (`sm`, `md`, `lg`): when the found value is a known size word outside the set (`xs`, `xl`, `2xl`), the nearest end of the scale.
4. Duplicate breakpoint: keep the last token for that breakpoint (it is the one that wins in CSS, `styling-spike.md` 1.1).
5. Unknown breakpoint prefix: nearest by Levenshtein distance at most 1, else drop the token.

### 7.3 Rules

Layer: S source, H HTML, B browser, P project state. "TC" means Theme Check reports it when available; Ripple reports it only when Theme Check did not run.

Usage

| Id | Sev | Layer | Detects | How |
|---|---|---|---|---|
| RP101 | error | S (Liquid), H | A value not in the prop's enumeration or scale, including schema-backed settings and tokens inside a responsive string | S: literal arguments of `{% block '<name>' %}` where `<name>` is a manifest `liquid.block`. H: `data-*` attributes named by `prop.attribute` on a manifest root. Variables are skipped in S and caught in H. |
| RP102 | error | S (Liquid) | An argument that is not a prop, `class`, `attributes` or `content` | S. Duplicate of TC `UnrecognizedBlockArguments`; reported only when Theme Check did not run. |
| RP103 | error | S, H | Responsive grammar: two tokens for one breakpoint, unknown breakpoint prefix, or a scale prop passed as an unquoted number in Liquid | Tokenise on whitespace; split each token at the first `:`. |
| RP104 | error | S, H | A required prop is missing (`dialog` without `id`), or a root with `requiresId` has no `id` | S: arguments. H: attribute. TC `MissingBlockArguments` overlaps for doc params. |
| RP105 | error | S (Liquid) | A boolean prop given a string (`disabled: 'true'`, `'false'`) | S: literal is quoted. (The string `'false'` is truthy in Liquid; `liquid-blocks-partials.md` 4.2.) |
| RP110 | error | H | A manifest root class on an element not in `root.elements` (hand-rolled markup, `<div class="rp-button">`) | H |
| RP111 | error | S, H | A class or tag that starts with the Ripple prefix but is not in the manifest (`rp-buton`, `<rp-cart-countt>`) | H: class tokens and tag names. S: same scan over Liquid and CSS files. |
| RP112 | error | H, P | A `ui-*` or `rp-*` tag whose component is not installed, so nothing will define it | Tag name against installed components (trailers) and `dependencies.elements`. |
| RP113 | error | H | Structure: a required part is missing, a part is outside its `parent`, or a manifest `rules` entry is violated. The diagnostic carries the rule's `id`, `message` and `fix`. | H, using `parts` and `rules`. Example ids: `dialog-needs-title`, `no-interactive-descendant`, `variant-picker-outside-form`. |
| RP114 | error | H | Duplicate `id` among elements that the contract links by id, or a derived part id that does not match its root (`<id>-title`) | H, per document. |
| RP115 | error | H | A hand-rolled ARIA widget: `role` of `dialog`, `alertdialog`, `tablist`, `menu`, `listbox`, `switch`, `slider`, `radiogroup`, `toolbar`, `tree` or `combobox` on an element that is not inside a Ripple or `ui-*` root | H. From the UI SDK skill rule "Don't hand-roll what we ship" (`uisdk/packages/core/skills/ui-sdk/SKILL.md`). |
| RP116 | warning | S, H | On or inside a Ripple root: an inline `style` that sets a colour, or a Tailwind arbitrary colour (`bg-[#...]`, `text-[rgb(...)]`), where tokens exist | Regex on `style` and `class`. Warning only: utilities are the escape hatch (decision 8). |
| RP117 | warning | S | An import of `@ui-sdk/react`, `@ui-sdk/core/internal/*`, or a path under the package's `dist/` | Regex on `import`/`from` specifiers. (`react-and-custom-elements.md` section 8 item 1; UI SDK skill "Never import `@ui-sdk/core/internal/*`".) |

Accessibility (static)

| Id | Sev | Layer | Detects | How |
|---|---|---|---|---|
| RP201 | error | H | A component with `a11y.name.required` of `always` or `when-no-text` has no accessible name | H: text content, `aria-label`, `aria-labelledby`, or the part named in `a11y.name.sources`. |
| RP202 | error | H | A form control inside a Field with no associated `<label>` | H: `label[for]` or wrapping label. |
| RP203 | error | H | An Image root with no `alt` attribute, or without `width` and `height` | H |
| RP204 | error | H | A popup (Dialog, Popover, Menu, Tooltip root) inside a link or a clickable card | H. (`uisdk-web-elements.md` 9.2 item 9.) |

Progressive enhancement and commerce

| Id | Sev | Layer | Detects | How |
|---|---|---|---|---|
| RP301 | error | H | Inside a `commerce` root: a `<button>` that is neither in a `<form>` nor has `commandfor`, so it does nothing without JavaScript | H |
| RP302 | error | H | The opener of a component whose manifest has `noJs.fallbackHref` is not an `<a href>` (cart drawer, mobile nav, search) | H. (`uisdk-web-elements.md` 9.5 item 1.) |
| RP303 | error | H (server HTML only) | A part that must be hidden in the initial state lacks `hidden` (dialog content, drawer viewport, unselected tab panels) | H on HTML captured with JavaScript disabled. |
| RP304 | warning | H | A component with `noJs.level: "full"` (ProductForm, Price, CartLines) placed inside a container with `noJs.level: "none"` (Tabs panel, Popover, Dialog) | H |
| RP305 | error | H | Form dialect: Liquid product form without `input[name="id"]`; Hydrogen-host cart form whose first submit button is not `name="intent" value="set"` when the form has a `quantity` field and a `lineId` field; add form without `merchandiseId` | H, per `liquid.formDialect` / `hydrogenHost.formDialect`. (`hydrogen-core.md` 1.2: `attachQuantityInput` throws otherwise.) |
| RP306 | error | H (Liquid) | A checkout submitter inside the cart form without `name="checkout"` | H. (`ripple/theme/AGENTS.md` "Commerce contracts".) |
| RP307 | error | S (Liquid) | A second configuration of `Shopify.actions.updateCart` in the theme (for example the base theme's `snippets/standard-actions-config.liquid`) | S: text scan for `updateCart.configure`. (`hydrogen-core.md` S4.) |
| RP320 | error | H | An irreversible action (checkout button, Shop Pay, buy now; listed in `agent.confirm`) without `data-agent-confirm` | H |
| RP321 | warning | H | A `data-agent-*` attribute that is not `data-agent-confirm`, `data-agent-secret` or `data-agent-hidden` | H |

Liquid source

| Id | Sev | Layer | Detects | How |
|---|---|---|---|---|
| RP401 | error | S | `{% block %}` in a file under `blocks/` or `snippets/` | S. Duplicate of TC `ValidBlockTagPlacement`. |
| RP402 | error | S, P | `{% block '<name>' %}` where `blocks/<name>.liquid` does not exist; when `<name>` is a manifest block, the fix is the `add` command | S + file existence. (Theme Check does not report it; `liquid-blocks-partials.md` conclusion 4.) |
| RP403 | error | S | A partial name referenced by an element attribute that no template or layout declares; a partial name declared twice | S: `{% partial '<name>' %}` against manifest `liquid.partials` and element attributes. |
| RP404 | error | S | An overlay root (Dialog, Drawer) inside the `{% partial %}` that its own content refreshes | S: nesting of tags. (`liquid-blocks-partials.md` conclusion 5.) |
| RP405 | error | P | Block-file budget exceeded: more than 150 Ripple-owned block files or more than 300 total | Count `blocks/*.liquid`. |
| RP406 | error | P | `AGENTS.md` larger than 50,000 bytes; warning when the Ripple section is missing or differs from what the installed set would generate | File size; regenerate and compare. |

Project state

| Id | Sev | Layer | Detects | How |
|---|---|---|---|---|
| RP501 | error | P | A component is installed without a component it depends on, or without one of its own files | Trailers against `dependencies.components` and `files`. |
| RP502 | warning | P | Installed files come from more than one package version, or from a version other than the running package | Trailers. Fix: `upgrade`. |
| RP503 | error | P | More than one copy or version of `@ui-sdk/core`, `@ui-sdk/web` or `@shopify/hydrogen` resolvable from the project, or a version different from `pins` | Walk `node_modules` resolution (npm hosts). (`uisdk-web-elements.md` 9.8 item 2; `hydrogen-core.md` S2.) |
| RP504 | error | P | A file exists at a registry target path with no trailer | Trailers. |
| RP505 | error | S | CSS layer order: the layer declaration is not the first statement of the CSS entry, or Ripple CSS is imported after utilities | Parse the head of the CSS entry. (`styling-spike.md` 2.4.) |
| RP506 | warning | P | Skills out of date | `skills check --mode warn`. |
| RP510 | error | P | A patch that `init` could not apply is still absent (head render, import-map entries) | Marker or line search. |
| RP511 | error | S | A file contains merge conflict markers written by `upgrade --write-conflicts` | Text scan for `<<<<<<< yours`. |
| RP512 | warning | P | Two files carry the same trailer `<id>` | Trailers. |

Browser (`--browser`, needs Playwright and a URL)

| Id | Sev | Layer | Detects | How |
|---|---|---|---|---|
| RP601 | error | B | Upgrade instability: after scripts load, any attribute, child-list or text mutation inside a Ripple or `ui-*` root, outside the component's documented allow-list | Load the route; install a `MutationObserver` before module scripts run (`page.addInitScript`); wait for `customElements.whenDefined` of every used tag; assert no records. (`react-and-custom-elements.md` item 4; `uisdk-web-elements.md` 9.3.) |
| RP602 | error | B | Layout shift on upgrade: cumulative layout shift above 0.01, or a changed bounding box of a component root between the JavaScript-off and JavaScript-on render | `PerformanceObserver` `layout-shift`; two renders. (`styling-spike.md` 5.1.) |
| RP603 | error | B | A console error, an uncaught page error, a failed same-origin request, or a hydration warning | Playwright `console`, `pageerror`, `requestfailed`. |
| RP604 | error | B | A Ripple or `ui-*` element still matching `:not(:defined)` two seconds after load | `document.querySelectorAll`. |
| RP605 | error | B | APG pattern violations: for each component instance whose manifest `a11y.checkPattern` is not null, open it when it is a popup, then run `checkPattern(root, pattern)` | Inject the `@ui-sdk/core/testing` bundle with `page.addScriptTag` (10.9 kB gzip; verified to work in a page with no UI SDK [RUN]). The thrown message lists problems; each becomes one diagnostic. `checkPattern` is `@experimental` upstream. |
| RP606 | error | B | A no-JS flow fails: with JavaScript disabled, for each component with `noJs.level: "full"` on the route, the scripted flow recorded for it (submit add-to-cart and expect a navigation with a 2xx or 3xx response; submit filters and expect the URL to change; follow the cart link) | Playwright context with `javaScriptEnabled: false`. Flows are data in the checker keyed by component name. |
| RP607 | warning | B | Agent surface: with the agent entry loaded, a `snapshot()` entry with no `label`, or a `commerce` component on the page that is missing from the snapshot | Evaluate `createAgent().snapshot()` in the page. |
| RP608 | error | B | Horizontal overflow at 375, 768 or 1440 px wide | `document.documentElement.scrollWidth > clientWidth`. |
| RP609 | warning | B | Text contrast below 4.5:1 (3:1 for large text) on Ripple roots | Computed styles; Canvas-resolved colours. |

Notes on coverage:

- `checkPattern("dialog")` did not flag an untitled `ui-dialog` in the spike, so the title requirement is a static rule (RP113 `dialog-needs-title`), not left to RP605.
- Rules that duplicate Theme Check exist so that `check` is useful where Theme Check is not installed; when it ran, the Ripple duplicate is suppressed so the agent sees one diagnostic.
- Prototype status: RP101, RP102, RP103, RP110, RP113 (`forbids-ancestor`), RP201 are implemented in `spike/check/check.mjs` (99 lines). The Liquid argument parser there is a regular expression and does not handle nested quotes or list literals; the real one MUST tokenise.

---

## 8. Agent surfaces

### 8.1 Two audiences

1. **Coding agents** that write storefront code (Sidekick, Claude Code, pi, Codex). They use: `AGENTS.md`, skills, `docs/`, `{% doc %}`, types, `ripple check`. Sections 5, 7, 9.
2. **In-page agents** that operate a storefront for a shopper (WebMCP browser agents, an assistant embedded in the page). They use: the accessibility tree, and optionally the UI SDK bridge. This section.

### 8.2 What each kind of component offers an in-page agent

| Kind | Surface | Requirement |
|---|---|---|
| `static`, `native` | Accessibility tree only. Not in `snapshot()` [RUN]. | Correct role and accessible name (RP201, RP202). Real forms and links, so any browser agent can act. |
| `ui` | Bridge: listed with UI SDK's own actions. | Root or label part gives the name. |
| `commerce` | Bridge: the `rp-*` primitive declares `agent: { actions: [...] }`; the manifest lists the same names with argument types and one sentence each. | Root has `aria-label` (it is the bridge label; verified). Display-only primitives declare `actions: [], shown: () => false` (Tobi's convention). |

Rules that follow:

- Action names use the bridge's verb vocabulary (`set<Key>`, `add`, `remove`, `open`, `close`, `clear`, `submit`), so that they are offered even without the `actions` key and read naturally.
- An action MUST go through the same code path as the user's form submit (same store call, same events, `details.source === "agent"`), never a second implementation.
- The manifest build SHOULD include a test per commerce component that mounts it and asserts `snapshot()` reports exactly the manifest's action names (the UI SDK skill's "agent test", `references/agent-ready.md`).

### 8.3 Irreversible actions

`data-agent-confirm` is enforced only by the bridge and only on controls the bridge can see. A native checkout `<button>` or link carrying the attribute is a hint to other agents and nothing more [RUN]. For checkout, Shop Pay and buy-now the spec MUST choose one:

- (a) Make the control a UI SDK part: `<ui-button><button data-agent-confirm="...">`. The bridge then refuses a press until `allow` approves (verified for `ui-button`). Cost: the control depends on `@ui-sdk/web/button` (kernel already loaded on any page with a commerce element). Whether `ui-button` may wrap an `<a href>` checkout link is UNVERIFIED here; `uisdk-web-elements.md` 3.1 is the reference.
- (b) Expose checkout as an action of the cart primitive and put `data-agent-confirm` on a wrapper element that contains only the checkout control. The attribute "covers the element and everything inside it" (`references/agent-ready.md`), so it MUST NOT be placed on the cart root, where it would gate quantity changes too.

Recommendation: (a) for CheckoutButton and ShopPayButton. In both cases rule RP320 requires the attribute, and the sentence is written for the person who will be asked ("Goes to Shopify checkout with this cart").

### 8.4 The bridge is opt-in

`createAgent` adds about 12 kB gzip [RUN]. The package exposes it as a separate entry (`<pkg>/agent`) that re-exports `createAgent`, `registerTools`, `agentTools` from `@ui-sdk/web/agent` unchanged. `ripple.js` MUST NOT include it. A blueprint MAY show the three lines that enable WebMCP:

```js
import { createAgent, registerTools } from "ripple-kit/agent"
const agent = createAgent({ allow: (step) => !step.confirm || askThePerson(step.confirm) })
registerTools(agent, { allow: () => true })   // the bridge's own allow already asks
```

`registerTools` "does nothing in a browser without `document.modelContext`" (`references/agent-ready.md`).

---

## 9. Skills and agent documentation

### 9.1 Documentation shipped in the package

```text
docs/
  INDEX.md               # generated; one row per component, blueprint, guide and rule: name, kind, one-line summary, path
  llms.txt               # generated; same content in llms.txt link-list form
  components/<name>.md   # generated from the manifest (5.2) plus an optional hand-written "Notes" section
  guides/*.md            # hand-written: tokens-and-dials, layout-props, progressive-enhancement, hosts/liquid, hosts/react, hosts/remix, customize, upgrade
  rules/RP101.md ...     # generated from the rule registry: what, why, bad example, good example
```

Access paths, by host:

- npm hosts: files under `node_modules/<pkg>/docs/`. Skills tell the agent to `grep` `INDEX.md` first and to treat installed docs as canonical (Remix's wording, 2.3).
- Liquid with a shell: `npx <pkg>@<version> docs [component]` prints the page.
- Liquid without a shell: the `{% doc %}` header of each installed block, and the Ripple section of `AGENTS.md`.

### 9.2 Skill format and sync

- Agent Skills format: `skills/<name>/SKILL.md` with frontmatter `name`, `description`, plus `references/`. This is what Claude Code, pi and the `.agents/skills` readers load (2.1, 2.7).
- Description pattern: one sentence saying what the skill covers, then "Use when ...". pi's docs: "The description determines when the model considers loading the skill. State both what the skill does and when it applies."
- Size: `SKILL.md` at most 300 lines; detail goes in `references/` (UI SDK's is 56 lines with 7 references; Hydrogen's median is about 150).
- Written from the consumer project's point of view; no repository-only paths (Hydrogen's rule).
- Each skill declares `hosts` in a sidecar the CLI reads (not in frontmatter, to stay within the Agent Skills fields): `skills/<name>/ripple.json` `{ "hosts": ["liquid"] }`. `skills sync` installs only skills for the detected host, into both `.claude/skills` and `.agents/skills`, with Hydrogen's metadata block and decision table. Fewer, relevant skills mean fewer wrong routings. (Hydrogen syncs all 21 unconditionally.)
- The package is also a pi package: `"keywords": ["pi-package"]`, `"pi": { "skills": ["./skills"] }` in `package.json`, so a pi-based harness can load skills straight from the package with `pi -e npm:<pkg>` or `pi install npm:<pkg>` (2.7). This is the cleanest route for Sidekick if it cannot read `.agents/skills` from a theme. Whether Sidekick does either is UNVERIFIED.

### 9.3 Skills to ship

All names start with `ripple`. "Defers to" names another package's skill that MUST be used instead of repeating its content.

| # | Name | Hosts | Description (trigger) | Outline | Defers to |
|---|---|---|---|---|---|
| 1 | `ripple` | all | Builds storefront UI with Ripple components, tokens and blueprints. Use whenever a project contains Ripple files (classes or tags starting with `rp-`, `ripple.json`, a `ripple` section in AGENTS.md) or the task is to build or change storefront pages. | What Ripple is in 5 lines. How to find docs (`INDEX.md`, `docs`, `{% doc %}`). The rules for every task (use a component before raw markup; props before utilities; utilities before custom CSS; never hand-roll a widget; content in server HTML; actions are forms or links). Pick your path (table to the other skills). Done checklist: `ripple check`, then the host's build and typecheck. | none |
| 2 | `ripple-setup` | all | Installs Ripple into a project: init, base styles, tokens, head wiring, first components. Use when the project has no Ripple files yet or `ripple status` fails. | Detect host. Run `init`. Verify the patches (`status`). Add components or a blueprint. Per-host notes in `references/<host>.md`. | `hydrogen-setup` for the data layer and routes; `hydrogen-request-handlers` |
| 3 | `ripple-compose-page` | all | Composes pages and sections from Ripple layout and content components and blueprints. Use when building or changing a home, collection, product, search, cart, account, blog or content page, or any new section. | Start from a blueprint. Layout primitives and when to use each. Responsive prop grammar with 6 examples. Spacing rhythm rules. When a prop is missing: utility, then custom. Per-page checklists. | `hydrogen-collection-browser`, `hydrogen-routing` for data and URLs |
| 4 | `ripple-commerce` | all | Wires Ripple product and cart components: product form, variant picker, buy buttons, cart drawer, cart lines, discount code, checkout. Use when adding to cart, selecting variants, showing or editing the cart, or going to checkout. | The no-JS contract per component. The two form dialects (table). What the element reflects and what the host re-renders. Pending and error display. Checkout and `data-agent-confirm`. | `hydrogen-variant-form`, `hydrogen-cart-ui`, `hydrogen-cart-drawer`, `hydrogen-shop-pay`, `hydrogen-money` |
| 5 | `ripple-discovery` | all | Builds search, predictive search, filters, sort and pagination with Ripple. Use when working on collection or search pages. | One GET form for filters and sort. Active filters as links. Predictive search degrades to `/search?q=`. Pagination is links. | `hydrogen-collection-browser`, `hydrogen-predictive-search` |
| 6 | `ripple-theming` | all | Changes the look of a Ripple storefront through tokens, dials and scales. Use for brand colour, radius, density, typography, dark mode, or exposing tokens as theme settings. | The dials. Token names and what each drives. Changing a scale. Contrast rule and how to check it. Liquid: settings bridge. What not to do (raw hex, editing component CSS for a colour). | none |
| 7 | `ripple-customize-component` | all | Edits a scaffolded Ripple component safely or adds a variant. Use when a component's markup, CSS or props must change beyond tokens and props. | The contract and what must not change (classes, parts, attributes the checker and elements read). Where the files are. Adding a variant value (CSS + type or schema + doc). How the trailer and `upgrade` treat the edit. Re-run fixtures and `check`. | none |
| 8 | `ripple-new-component` | all | Builds UI that Ripple does not ship. Use when no component or blueprint fits and the need is a new visual pattern or a new interactive behaviour. | Decision: compose, utility-only markup, or new behaviour. Rules for the escape hatch (tokens, logical properties, no widget roles by hand). New `rp-*` element: `definePrimitive` + `createParts`, state reflection, `agent.actions`. | `ui-sdk` skill, `references/create-component.md` and `references/web-components.md` |
| 9 | `ripple-check-and-fix` | all | Runs Ripple's checker and fixes what it reports. Use after any change to storefront UI, before saying the work is done, and when `ripple check` prints a rule id. | Commands and flags. Reading a diagnostic. Fix the first error, re-run. Rule index with the common fixes. Browser checks. Then the storefront smoke test. | `hydrogen-smoke-test` |
| 10 | `ripple-upgrade` | all | Upgrades Ripple and merges local edits. Use when changing the Ripple version, when `ripple status` shows outdated files, or after an upgrade reports conflicts. | `status`, `upgrade --dry-run`, `upgrade`. Reading the plan. Resolving `merge-conflict` and `needs-base`. UI SDK and Hydrogen pins. | `migrate-to-hydrogen-2026-10` only when Hydrogen itself is being migrated |
| 11 | `ripple-liquid` | liquid | Rules for using Ripple in a Shopify Liquid theme built with blocks. Use for any change in a theme that has Ripple blocks. | Block-first composition (`{% block %}` only in templates and layouts). Params versus settings; bare kwargs. Booleans are `true`. Quoted scale strings. Ids passed to parts. Copy as text blocks. Partials and their names. Locale keys. The compiler and `styles.min.css`. | the theme's own `AGENTS.md` and `DESIGN.md` |
| 12 | `ripple-react` | react | Rules for Ripple's React bindings. Use when writing or changing React components that render Ripple components. | Rules R-1 to R-5 and `useElement` (`react-and-custom-elements.md` 7). Events and controlled state. Server rendering and hydration. Hydrogen store access. | Hydrogen skills for data |
| 13 | `ripple-remix` | remix | Rules for Ripple's Remix 3 bindings. Use when writing or changing Remix 3 components that render Ripple components. | Component shape, required ids, frames and morphing, forms and actions (`remix-3.md` 9, 14). | `remix` skill |
| 14 | `ripple-agent-ready` | all | Makes a Ripple storefront usable by in-page agents. Use when asked for WebMCP, agent actions, or agent safety on a storefront. | Section 8 as steps: names, actions, confirm marks, enabling the bridge, the agent test. | `ui-sdk` skill, `references/agent-ready.md` |

### 9.4 Deferring to Hydrogen and UI SDK skills

1. Ripple skills name other skills by their `name` and state the boundary in one sentence ("Use the `hydrogen-cart-ui` skill for store calls and form fields; this skill covers the markup and states"). They never copy the other skill's text. Hydrogen's own skills do the same among themselves (2.1).
2. `ripple skills sync` syncs only Ripple's skills. After it, when `@shopify/hydrogen` resolves from the project and `hydrogen skills check` would report drift, it prints: `Hydrogen skills are missing or out of date. Run \`npx @shopify/hydrogen skills sync\`.` It MUST NOT copy Hydrogen's skill directories itself: their metadata says `source: "@shopify/hydrogen"`, and Hydrogen's sync treats a directory it did not write as a conflict.
3. UI SDK has no sync command. Ripple skills refer to its skill by installed path, `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md` (shipped via `"files": [..., "skills"]`), and for hosts without `node_modules` to the single-file docs the UI SDK skill itself names for no-build pages (`https://ui-sdk.dev/web.md`).
4. On Liquid, Hydrogen's skills are written for server apps (routes, handlers, React or Vue). Only the behavioural parts apply (cart UX rules, variant rules, money). `ripple-liquid` and `ripple-commerce` MUST say which Hydrogen skills apply on Liquid and which do not, by name.
5. The eval harness measures routing: which `SKILL.md` files the agent read per task (section 10).

### 9.5 The `AGENTS.md` section

Generated by `init`, `add`, `upgrade` between `<!-- ripple:start -->` and `<!-- ripple:end -->`. Budget: 12,000 bytes; the build of the Ripple base theme fails above it. Content, in order:

1. Three lines: what Ripple is; the version; the command for docs.
2. The rules for every task (the same eight to ten lines as skill 1).
3. Host rules (Liquid: the block rules from skill 11, compressed to at most 15 lines).
4. Installed component index: one line per **installed** component: block name, kind, summary (140 characters maximum by schema). At about 90 bytes per line, 60 installed components fit in 5.4 kB.
5. The done rule: run `check` when a shell is available; otherwise follow the six-item manual list (enumerated values only from `{% doc %}`; no `{% block %}` in blocks or snippets; and so on).

The section MUST be complete without skills, because in Canvas it may be all the agent has.

---

## 10. Eval suite

Nothing in this section has been run. It reuses the shape of Hydrogen's harness (2.1), which exists and works for one harness.

### 10.1 Structure

```text
evals/                       # private workspace package, not published
  tasks/<id>/task.json       # prompt, hosts, start state, budgets, checks, screenshot plan
  tasks/<id>/checks.spec.ts  # deterministic Playwright checks
  templates/<host>/          # seeded workspaces (like Hydrogen's workspace-template)
  adapters/claude-code.ts, pi.ts, opencode.ts
  judge/rubric.md, judge.ts, golden/   # visual rubric, judge runner, human-rated calibration set
  score.ts, report.ts
```

Per run: build and `npm pack` the current Ripple package; copy the host template to a fresh workspace with the tarball as a `file:` dependency (Liquid: run `npx` from the tarball); start the agent in a Docker container with the workspace mounted and network limited to the model endpoint, the npm registry and `mock.shop`; when it exits, start the app, run checks, take screenshots, score. A canary skill verifies that skill discovery works in each harness (Hydrogen's `benchmark-canary`).

Data: every npm-host task uses `https://mock.shop/api` (decision 10). mock.shop cannot back a Liquid theme (`hydrogen-core.md` S19, `liquid-blocks-partials.md` conclusion 9), so Liquid tasks are scored in two tiers: tier 1 on every run (Theme Check, `ripple check` layers S, and layer H plus Playwright checks against the local liquidjs shim with fixture data); tier 2 nightly against a preview store when Ben provides one.

### 10.2 Tasks

Each task has one prompt written as a merchant or developer would say it, with no Ripple vocabulary unless noted.

| Id | Hosts | Start state | Prompt (abridged) | Deterministic checks (abridged) |
|---|---|---|---|---|
| T01 home | react, remix, liquid | host template, Ripple not installed | "Set up the storefront and build a home page: header with navigation and cart, a hero, a featured products grid from the store, footer." | App boots. `ripple status` ok. Header, main, footer landmarks. At least 4 product cards with image, title, price from store data. Every nav link returns 200. |
| T02 product page | react, remix, liquid | Ripple initialised | "Build the product page: gallery, title, price, option selection, quantity, add to cart, description." | Option values are links and change the URL; reload keeps the selection. Sold-out values stay selectable. With JavaScript off, submitting adds the line (cart page shows it). With JavaScript on, add shows pending then count increments, no navigation. |
| T03 cart | react, remix, liquid | T02 solution | "Add a cart drawer that opens from the header cart and a full cart page. Quantity can be changed and lines removed. Add a discount code field and checkout." | Header cart is a link to the cart page; with JavaScript it opens the drawer. Escape closes, focus returns. Quantity change settles to the right number after 5 rapid clicks. Remove works. Checkout control has `data-agent-confirm`. Cart page works with JavaScript off. |
| T04 collection | react, remix, liquid | Ripple initialised | "Build the collection page with filters, sorting, active filter chips and pagination." | Filters are one GET form; work with JavaScript off. Reloading a filtered URL renders the same state. Removing a chip keeps other params. Back and forward work. |
| T05 search | react, remix | Ripple initialised | "Add search: a search field in the header with suggestions while typing, and a results page." | Submitting with JavaScript off reaches `/search?q=`. Suggestions appear and are keyboard-navigable. `checkPattern(..., "combobox")` passes if a combobox is used. |
| T06 restyle | react, liquid | reference storefront (blueprints installed) | "Make it feel premium and dark: near-black background, a warm gold accent, sharper corners, more generous spacing." | No file under component CSS modified (trailers unmodified). Token or settings values changed. Contrast 4.5:1 on body text. No raw hex outside the token file. |
| T07 new section | react, remix, liquid | reference storefront | "Add an editorial section to the home page: large image on one side, heading, paragraph and two buttons on the other; stacked on mobile, image first." | Section present. Stacks below `md`, two columns from `md`. No horizontal overflow at 375. Outside-Ripple count at most the task budget. |
| T08 fix | react, liquid | storefront with 10 seeded violations (bad enum value, duplicate breakpoint, icon button without name, hand-rolled dialog, variant picker inside the form, checkout without `name="checkout"`, physical colour hex, missing dependency file, button inside a link, untitled dialog) | "The checker is failing. Fix everything it reports without changing how the pages look." | `ripple check` exits 0. Functional checks of T02 and T03 still pass. Screenshot difference from the reference below threshold. |
| T09 upgrade | react, liquid | project on Ripple N with `button` CSS edited locally and one file that will conflict | "Upgrade Ripple to the latest version and keep our button changes." | `status`: all files at N+1. The local edit is still present in the merged file. No conflict markers. `check` exits 0. |
| T10 dialog and accordion | react, remix, liquid | T02 solution | "Add a size guide that opens in a dialog from the product page, and an FAQ accordion under the description." | Dialog has a title; Escape closes; focus returns. `checkPattern(..., "dialog")` passes while open. FAQ content is readable with JavaScript off. |
| T11 Liquid dialect | liquid | Ripple base theme | "Add a 'Complete the look' region to the product template showing recommended products, with a heading the merchant can edit." | No `{% block %}` in blocks or snippets. Heading is a text block. Recommendations come from the recommendations API object, not a collection slice. Theme Check clean. `check` clean. |
| T12 Liquid cart | liquid | Ripple base theme without cart UI | "Build the cart page and cart drawer." | Native field names (`updates[]`, `name="checkout"`, remove links). Partials declared in templates or layout with the manifest's names. Overlay root outside its partial. One `updateCart` configuration. |
| T13 plain HTML | html | empty directory | "Make a single landing page for one product using Ripple with no build step." | Two tags load `ripple.css` and `ripple.js`. Page passes `check` layer H and B. Add to cart posts a form. |
| T14 markets | react | reference storefront | "Add a country and language selector and make prices follow the selected market." | Selector works with JavaScript off (form post or links). Prices change currency. Money rendered from API money fields. |
| T15 escape hatch | react, liquid | reference storefront | "Add a size chart table to the product page with a sticky header row and zebra rows." (Ripple ships no table.) | Uses tokens (no raw colour). Logical properties. No widget roles. `check` has no errors (warnings allowed). |
| T16 chrome | react, liquid | Ripple initialised | "Add an announcement bar, a newsletter signup in the footer and payment icons." | Newsletter form posts without JavaScript; field has a label; success and error messages are server-rendered. |
| T17 agent ready | react | T03 solution | "Make the storefront usable by in-page AI agents." | `snapshot()` has no unnamed entry; product form and cart actions present; an `act` add-to-cart step succeeds; a checkout press without approval is refused. |
| T18 account | react | reference storefront | "Add an account link in the header and an orders page listing past orders." | Account link present; orders page renders the list from fixture data; empty state present. |

T01 to T04, T06 to T10 and one Liquid task (T11) form the **core set** used for the pass bar; the rest are extended.

### 10.3 Harness adapters

```ts
interface HarnessAdapter {
  name: "claude-code" | "pi" | "opencode"
  run(input: { cwd: string; prompt: string; model: string; timeoutMs: number; maxCostUsd?: number; env: Record<string, string> }): Promise<RunResult>
}
interface RunResult {
  exitCode: number; timedOut: boolean; wallMs: number
  turns: number; toolCalls: number
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number }
  costUsd: number | null
  skillsRead: string[]            // SKILL.md paths that appear in read tool calls
  commands: string[]              // shell commands run (to count check invocations)
  transcriptPath: string
}
```

| Adapter | Invocation | Parsing |
|---|---|---|
| Claude Code | `claude -p "<prompt>" --output-format stream-json --verbose --permission-mode bypassPermissions --model <id> --max-budget-usd <n>` in the container; skills from `.claude/skills`; `AGENTS.md` copied to `CLAUDE.md` when the harness does not read `AGENTS.md` (UNVERIFIED which it reads) | One JSON object per line. Turns = count of assistant messages; tokens and cost from the final `result` record [MEM field names; read defensively]. `--max-turns` is not in `claude --help` 2.1.330, so the limit is cost and wall time. |
| pi | `pi --mode json --no-session --model <provider/id> "<prompt>"`; skills from `.agents/skills`, or `-e npm:<pkg>` to test loading from the package; `AGENTS.md` is read natively | Strict LF-split JSONL (not `readline`; pi's docs). Turns = count of `turn_end`. Tokens = last `usage` of each assistant `message_end`. Done at `agent_settled`. |
| OpenCode | as Hydrogen: `opencode run --pure --format json --thinking --dangerously-skip-permissions` | Hydrogen's `opencode-runner.ts` is the reference. |

The pi adapter with an Opus model is the stand-in for Sidekick. How closely it matches Sidekick's real configuration (system prompt, tools, skill loading, the Canvas file API) is UNVERIFIED and is the largest threat to the validity of the bar.

### 10.4 Scoring rubric

Gates (a failed gate scores the run 0): the app or theme renders the task's route; no uncaught page error on it; the agent did not modify files outside the workspace; no secret or token in client code.

| Component | Weight | Measure |
|---|---|---|
| Functional | 35 | Fraction of the task's deterministic checks that pass, times 35. No-JS checks are part of it. |
| Checker | 15 | `ripple check --browser --json`: 15 if no errors; minus 3 per error (floor 0); minus 0.5 per warning (at most 3). |
| Visual | 20 | Section 10.5: mean criterion score divided by 4, times 20. |
| Ripple adherence | 10 | Section 10.6: 10 at or below the task's outside-Ripple budget, falling linearly to 0 at three times the budget. |
| Build health | 10 | 10 if typecheck, build and (Liquid) Theme Check all pass; 0 otherwise. |
| Efficiency | 10 | 5 for turns and 5 for total tokens, each: full at or below the task budget, linear to 0 at twice the budget. |

A run **passes** when all gates pass, the total is at least 80, the functional fraction is at least 0.9, and the checker reports no errors.

Budgets per task (turns, tokens, outside-Ripple) are set from the median of 10 runs of the reference agent on the first stable version, then frozen; they are stored in `task.json`.

Secondary metrics recorded but not scored: skills read versus expected skills; number of `check` invocations; number of scaffolded files modified; whether the agent ran `docs`.

### 10.5 Visual rubric and judging

Screenshots per run, taken by the harness (not the agent) with Playwright, animations disabled, fonts loaded:

- Each task route at 375×812, 768×1024 and 1440×900, full page.
- Each state in the task's screenshot plan (drawer open, dialog open, a filter applied, an error shown).
- One 1440×900 capture with JavaScript disabled.

Deterministic visual checks run first and are part of the checker score: no horizontal overflow (RP608), no layout shift on upgrade (RP602), contrast (RP609), no image with a rendered aspect ratio more than 2% from its intrinsic ratio, no text clipped (`scrollHeight > clientHeight` on elements with `overflow: hidden` and text).

Judged criteria, each 0 to 4 with written anchors in `judge/rubric.md` (0 broken, 1 poor, 2 acceptable, 3 good, 4 indistinguishable from the reference quality):

1. Layout integrity: alignment to a grid, nothing overlapping, nothing cut off.
2. Spacing rhythm: consistent steps, clear grouping, no cramped or orphaned elements.
3. Typographic hierarchy: one clear heading order, readable line lengths.
4. Colour and contrast: palette used consistently; accents used sparingly.
5. Component consistency: the same control looks the same everywhere.
6. Responsive adaptation: each breakpoint looks designed, not squeezed.
7. Imagery: correct aspect ratios, sensible crops, no stretched or missing media.
8. State quality: open overlays, errors and empty states look finished.
9. Task fit: the page contains what was asked, arranged sensibly for a store.

Judging procedure:

- Judge model: a fixed, pinned Opus-class model, temperature 0, given the rubric, the task prompt, and the screenshots; it returns JSON `{ criterion: { score, evidence } }` where `evidence` names what it saw. It never sees the code or which arm produced the image.
- Each criterion is also judged pairwise against the reference blueprint's screenshot for the same route and viewport ("is B at least as good as A on this criterion?"). The pairwise answer caps the absolute score at 2 when the answer is "worse".
- Three independent judgements per run; the per-criterion median is used.
- Calibration: `judge/golden/` holds at least 30 screenshots rated by a person. A judge configuration is accepted only when its scores have Spearman correlation at least 0.7 with the human ratings and mean absolute error at most 0.75. Re-run the calibration when the judge model changes.

### 10.6 Outside-Ripple measure

Computed from the workspace diff (start state to end state), over files the agent created or changed, excluding unmodified scaffolded files:

- `cssLines`: non-blank lines of CSS outside the token file and outside marker regions.
- `jsLines`: non-blank lines of JavaScript or TypeScript that are not inside a binding file with an unmodified trailer and not route or data code (classified by directory in `task.json`).
- `rawInteractive`: count in rendered HTML of `button`, `input`, `select`, `textarea`, `dialog`, `details`, and elements with a widget `role`, that are neither a Ripple root or part nor inside one.
- `arbitraryValues`: count of Tailwind arbitrary-value classes (`[...]`).
- `modifiedScaffolded`: count of owned files whose trailer shows `modified`.

`outside = cssLines + jsLines + 5 × rawInteractive + 2 × arbitraryValues + 10 × modifiedScaffolded`. Each task states its budget; T15 has a high one by design, T06 has `modifiedScaffolded` budget 0.

### 10.7 The "Sidekick bar"

Proposed thresholds, to be confirmed after the first baseline. Matrix: core set, each on its hosts, 5 runs each, pi adapter, the Opus model Sidekick uses.

1. Pass rate over all runs at least 90%; no single task-host pair below 70% (at most 1 failure in 5 is allowed only if the overall rate holds; 2 failures on one pair fail the bar).
2. Median visual score at least 3.0 of 4; no criterion with a median below 2.5.
3. `ripple check` clean on the agent's own final state in 100% of passing runs (by definition) and reached within 3 `check` invocations in at least 80% of runs.
4. Median outside-Ripple measure within budget on T01 to T04 and zero `modifiedScaffolded` on T06.
5. Control arm: the same tasks and agent with Ripple removed (Tailwind and Hydrogen skills only; for Liquid, the unmodified base theme). Ripple MUST have a higher pass rate, a visual score at least 0.5 higher, and no more total tokens at the median.
6. Weaker-model arm (a Sonnet-class model): pass rate at least 75%. This is the signal that the kit teaches, rather than the model compensating.
7. Liquid tier 2 (preview store) passes T11 and T12 before the Liquid host is called ready.

The eval suite also gates Ripple's own releases: a release candidate MUST not drop the pass rate by more than 5 points against the previous release on the core set.

---

## 11. npm package

### 11.1 One package

One published package. Reasons:

1. Version coupling is a requirement, not a convenience: fixtures, pre-upgrade CSS and bindings encode what one exact UI SDK version writes on upgrade (`uisdk-web-elements.md` 9.8 item 2: "Ripple's npm package version determines the ui-sdk version"). Elements, CSS, registry, manifest, checker tables and skills must therefore move together.
2. Precedent: `@shopify/hydrogen` is one package with core, `./react`, `./vue`, `./vite`, a bin, `skills/` and optional peers (`hydrogen/packages/hydrogen/package.json`). `remix` is one umbrella package with an index.
3. `npx <pkg> <command>` in a theme with no `package.json` needs the CLI and the registry in the same package [RUN pattern].
4. An agent has one name to install, pin and look up docs for.

Costs and how they are contained: the CLI and checker ship to projects that only import elements, but `"sideEffects"` is limited to the element-registering entries and CSS, each concern has its own entry, and the CLI has no install-time dependencies. The eval harness is a separate private workspace package and is never published.

### 11.2 Layout

```text
<pkg>/
  package.json
  README.md  LICENSE
  bin/ripple.mjs                 # imports ../dist/cli/index.mjs (kept as a checked-in wrapper, as Hydrogen does)
  dist/
    index.mjs                    # no side effects: types, helpers (rv, cx), version, manifest loader
    elements/index.mjs           # defines every ui-* entry Ripple uses + non-commerce rp-* elements
    elements/<name>.mjs          # one per element, defines only that element
    commerce/index.mjs           # defines all commerce rp-* elements
    commerce/<name>.mjs
    react/index.mjs              # useElement, JSX IntrinsicElements types, store hooks (react-and-custom-elements.md item 8, 14)
    remix/index.mjs              # Remix helpers and types (remix-3.md)
    agent/index.mjs              # re-export of @ui-sdk/web/agent
    testing/index.mjs            # canonicalize(), loadFixtures(), upgradeDiff() for projects' own tests
    check/index.mjs              # programmatic checker: check(options): Promise<Report>
    cli/index.mjs
    **/*.d.mts
  browser/
    ripple.js                    # prebuilt ES module: UI SDK entries + rp-* elements + Hydrogen core (per hydrogen-core.md S2)
    ripple.elements.js           # same without commerce and without Hydrogen
    ripple.css                   # prebuilt: layers + tokens + base + all components + props
    elements/<name>.js           # per-element modules for themes that load per template
  css/
    layers.css  tokens.css  theme.css  base.css  props.css  components/<name>.css
  registry/
    index.json                   # generated: component -> host -> files (subset of the manifest)
    css/...  react/...  remix/...  liquid/blocks|snippets|assets|locales/...  html/...
    blueprints/<name>/<host>/...
  manifest.json  manifest.schema.json  config.schema.json
  custom-elements.json  html-custom-data.json
  docs/  INDEX.md  llms.txt  components/  guides/  rules/
  skills/<name>/SKILL.md ...
```

### 11.3 `package.json` (essential fields)

```jsonc
{
  "name": "ripple-kit",
  "version": "0.1.0",
  "type": "module",
  "bin": { "ripple": "./bin/ripple.mjs" },
  "files": ["bin", "dist", "browser", "css", "registry", "docs", "skills",
            "manifest.json", "manifest.schema.json", "config.schema.json",
            "custom-elements.json", "html-custom-data.json", "README.md"],
  "sideEffects": ["./dist/elements/*.mjs", "./dist/commerce/*.mjs", "./browser/*", "*.css"],
  "exports": {
    ".":               { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
    "./elements":      { "types": "./dist/elements/index.d.mts", "default": "./dist/elements/index.mjs" },
    "./elements/*":    { "types": "./dist/elements/*.d.mts", "default": "./dist/elements/*.mjs" },
    "./commerce":      { "types": "./dist/commerce/index.d.mts", "default": "./dist/commerce/index.mjs" },
    "./commerce/*":    { "types": "./dist/commerce/*.d.mts", "default": "./dist/commerce/*.mjs" },
    "./react":         { "types": "./dist/react/index.d.mts", "default": "./dist/react/index.mjs" },
    "./remix":         { "types": "./dist/remix/index.d.mts", "default": "./dist/remix/index.mjs" },
    "./agent":         { "types": "./dist/agent/index.d.mts", "default": "./dist/agent/index.mjs" },
    "./testing":       { "types": "./dist/testing/index.d.mts", "default": "./dist/testing/index.mjs" },
    "./check":         { "types": "./dist/check/index.d.mts", "default": "./dist/check/index.mjs" },
    "./ripple.css":    "./browser/ripple.css",
    "./ripple.js":     "./browser/ripple.js",
    "./css/*":         "./css/*",
    "./manifest.json": "./manifest.json",
    "./manifest.schema.json": "./manifest.schema.json",
    "./config.schema.json": "./config.schema.json",
    "./custom-elements.json": "./custom-elements.json",
    "./skills/*":      "./skills/*",
    "./docs/*":        "./docs/*",
    "./registry/*":    "./registry/*",
    "./package.json":  "./package.json"
  },
  "customElements": "custom-elements.json",
  "keywords": ["pi-package"],
  "pi": { "skills": ["./skills"] },
  "dependencies": {
    "@ui-sdk/core": "0.1.0-beta.14",
    "@ui-sdk/web": "0.1.0-beta.14"
  },
  "peerDependencies": {
    "@shopify/hydrogen": ">=2026.10.3 <2027",
    "react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "playwright": ">=1.45",
    "@shopify/theme-check-node": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }, "tailwindcss": { "optional": true },
    "playwright": { "optional": true }, "@shopify/theme-check-node": { "optional": true }
  },
  "engines": { "node": ">=20.18" }
}
```

- `dependencies` contains only UI SDK, pinned exactly (`uisdk-web-elements.md` 9.8 item 1). Hydrogen is a peer and stays external in `dist/` (`hydrogen-core.md` S2). Tailwind is an optional peer. Everything else the CLI and checker use (`parse5`) is bundled at build time, so decision 3 holds at install time as well.
- The Hydrogen peer range and the Remix peer are placeholders; the supported ranges are whatever the conformance suite ran against.
- `manifest.pins` MUST equal the resolved versions of the three pinned packages at build time; a build check enforces it.
- Size budgets: a `size-budget.json` with gzip budgets for `browser/ripple.js`, `browser/ripple.elements.js`, `browser/ripple.css`, each `elements/<name>` and `commerce/<name>` entry, checked in CI with 3% tolerance and an `--update` flag (UI SDK's mechanism, 2.2).

### 11.4 Name

Checked with `npm view` on 2026-11-21:

| Name | Result |
|---|---|
| `ripple` | taken: 0.6.1, "Ripple is an elegant TypeScript UI framework" |
| `rippleui` | taken: 1.12.1, a Tailwind CSS component library |
| `@ripple-ui/core` | taken: 0.6.0, an unrelated "spec engine for Ripple" |
| `ripple-ui`, `ripple-kit`, `ripple-storefront`, `storefront-ripple`, `rpl-ui`, `@shopify/ripple` | not found (free) |

Proposal: **`ripple-kit`**, bin name `ripple`.

- Unscoped, so it needs no organisation and `npx ripple-kit` is short.
- Not confusable with the three existing "ripple" UI packages, unlike `ripple-ui`.
- "kit" matches what the package is: elements, CSS, registry, CLI, checker, skills.
- `@shopify/ripple` is free and is the obvious final name if Shopify publishes it; that needs the `@shopify` scope, so it cannot be the working name.

Making the rename trivial:

1. One source of identity: `src/identity.ts` exports `PKG_NAME`, `BIN_NAME`, `DOCS_URL`; `package.json` `name` is the only other place. Source code, skills, docs, registry files and messages use `PKG_NAME` or the build-time token `__PKG__`. A scaffolded import reads `from "__PKG__/react"` in the registry source and is written with the real name at build.
2. The prefix (`rp-`) is independent of the package name and lives only in `manifest.prefix`.
3. Trailers accept any package name (6.2).
4. A CI test builds with `RIPPLE_PKG_NAME=@acme/storefront-ui` and fails when the string `ripple-kit` appears anywhere in the build output. This proves the rename, including to a scoped name, on every commit.
5. For projects that already installed under the old name, a later `ripple migrate package-name` rewrites import specifiers; trailers need no change.
6. Decision for Ben (not done here): whether to publish a `0.0.0` placeholder to reserve the name, as Remix's `publish-placeholder-package` skill does.

---

## 12. What the spec must say

Distribution and provenance

1. Ripple is one npm package containing elements, commerce elements, React and Remix helpers, prebuilt `ripple.js` and `ripple.css`, the registry of scaffoldable files, the manifest, the CLI, the checker, docs and skills. State the export map of 11.3.
2. `dependencies` are exactly `@ui-sdk/core` and `@ui-sdk/web`, pinned to one exact version. `@shopify/hydrogen` is a peer dependency and external. `tailwindcss`, `react`, `playwright`, `@shopify/theme-check-node` are optional peers. Every other library used by the CLI or checker MUST be bundled into `dist/`.
3. The working package name is `ripple-kit`; the bin is `ripple`. The name MUST appear only in `package.json` and one identity module; a CI test MUST build under a different (scoped) name and find no occurrence of the working name.
4. The registry is the `registry/` directory of the package version in use. There is no network registry in V1.
5. Every owned scaffolded file ends with one provenance trailer line in the form of 6.2. The trailer records the upstream version and the SHA-256 of the upstream body (CRLF normalised to LF). The trailer is the only record of what is installed. The CLI MUST NOT write a lockfile.
6. `ripple status --json` prints the computed lock in the format of 6.3.
7. Host detection follows 6.4 exactly, including the errors for a theme with `sections/` or JSON templates and for no detectable host.
8. Configuration: `ripple.json` in npm hosts (6.5), holding paths and host only. No configuration file in Liquid themes.
9. Commands and flags are those of 6.6. Every command is non-interactive unless a TTY is present and `CI` is unset. Every writing command plans first, aborts before any write on an unmanaged collision, and writes through a temporary file and rename.
10. Patches to project-owned files use only the mechanisms in the table of 6.6: marker regions, single inserted lines, keyed JSON merges. A patch target that cannot be found is reported with the exact text to add; it is never guessed.
11. `upgrade` follows the decision table of 6.7. Conflict markers are written only with `--write-conflicts`. Blueprint files are never merged.
12. The three-way merge is the built-in algorithm of 6.7, with regions formed from hunks that overlap **or touch**. The implementation MUST have a test that compares it with `git merge-file --diff3` on generated cases (the spike's `test.mjs`) and requires identical conflict classification and identical clean output.
13. Base bodies for modified files come from a local cache, then `npm pack <pkg>@<version>`. Unmodified files MUST upgrade with no network access.
14. Liquid themes are operated with `npx <pkg>@<version>` and need no `package.json`. `init` prints the pinned command form. `add` enforces the block-file budget (150 Ripple-owned, 300 total).
15. In compiled-mode themes, Ripple patches `config/styles.css` and also installs precompiled CSS; `init` and `add` end with the notice that `assets/styles.min.css` is stale until the platform recompiles.

Manifest and generation

16. The manifest schema is `spike/manifest/manifest.schema.json` (4.2), plus the nine build-time checks listed there. `manifest.json` ships in the package; per-component JSON files are the source.
17. Component `kind` is one of `static`, `native`, `ui`, `commerce`. Every component declares `noJs.level`, `a11y`, `agent.surface` and at least one fixture.
18. Each prop declares its type, its enumeration or scale, whether it is responsive, the attribute it prints, and for Liquid its snake_case name and whether it is a schema setting or a doc param. At most 3 enumerated settings per block.
19. `static` components have a contract template in the node language of 4.2. The language has exactly: tags (literal, from an enumerated prop, or two-way conditional), attributes with an optional condition, values (literal, prop, locale key, space-joined list), conditions (`set`, `true`, `eq`, `not`, `all`), `slot`, `text`, `embed`, `host`. It MUST NOT gain loops or expressions.
20. For templated components, the reference renderer defines fixtures, and the React, Remix and Liquid bindings are generated from the same template. Generated bindings MUST include the enumeration guard (fall back to the default) and the strict boolean test (`=== true` / `== true`). The generator MUST fold constant conditions per branch so emitted code has no dead conditionals.
21. `ui` components have fixtures produced by upgrade snapshot. `commerce` components have hand-written bindings and hand-written fixtures with a `mask` for host-owned form internals; their form dialects are recorded in `liquid.formDialect` and `hydrogenHost.formDialect`.
22. The generated/hand-written split is the table of 5.3. One command regenerates everything; CI runs it in check mode and fails on any difference.
23. Generated Liquid block files contain: `{% doc %}` (summary; settings listed in the description; one `@param` per code-level prop with a string-literal union for non-responsive enumerations; `class`; `attributes`; `content`; one `@example`), the body, `{% schema %}` with `t:` labels, and the trailer after `{% endschema %}`. Generated `{% doc %}` text MUST NOT contain Tailwind utility names.

Checker

24. `ripple check` has the three layers of 7.1 and the rules of 7.3 with those ids, severities and detection methods. Rule ids are stable; a removed rule's id is never reused.
25. The message format is exactly 7.2, text and JSON. `fix` is computed by the five rules of 7.2.
26. On Liquid, `check` runs Theme Check when it is resolvable, prints its offences in Ripple's format with `TC:` ids, and suppresses Ripple rules that duplicate them. Ripple MUST cover what Theme Check does not: schema-backed enumerations, responsive strings, missing block files, booleans passed as strings, partial names.
27. On React and Remix, enumerations and unknown props are enforced by generated TypeScript types; the checker validates rendered HTML and does not parse JSX.
28. Browser rules need Playwright as an optional peer and a URL. RP605 injects `@ui-sdk/core/testing` and calls `checkPattern(root, pattern)`; because that API is experimental upstream, the rule is tied to the pinned UI SDK version and has a test.
29. Every rule has a generated docs page with a failing and a passing example, and a test fixture for each.

Agent surfaces

30. `static` and `native` components are operated through the accessibility tree and are not in the UI SDK agent snapshot. `ui` and `commerce` components are. The manifest records which (`agent.surface`).
31. Every `rp-*` commerce primitive declares `agent.actions` (or `actions: [], shown: () => false` when display-only), has `aria-label` on its root, and routes agent calls through the same code path as form submission. A test per component asserts that `snapshot()` reports exactly the manifest's actions.
32. Checkout, Shop Pay and buy-now controls carry `data-agent-confirm` with a sentence written for the shopper, and are UI SDK parts (`ui-button`) so the bridge enforces it; or state the alternative of 8.3 (b). The attribute MUST NOT be placed on a cart or product-form root.
33. The agent bridge is exported only from `<pkg>/agent` and is never part of `ripple.js`.

Skills and documentation

34. The package ships `docs/INDEX.md`, `docs/llms.txt`, one generated page per component, guides, and one page per rule. Skills tell agents to search the index first and to treat installed docs as canonical.
35. Skills are those of 9.3, in Agent Skills format, each at most 300 lines plus `references/`, each with a host list. `ripple skills sync` and `ripple skills check` implement Hydrogen's algorithm (metadata block, hash over the directory, decision table, both `.claude/skills` and `.agents/skills`, abort on unmanaged collisions, staged writes), filtered by host.
36. Ripple skills defer to Hydrogen and UI SDK skills by name and never restate them. `skills sync` does not copy other packages' skills; it prints the Hydrogen sync command when Hydrogen's skills are missing or stale.
37. `package.json` declares the package as a pi package (`keywords: ["pi-package"]`, `pi.skills`).
38. `init`, `add` and `upgrade` maintain a generated section of `AGENTS.md` between `<!-- ripple:start -->` and `<!-- ripple:end -->`, at most 12,000 bytes, with the content of 9.5. The section MUST be sufficient without skills. `check` fails when `AGENTS.md` exceeds 50,000 bytes.
39. In Liquid, the `{% doc %}` header of each block is the per-component reference and MUST be complete on its own: every prop, every allowed value, defaults, and one valid example.

Evals

40. The eval suite is a private workspace package with the structure of 10.1, the tasks of 10.2, adapters for Claude Code and pi (10.3), the scoring rubric and pass definition of 10.4, the visual procedure of 10.5 and the outside-Ripple measure of 10.6.
41. npm-host tasks use mock.shop. Liquid tasks have two tiers: local shim on every run, preview store nightly.
42. Budgets are frozen from a baseline; the judge is calibrated against human ratings before its scores count.
43. The Sidekick bar is 10.7. A Ripple release MUST NOT reduce the core-set pass rate by more than 5 points.
44. Milestone order implication: the checker (layers S and H), the manifest schema and the generator belong in "foundations", before the bulk of components, because bindings and docs are generated from them. The eval harness with T01, T02 and T08 belongs in "commerce" at the latest, so that the kit is measured while it can still change.

---

## 13. Assumption check

| Proposed-architecture assumption | Verdict | Evidence |
|---|---|---|
| A lockfile records versions and hashes for three-way merge | Refuted for Liquid, replaced everywhere | Shopify stores only theme directories plus `AGENTS.md` and `DESIGN.md`; Hydrogen records provenance in-file; trailer verified with Theme Check and CRLF (6.2) |
| Three-way merge on upgrade is feasible without dependencies | Confirmed | 69-line diff3 equals `git merge-file --diff3` on 2,000 cases after the touching-hunks fix (6.7) |
| shadcn-style CLI: init, add, diff, upgrade | Partly | shadcn has `init`, `add`, `add --diff` (`diff` deprecated) and no upgrade or merge; Ripple's upgrade is original work (2.5) |
| The CLI works in a Liquid theme with no `package.json` | Confirmed (pattern) | Hydrogen's CLI ran with `npx` in a bare directory and wrote both skill roots (2.1) |
| One manifest generates docs, types and Liquid `{% doc %}` | Confirmed | Generated from the manifest; types and docs emitted; Liquid files pass Theme Check (5.2) |
| The manifest can also generate bindings | Confirmed for static components, unproven for ui and commerce | One template, three emitters, 10 of 10 canonical-equal (5.1) |
| Agent actions exist for every component | Refuted | Native controls are invisible to the UI SDK bridge; only `ui` and `commerce` components have bridge actions (2.2) |
| `data-agent-confirm` protects irreversible actions | Partly | Enforced by the bridge on UI SDK parts; not on native controls (2.2, 8.3) |
| A checker with teaching errors can be static | Partly | Liquid call sites and any HTML: yes (prototype). JSX: left to TypeScript. Upgrade stability, no-JS flows and APG patterns need a browser (7.1) |
| UI SDK's `checkPattern` gives ARIA checks for free | Partly | Works in Chromium and injected into any page; reported nothing for an untitled dialog; marked experimental (2.2) |
| Versioned skills synced like Hydrogen's | Confirmed, with a limit | Algorithm is small and proven; but skill directories do not travel with a theme through Shopify, so `AGENTS.md` and `{% doc %}` must carry the essentials (conclusion 2) |
| Identical API shape in every host | Partly | Prop names and values are identical; Liquid adds the setting/param split and snake_case; some props exist only in some hosts (`open` in React, `defaultOpen` not in Liquid) and the manifest records it (`prop.hosts`) |
| Eval suite against mock.shop for all hosts | Refuted for Liquid | mock.shop is a Storefront API only (`hydrogen-core.md` S19); Liquid needs the shim tier and a preview store |
| Runtime dependencies limited to UI SDK, Tailwind, Hydrogen | Confirmed as achievable | CLI and checker bundle their parser; Hydrogen's CLI shows a near-zero-dependency CLI is practical (2.1) |

---

## 14. UNVERIFIED, and what would settle each

1. Whether Shopify theme storage, `shopify theme push` and the GitHub integration drop or reject root files other than `AGENTS.md` and `DESIGN.md` (the docs name only those two). Settle: push a theme with `ripple.lock.json` and `.agents/` at the root to a development store and pull it back.
2. Whether Sidekick in Canvas can run a CLI, load skills from `.agents/skills`, or load a pi package. Settle: ask the Sidekick team. Until then, treat `AGENTS.md` plus `{% doc %}` as the whole agent context on Liquid.
3. Whether a `{% render %}` line inside the JSON of `<script type="importmap">` is accepted by Theme Check and the platform. Settle: Theme Check run plus a preview store.
4. Whether loading precompiled `assets/ripple.css` together with a compiled `styles.min.css` that also contains Ripple's layer is free of conflicts. Settle with the styling layer design.
5. The exact action list `snapshot()` reports for `ui-dialog` and other `ui` components. Settle: extend `spike/agent/run.cjs`.
6. Whether `ui-button` can wrap an `<a href>` checkout link while keeping the bridge's confirm enforcement.
7. Claude Code's `stream-json` result record fields and whether it reads `AGENTS.md` in headless mode. Settle: one headless run with credentials.
8. How `skills.sh.json` is consumed, and whether Ripple should ship one.
9. shadcn `components.json` and registry-item details quoted from memory (2.5), Radix Themes and Base UI details (2.6).
10. Every number in section 10 (weights, budgets, thresholds). They are proposals until a baseline run exists.
11. The generator's output for `ui` components, the `embed` and `host` template nodes, and the Remix emitter.
12. Trailer survival when Sidekick rewrites a file: an agent may drop a trailing comment it does not understand. The `AGENTS.md` section MUST tell agents to keep the last line of Ripple files; measure in T11 and T12 how often it is lost.

---

## 15. Reproducing

```
cd ripple/docs/research/spikes/agent-kit
npm i esbuild @ui-sdk/web@0.1.0-beta.14 @ui-sdk/core@0.1.0-beta.14 parse5

# agent bridge and checkPattern (needs playwright; bundle entry.js -> out.js and pat-entry.js -> pat.js with esbuild first)
node agent/run.cjs         # -> agent/result.txt
node agent/pat.cjs         # -> agent/pat-result.txt

# three-way merge and upgrade table (needs git on PATH for the comparison only)
node merge/test.mjs        # -> merge/result.txt
node merge/upgrade.mjs     # -> merge/upgrade-result.txt

# manifest: build the four entries and validate
(cd manifest && node build.mjs && python3 -c "import json,jsonschema; jsonschema.Draft202012Validator(json.load(open('manifest.schema.json'))).validate(json.load(open('ripple.manifest.json')))")

# generator: needs liquidjs and react from the sibling spikes (paths are at the top of gen/test.mjs)
(cd gen && node test.mjs && node from-manifest.mjs)

# checker prototype
(cd check && node check.mjs sample; node check.mjs sample --json)
```

The scripts `gen/test.mjs` and the Theme Check run reference the sibling spike directories `spikes/liquid` and `spikes/react-ce` for `liquidjs`, `react`, `react-dom`, `@shopify/theme-check-node` and the HTML canonicaliser; adjust the path constant `S` in `gen/test.mjs` to the local location.
