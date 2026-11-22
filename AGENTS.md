# AGENTS.md: how to work in the Ripple repository

Ripple is a design system and component library for Shopify storefronts. One HTML contract per component; four render hosts (`html`, `react`, `remix`, `liquid`); two commerce backends (`hydrogen`, `liquid`). The specification is complete and lives in `docs/`. Your job is to implement exactly one task of the plan per session.

## Read in this order, and nothing else

1. This file.
2. `docs/CONVENTIONS.md` (names, attributes, props, file layout, commands, definition of done, never-do list).
3. `docs/PLAN.md` sections 1 to 3, the recipe in section 5 for your task's kind, and your task's ONE row in section 6.
4. Your task's detail: `docs/plan/<milestone file>`, section `## <task id>`.
5. Only the files and sections that detail names.

`docs/README.md` is the index of every document. `docs/00-decisions.md` (the decision ledger) wins on any conflict. Never read the ledger or a numbered doc (`docs/01-*.md` to `docs/14-*.md`) in full: they are 100 kB to 320 kB each. Search for the section heading you were sent to.

## Pick a task

Take the lowest task id in `docs/PLAN.md` section 6 that has no file `docs/plan/done/<task id>.md`, no remote branch `task/<task id>-*`, all of its "Depends on" tasks done, and no BLOCKED-ON-BEN mark. One task, one branch, one pull request. Do not start a second task.

```bash
git fetch origin
git ls-remote --heads origin 'task/<task id>-*'     # must print nothing
git switch -c task/<task id>-<slug> origin/main
pnpm install --frozen-lockfile
```

## Commands

| Command | Use |
|---|---|
| `pnpm gen` | regenerate after editing a manifest, `css/tokens.css`, an icon or a locale string |
| `pnpm typecheck` | type check |
| `pnpm gen --check` | generated files are current; manifest and lint checks pass |
| `pnpm build` | build `pkg/`; needed before any browser test |
| `pnpm examples:install` | after every `pnpm build` |
| `pnpm test:component --component=<id>` | tiers 1 to 6 for one component |
| `pnpm test` | tiers 1, 2, 3, 4, 5, 6, 10 |
| `pnpm ci` | everything the `verify` CI job runs; MUST exit 0 before you open the pull request |

Use Node 24 (Remix tests skip below 24.3 and a skip fails `pnpm ci`). The package manager is pnpm. The test runner is `node:test` through `test/run.ts`; browser tests use the `playwright` library with Chromium.

## Rules

MUST:

- Follow the spec. Copy code blocks marked "complete" unchanged; fix them only until the gate test the task names passes.
- Use only names, props, enum values, attributes, classes, file paths and rule ids that the ledger or the task's spec defines.
- Change generated files only by changing their source and running `pnpm gen`.
- Keep every host equal: a change to a component's HTML contract is made in the manifest and reaches `html`, `react`, `remix` and `liquid` in the same task.
- Make every feature work without JavaScript at the `noJs` level its spec states.
- Prove the definition of done (`docs/PLAN.md` section 3) with the listed commands and paste their last output line into the pull request.
- Add `docs/plan/done/<task id>.md` in the same pull request (format in `docs/PLAN.md` section 2).
- Mark anything you could not verify in source or documentation as `UNVERIFIED` in the pull request.

MUST NOT:

- Edit `docs/00-decisions.md` (except the one-sentence result a spike task appends to its row), `theme/` (the Shopify base theme, reference only) or `docs/research/` (except a spike's own new report directory).
- Add a dependency, a test framework, a lint tool, a manifest key, a hook attribute, a prop name, a checker rule id or a CLI option that the specs do not name.
- Use anything on the never-do list of `docs/CONVENTIONS.md` section 15 (shadow DOM, `@ui-sdk/react`, `data-state`, `useId`, margin props, Tailwind utilities in Ripple markup, sections or JSON templates in Liquid, and the rest).
- Skip, `todo` or delete a failing test, weaken an assertion, or add an entry to an exception list to make a check pass.
- Widen the task. A defect outside your task's files is written into the done file, not fixed.
- Touch tasks marked BLOCKED-ON-BEN. They wait for Ben's Liquid preview store, model access or model ids.
- Send repository content, names or data to any outside service other than the package registry and, where a task says so, `https://mock.shop/api`.

## When something does not fit

- The spec and the ledger disagree: the ledger wins. Follow it, and append an entry under `## Ledger issues` at the end of the owning doc.
- The spec is silent or its code does not work: take the smallest change that makes the named gate pass, and describe it under "Deviations and ledger issues" in the pull request.
- You cannot finish: push the branch, open a DRAFT pull request stating what is done, what is not, and the failing command with its last 20 lines of output. Do not write a done file.
- A spike fails its default path: report the verdict `FALLBACK required`; do not apply the fallback in the spike task (`docs/PLAN.md` section 7.2).

## Layout in one screen

```text
docs/            specification, plan, conventions (read-only except docs/plan/done/)
theme/           Shopify base theme, reference only, never edited
src/             identity, runtime, elements, commerce, react, remix, agent, testing, check, cli, gen
css/             layers, tokens, base, generated props and theme
components/<id>/ manifest, CSS, fixtures, html, react, remix, liquid, test
blueprints/<id>/ blueprint.json and one directory per host
icons/ locales/ skills/ guides/ evals/ examples/ test/ bin/
pkg/             build output, never committed
```

## Branch, commit, pull request

Branch `task/<task id>-<slug>`. Commit subject `<task id>: <imperative summary>`. Pull request title `<task id> <task title>`, body with the five headings of `docs/PLAN.md` section 2. Merge only by squash after the `verify` job is green.
