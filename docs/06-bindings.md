# 06 Bindings: React, Remix 3, Liquid blocks, plain HTML

Status: normative. Owner of: the React rules and `useElement`, the Remix rules, the TSX conventions, the Liquid tiers and rules L-1 to L-11, the `html` host (`00-decisions.md` section 9, row `06-bindings.md`; D-033 to D-040).

## 0. Scope and how to read this document

A **binding** is the file (or files) that prints one component's HTML contract in one host. There are four hosts: `html`, `react`, `remix`, `liquid` (D-001). This document tells an implementer how to write, generate and test a binding in each host.

What this document does NOT define, and where to find it:

| Topic | Owner |
|---|---|
| The contract itself: naming, prop-to-attribute mapping (M-rules), responsive grammar, fixtures, canonicalisation | `02-html-contract.md` |
| Package layout, import boundaries, `__PKG__`, build | `01-architecture.md` |
| CSS, tokens, `props.css` | `03-styling-and-tokens.md` |
| `rp-*` and `ui-*` element behaviour, events, live properties | `04-elements.md` |
| Commerce adapter, stores, regions, form dialects, resource shapes | `05-commerce.md` |
| Manifest schema, generator (`pnpm gen`), registry, trailers, CLI, checker | `07-manifest-registry-cli.md` |
| Each component's props, parts and fixtures | `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md`, `12-components-chrome-and-blueprints.md` |
| Test runner, tiers, resource fixtures, the Liquid shim | `13-testing.md` |
| The assembled Liquid theme | `14-liquid-theme.md` |

Reading rules:

1. `00-decisions.md` (the ledger) is law. Where this document and the ledger differ, the difference is listed in "Ledger issues" at the end, and the text here is what an implementer follows.
2. The code in sections 4 to 8 is complete and was executed (section 13). The components used as examples are Button and Stack (kind `static`), Dialog and Tabs (kinds `native` and `ui`), ProductForm and CartLines (kind `commerce`). The example code fixes the PATTERN. The exact props, parts and markup of each component are owned by docs 09 to 12; when a component spec differs from an example here, the component spec wins and the pattern stays.
3. Rule ids defined here: `B-n` (behaviour-free), `T-n` (TSX conventions), `R-n` (React), `X-n` (Remix), `L-n` (Liquid), `H-n` (`html` host), `G-n` (generated versus hand-written), `V-n` (validation), `Q-n` (conformance harness). Ids `M-`, `N-`, `S-`, `F-`, `K-`, `U-`, `C-`, `I-`, `PE-` belong to `02-html-contract.md`.
4. `<pkg>` is the published package name. Repository sources write the literal token `__PKG__`; the registry copy and the project copy contain the real name (`01-architecture.md`).
5. "UNVERIFIED" marks a statement that was not executed or read in source. Every UNVERIFIED statement has a default path that is specified in full.

## 1. What a binding is, and what it is not

A binding is a pure function from props to the contract's markup. All behaviour lives in two places only: native HTML (forms, links, `<dialog>`, `popover`, `<details>`, Invoker Commands) and custom elements (`rp-*` from `<pkg>/elements` and `<pkg>/commerce`, `ui-*` from the UI SDK). A binding prints the markup those two mechanisms need.

### 1.1 Behaviour-free rules

- **B-1** A binding MUST print exactly the contract of `02-html-contract.md` for the given props: same tags, classes, attributes, ids, part order. It MUST NOT add wrapper elements.
- **B-2** A binding MUST NOT contain behaviour: no event handler it defines itself, no timer, no DOM query, no network call, no storage access, no state machine. The one exception is React wiring through `useElement` (R-4, R-5) and `useCart` (R-12), which forwards element events to caller callbacks and reads the store.
- **B-3** A binding MUST NOT compute state the element owns. It prints the INITIAL state from props (I-1 in `02-html-contract.md`) and never updates it.
- **B-4** A binding MUST NOT import anything except the modules in the table below.
- **B-5** A binding MUST NOT print `<script>`, `<style>`, a `style` attribute, or an attribute whose name matches `/^on/i`.
- **B-6** A binding MUST NOT use a host context mechanism to complete a contract (S-7 in `02-html-contract.md`): ids and initial state are passed explicitly to every part (D-020).
- **B-7** Every string a binding prints by itself (not from props or children) MUST come from the manifest locale table (`ripple.<component id>.<key>`, D-038 item 6). In TSX hosts the English default is a default prop value; in Liquid it is `{{ 'ripple.<component id>.<key>' | t }}`.

Allowed imports (B-4). `<sibling>` is another scaffolded binding file in the same directory.

| Host | A binding file MAY import | Nothing else |
|---|---|---|
| `react` | `react`; `__PKG__` (`rv`, `cx`, type `Responsive`); `__PKG__/react` (`useElement`, `useCart`, type `RestProps`); `@shopify/hydrogen` with `import type` only; `./<sibling>` (no file extension) | no `react-dom`, no `@shopify/hydrogen/react`, no `@ui-sdk/*` |
| `remix` | `remix/component` with `import type` only (`Handle`, `RemixNode`), plus the values `unsafeHTML` and `Frame` from `remix/component` where X-9 and X-10 require them; `__PKG__`; `__PKG__/remix` (type `RestProps`); `@shopify/hydrogen` with `import type` only; `./<sibling>.tsx` (WITH the `.tsx` extension) | no `@remix-run/*`, no `@ui-sdk/*` |
| `liquid` | `{% render 'rp-<id>' %}` of Ripple snippets | no `{% block %}`, no `{% section %}`, no `{% include %}` |
| `html` | nothing (static markup) | |

Why the extension differs: the Remix template compiles with `module: NodeNext` and `allowImportingTsExtensions` (`remix/template/tsconfig.json`), where a relative import needs its extension; React projects (Vite, Next.js) resolve extensionless relative imports.

### 1.2 Source lint `bindings-lint`

`pnpm gen --check` MUST run this lint over every file under `components/*/{react,remix,liquid,html}/`. A match of a forbidden pattern fails the check and names the rule. Patterns are JavaScript regular expressions applied to the file text after removing comments (`/* */`, `//`, `{% comment %}...{% endcomment %}`, `{% doc %}...{% enddoc %}`, `<!-- -->`).

| Host | Forbidden pattern | Rule |
|---|---|---|
| `react`, `remix` | `\b(addEventListener\|removeEventListener\|querySelector(All)?\|getElementById\|setTimeout\|setInterval\|requestAnimationFrame\|fetch\|localStorage\|sessionStorage\|XMLHttpRequest)\b` | B-2 |
| `react`, `remix` | `\b(document\|window\|navigator)\s*\.` | B-2 |
| `react`, `remix` | `\bstyle=` and `dangerouslySetInnerHTML` | B-5 |
| `react`, `remix` | `<(script\|style)\b` | B-5 |
| `react` | `\b(useEffect\|useLayoutEffect\|useInsertionEffect\|useContext\|createContext\|useReducer\|useImperativeHandle\|useId\|useTransition\|useOptimistic\|forwardRef\|memo)\b` | B-2, B-6 |
| `react` | `\buseState\s*(<[^>]*>)?\s*\(` not immediately preceded on the same statement by `const [` + one identifier + `] =` (the setter is never taken) | R-3 |
| `react` | `\s(on[A-Z][A-Za-z]*)=\{` inside the start tag of an element whose tag name contains `-` | R-4 |
| `react` | `from "(react-dom[^"]*\|@shopify/hydrogen/react\|@ui-sdk/[^"]*)"` | B-4, R-13 |
| `remix` | `\bhandle\.(?!props\b)` | X-1 |
| `remix` | `\bclientEntry\b`, `\bclassName=`, `\bon\(`, `\bref\(`, `\bcss\(`, `\bmix=` | X-1 |
| `remix` | `from "@remix-run/[^"]*"` and `from "react[^"]*"` | X-1, B-4 |
| `remix` | `\s(on[A-Z][A-Za-z]*)=` | X-7 |
| `liquid` | `\{%-?\s*(block\|section\|sections\|include\|javascript\|stylesheet\|style\|layout\|paginate)\b` | L-12, L-13 |
| `liquid`, `html` | `<(script\|style)\b`, `\sstyle\s*=`, `\son[a-z]+\s*=` | B-5 |
| `liquid` | `block\.id` | L-8 |

A test file `src/gen/bindings-lint.test.ts` MUST hold one failing sample and one passing sample per row.

## 2. File layout

### 2.1 In the Ripple repository

Per component `<id>` (ledger section 5.1). `<Title>` is the manifest `title` (PascalCase).

| Path | Content | Exports / names |
|---|---|---|
| `components/<id>/html/<id>.html` | The `html` host reference file (section 9) | none |
| `components/<id>/react/<id>.tsx` | The React binding: the component and all its parts | `<Title>`, `<Title><Part>`, and the types `<Title>Props`, `<Title><Part>Props` |
| `components/<id>/remix/<id>.tsx` | The Remix binding: same export names as React | same |
| `components/<id>/liquid/blocks/<id>.liquid` | Liquid root block (tiers `block`, `parts`, `resource`) | block name `<id>` |
| `components/<id>/liquid/blocks/<id>-<part>.liquid` | One block per author-placed part (tier `parts`) | block name `<id>-<part>` |
| `components/<id>/liquid/snippets/rp-<id>.liquid` | The markup snippet, when the manifest `liquid.embeddedBy` is non-empty, or tier `snippet` | snippet name `rp-<id>` |

Library files owned by this document:

| Path | Content | Kind |
|---|---|---|
| `src/index.ts` (the exports `rv`, `cx`) and `src/types.ts` (the type `Responsive`) | section 4 | hand-written |
| `src/react/index.ts`, `src/react/use-element.ts`, `src/react/hooks.ts` | section 6.2 | hand-written |
| `src/react/jsx.generated.ts` | React JSX types for custom elements (section 6.3) | generated |
| `src/remix/index.ts` | type `RestProps` (section 7.2); types only | hand-written |
| `src/remix/jsx.generated.ts` | Remix JSX types for custom elements (section 7.2) | generated |
| `src/gen/bindings-lint.ts` | the lint of section 1.2 | hand-written |

- One TSX file per component per host (D-035 item 2). A part is never in its own TSX file.
- A component's markup MUST exist in exactly one Liquid file (L-3).

### 2.2 In the registry and in a project

The registry copy of a binding file is the repository file with every `__PKG__` replaced by the package name and the provenance trailer of D-056 appended (`07-manifest-registry-cli.md`). Nothing else changes. `ripple add` writes:

| Host | Repository file | Project path |
|---|---|---|
| `react`, `remix` | `components/<id>/<host>/<id>.tsx` | `<paths.components>/<id>.tsx` (default `app/components/ripple/<id>.tsx`) |
| `html` | `components/<id>/html/<id>.html` | `<paths.components>/<id>.html` |
| `liquid` | `components/<id>/liquid/blocks/<name>.liquid` | `blocks/<prefix><name>.liquid` (`<prefix>` is empty by default, D-038 item 1) |
| `liquid` | `components/<id>/liquid/snippets/rp-<id>.liquid` | `snippets/rp-<id>.liquid` |

All TSX bindings of a project are in ONE directory, so a sibling import is always `./<id>` (React) or `./<id>.tsx` (Remix).

When the Liquid prefix is not empty, the CLI rewrites nothing inside files, because Ripple Liquid files never name a block (L-12): only the file names change.

## 3. Generated versus hand-written

- **G-1** The table below is complete. "generated" means `pnpm gen` writes the whole file from the manifest and `pnpm gen --check` fails when the committed file differs byte-for-byte. "hand" means a person writes the file; the generator still checks the parts listed in G-3.

| Manifest `kind` | `html` | `react` | `remix` | `liquid` |
|---|---|---|---|---|
| `static` | generated | generated | generated | generated |
| `native` | generated | hand | generated | generated |
| `ui` | generated | hand | generated | generated |
| `commerce` | generated from the hand-written fixture files (section 9) | hand | hand | hand |

- **G-2** For kinds `native` and `ui`, the Remix and Liquid bindings and the `html` reference file are generated because they are static markup: the contract template plus host extras from the manifest (`data-rmx-key`, `data-rmx-preserve-attrs` from `state[]`). The React binding is hand-written because it adds `useElement` wiring (D-003).
- **G-3** For every HAND-written binding file, `pnpm gen --check` MUST verify (and fail with the file name and the first difference when wrong):
  1. TSX: the generated header region is byte-identical to what the generator would print. The header region is everything from the first line that starts with `const ` and ends with ` as const;` down to and including the line `export type <Title>Props = <Title>OwnProps & RestProps<<Title>OwnProps>;`, for the root and for each part. It contains the value arrays and the `OwnProps` interfaces (section 5.2). React-only members (`open`, `value`, `on<X>Change`, D-036) are part of the manifest (`prop.hosts: ["react"]`) and are therefore generated too.
  2. Liquid: the `{% doc %}` block, the `{% schema %}` block and the enumeration guard block (`{%- liquid ... -%}` lines that start with `assign allowed_`, `unless allowed_`, `assign <param> = '<default>'`, `endunless`) are byte-identical to what the generator would print.
  3. The file passes `bindings-lint` (section 1.2).
  4. Every exported name of section 2.1 exists.
- **G-4** A hand-written binding MUST pass the same fixture conformance as a generated one (D-003). There is no exemption list.
- **G-5** A generated file MUST NOT be edited in the repository. A scaffolded copy in a project MAY be edited by the project (it is the project's file; `ripple status` reports it as modified).
- **G-6** Generated TSX and Liquid MUST be formatted exactly as the examples in sections 6 to 8: two-space indent, one attribute per line on the root element, attributes in the order of `02-html-contract.md` section 4.5, double quotes.
- **G-7** The generator's inputs for one binding are: the component's manifest entry and the manifest top-level `scales`. A generated binding MUST NOT depend on another component's entry, except to print an embedded component (manifest `dependencies.embeds`), which is printed as a sibling import in TSX and a `{% render 'rp-<id>' %}` in Liquid.

## 4. Helpers `rv` and `cx`, and the type `Responsive`

D-035 item 7: these two functions are the ONLY helpers a TSX binding may call. They are exported from `<pkg>`.

```ts
// src/types.ts (the part owned by this document)
/** A prop value: one literal of T, or a responsive token string such as "2 md:6". */
export type Responsive<T extends string | number | boolean> = T | (string & {});
```

```ts
// src/index.ts (the part owned by this document)
import { parseResponsive } from "./responsive.ts";
export type { Responsive } from "./types.ts";

const warned = new Set<string>();

declare const process: { env: Record<string, string | undefined> };

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

/**
 * Turns a prop value into the attribute string of the HTML contract.
 * undefined, null and "" give undefined (the attribute is omitted).
 * Numbers and booleans are printed with String(). Strings are returned unchanged.
 * In development, when `allowed` is given, the value is validated with parseResponsive
 * and each problem is reported once with console.warn. The return value is never changed by validation.
 */
export function rv(
  value: string | number | boolean | null | undefined,
  allowed?: readonly string[],
  label?: string,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value);
  if (allowed !== undefined && isDevelopment()) {
    const result = parseResponsive(text, allowed);
    for (const problem of [...result.errors, ...result.warnings]) {
      const message = `[ripple] ${label ?? "prop"}="${text}": ${problem.message}`;
      if (!warned.has(message)) {
        warned.add(message);
        console.warn(message);
      }
    }
  }
  return text;
}

/** Joins class names with one space. Skips undefined, null, false and "". Never de-duplicates or reorders. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  let out = "";
  for (const part of parts) {
    if (typeof part === "string" && part !== "") out = out === "" ? part : `${out} ${part}`;
  }
  return out;
}
```

`parseResponsive(input, allowed)` is defined in `02-html-contract.md` section 5.5 (`src/responsive.ts`).

Rules:

- **V-1** `rv(value)` returns `undefined` for `undefined`, `null` and `""`; otherwise `String(value)`. It never trims, reorders or rewrites. `rv(4)` is `"4"`, `rv(true)` is `"true"`, `rv("2 md:6")` is `"2 md:6"`.
- **V-2** Validation inside `rv` runs only when `allowed` is passed AND `process.env.NODE_ENV !== "production"` (a bundler replaces the expression; where `process` does not exist the `catch` returns `false`). Validation only warns, once per distinct message, with `console.warn`. It MUST NOT throw and MUST NOT change the return value. Production output and development output are therefore identical.
- **V-3** `cx` joins its string arguments with one U+0020, skipping `undefined`, `null`, `false` and `""`. It MUST NOT de-duplicate, sort or trim. `cx("rp-button", undefined)` is `"rp-button"`; `cx("rp-button", "a b")` is `"rp-button a b"` (N-2 in `02-html-contract.md`).
- **V-4** A binding MUST use `rv` for every optional string, number, id, url or responsive prop that becomes an attribute, so that unset values (M-5: `undefined`, `null`, `""`) omit the attribute in the same way in both TSX hosts.

Acceptance (unit test `src/index.test.ts`):

| Call | Result |
|---|---|
| `rv(undefined)`, `rv(null)`, `rv("")` | `undefined` |
| `rv(0)` | `"0"` |
| `rv(false)` | `"false"` |
| `rv("2 md:6", ["2","6"], "Stack.gap")` | `"2 md:6"`, no warning |
| `rv("9 md:6", ["2","6"], "Stack.gap")` in development | `"9 md:6"`, exactly one `console.warn` whose text starts with `[ripple] Stack.gap="9 md:6": `; a second identical call warns zero times |
| the same call with `NODE_ENV=production` | `"9 md:6"`, no warning |
| `cx("a", false, null, undefined, "", "b c")` | `"a b c"` |
| `cx()` | `""` |

## 5. TSX conventions (React and Remix)

React and Remix bindings share one shape. Differences are listed in T-12.

### 5.1 Rules

- **T-1** Components are named exports in PascalCase. Parts are flat named exports `<Title><Part>` (`DialogTitle`, `TabsPanel`). Dot notation MUST NOT be used. Default exports MUST NOT be used (D-035 items 1, 2).
- **T-2** Prop names are the manifest prop names (camelCase). The class prop is `className` in React and `class` in Remix (D-035 item 3).
- **T-3** The destructuring statement lists every own prop by name, then the class prop, then `children` (when the content model is not `none`), then `...rest`.
- **T-4** `{...rest}` is the FIRST attribute of the root element. Every contract attribute comes after it, so a caller cannot override a contract attribute (M-14, D-035 item 4). `rest` is applied to the root element only (M-15). Exception: when the contract root is a custom element whose focusable control is a native descendant and the component spec says so, `rest` goes on that native control (example: `TabsTab`, section 6.6).
- **T-5** The class attribute is `cx("<root class>", className)`. The root class is a literal string.
- **T-6** Text content is `children`. The only string props that carry content are accessible names (`ariaLabel`) and RichText's `html` (D-035 item 5).
- **T-7** A prop of manifest type `boolean` is true only when it `=== true` (M-7). Presence attributes are printed as `name={x === true ? "" : undefined}`; native boolean attributes as `disabled={x === true}`.
- **T-8** A prop of manifest type `enum` that is not responsive is validated INLINE against its value array and falls back to the manifest default (M-6). The expression is exactly:

  ```ts
  const variant = (VARIANT as readonly string[]).includes(variantProp ?? "") ? variantProp : "primary";
  ```

  The prop is destructured as `<name>: <name>Prop`. No helper function is introduced (D-035 item 7). An enum prop with no default prints its attribute as `data-x={(X as readonly string[]).includes(xProp ?? "") ? xProp : undefined}`.
- **T-9** A responsive prop (`enum` or `scale` with `responsive: true`) is printed as `data-<kebab>={rv(<prop>, <ARRAY>, "<Title>.<prop>")}`. When the manifest gives a default, append ` ?? "<default>"`. The value is NOT replaced when invalid: an invalid token matches no rule in `props.css` and has no effect (`02-html-contract.md` section 5).
- **T-10** The polymorphic prop `as` is validated with T-8 and assigned to a capitalised local: `const Tag = (AS as readonly string[]).includes(asProp ?? "") ? (asProp as (typeof AS)[number]) : "div";`. It prints no attribute.
- **T-11** Initial-state props are named `default<X>` (D-035 item 6). Derived ids are template literals built from the explicit id prop (`` `${id}-title` ``), never generated.
- **T-12** Differences between the two TSX hosts, complete list:

| Aspect | React | Remix |
|---|---|---|
| Component shape | `export function X(props: XProps) { ... return <jsx/>; }` | `export function X(handle: Handle<XProps>) { return () => { const {...} = handle.props; return <jsx/>; }; }` |
| Class prop | `className` on native elements; `class` on custom elements (R-7) | `class` everywhere |
| Children type | `ReactNode` | `RemixNode` |
| Attribute spelling on native elements | React names: `tabIndex`, `popoverTarget`, `htmlFor`; but `commandfor`, `command`, `closedby` lowercase (section 6.3) | HTML names, lowercase: `tabindex`, `popovertarget`, `for`, `commandfor`, `command`, `closedby` |
| Hooks | `useRef`, `useState` (initialiser only), `useElement`, `useCart`, only in hand-written files | none |
| Host extras | `suppressHydrationWarning` (R-6) | `data-rmx-key`, `data-rmx-preserve-attrs`, `data-rmx-document` (section 7.3) |
| Callback and controlled props | D-036 | none (X-7) |
| First line | `"use client";` when the file calls a hook (R-14) | never a directive |

### 5.2 Typing

- **T-13** Each binding file is self-contained for types: it declares its own value arrays and prop interfaces. `<pkg>` exports only the generic type `Responsive`. (The project owns the file and can edit its types without touching the package.)
- **T-14** For each enumeration or scale used by a prop, the file declares one module-level `as const` array in SCREAMING_SNAKE_CASE:

  ```ts
  const VARIANT = ["primary", "secondary", "outline", "ghost", "link", "destructive"] as const;
  ```

  An `enum` prop's constant is named after the prop (`variant` gives `VARIANT`; `as` gives `AS`). A `scale` prop's constant is named after the manifest scale (`prop.scale`; the `space` scale gives `SPACE`) and lists the steps as strings; every prop of the file that uses that scale shares it. Constants appear in the order: `AS` when present, scales in first-use order, then enums in manifest prop order, then the universal props `SPAN` and `HIDDEN`.
- **T-15** Prop types, by manifest prop type:

| Manifest type | TypeScript type |
|---|---|
| `enum`, not responsive | `(typeof X)[number]` |
| `enum`, responsive | `Responsive<(typeof X)[number]>` |
| `scale`, responsive or not | `Responsive<(typeof X)[number] \| N>` where `N` is the union of the numeric steps as number literals when every step is numeric; otherwise omit `\| N` |
| `boolean` | `boolean`; responsive boolean (`hidden`): `Responsive<"true" \| "false" \| boolean>` |
| `string`, `id`, `url` | `string` |
| `number` | `number` |
| `object` | the type named by `objectType`, declared in the file as an exported interface that lists ONLY the fields the binding reads (example: `ProductFormProduct`, section 6.7) |

- **T-16** Each component and part declares `interface <Name>OwnProps` (not exported) and `export type <Name>Props = <Name>OwnProps & RestProps<<Name>OwnProps>;`. Required props (manifest `required: true`, and the root `id` when `root.requiresId`) have no `?`. Every other prop is optional.
- **T-17** `RestProps<Own>` is imported from `<pkg>/react` or `<pkg>/remix`. It is every host attribute the component does not define. A prop that is not in `OwnProps` and not a host attribute is a type error; that is how a misspelt prop is caught.
- **T-18** A value outside an enumeration is a type error at the call site AND is handled at run time by T-8 (callers can be JavaScript).

## 6. React binding

### 6.1 Rules

R-1 to R-5 are the ledger's (D-033). R-6 to R-14 are the ledger's supporting rules, numbered here.

- **R-1** Print the upgrade-stable contract (D-002).
- **R-2** The root `id` is a required prop on every component whose manifest says `root.requiresId` (D-020). Parts take the root id through a required prop named after the root component in camelCase (`dialog`, `tabs`).
- **R-3** State attributes are printed from the initial state, captured once with `const [initialX] = useState(() => <initial>);`, and never re-rendered by React. The setter MUST NOT be taken. A part that prints initial state from its own props captures it the same way (`TabsTab`, `TabsPanel`).
- **R-4** Listeners and live properties are attached through a ref with `useElement(ref, { props, events })` from `<pkg>/react`. An `on<Event>` prop or an object-valued prop MUST NOT be written on a custom element in JSX.
- **R-5** A controlled prop is passed in `useElement`'s `props`. While controlled, the event handler calls `event.preventDefault()` (the element then does not change its own state) and calls the caller's callback; the new state arrives as a new prop value and `useElement` assigns it to the element. Controlled props in V1: `open` on Dialog and Drawer; `value` on Tabs and QuantityInput (D-036).
- **R-6** `suppressHydrationWarning` MUST be on every custom element and on every element that a custom element or the browser writes to after parse (the manifest `state[]` rows; for example the `<dialog>` whose `open` attribute changes, the error `<p>` whose `hidden` and text change).
- **R-7** On custom elements, attributes use HTML spellings: `class`, `for`, `tabindex`. On native elements, React spellings (`className`, `htmlFor`, `tabIndex`).
- **R-8** Inside an element that a custom element reads, text is ONE string child. `{a} {b}` adjacency MUST NOT be used (React prints `<!-- -->` separators).
- **R-9** A binding MUST NOT render `inert`, and MUST NOT render a `style` attribute on `<html>`.
- **R-10** A binding MUST NOT conditionally render a node that an element moves, and MUST NOT pass `id={undefined}` to a custom element: an optional id is `id={rv(id)}` on native elements only; a custom element root with an optional id is written with a spread: `{...(rv(id) !== undefined ? { id } : null)}`.
- **R-11** A node whose content or attributes an element writes (parts `count`, `error`, `status`; `data-pending`; `aria-busy`) is rendered by React with CONSTANT props for the lifetime of the component, plus R-6. React MUST NOT also render that value from the store: one writer per node.
- **R-12** React MAY render STRUCTURE from the store (D-045 item 2): which lines exist, in which order. It does so with `useCart(selector, serverValue)`. The element inside each structure node still owns that node's state.
- **R-13** `CartProvider` and every other export of `@shopify/hydrogen/react` MUST NOT be imported or mounted. `@ui-sdk/react` MUST NOT be used.
- **R-14** A React binding file whose code calls a hook (`useRef`, `useState`, `useElement`, `useCart`) MUST have `"use client";` as its first line. A file that calls no hook MUST NOT have the directive, so that it stays usable as a React Server Component.
- **R-15** Native elements (`<dialog>`, `<details>`, `<button>`, `<input>`) are ordinary React elements. A binding does not attach handlers to them; a caller MAY, through `rest` on the root.
- **R-16** Uncontrolled form controls print `defaultValue` / `defaultChecked` (React props) for visible controls. `<input type="hidden">` prints `value` and MUST NOT print `readOnly` (it would add `readonly=""` to the contract).

Decision procedure for a React binding:

1. Manifest `kind` is `static`: the file is generated; no hook; no directive. Stop.
2. The component has a custom element root and neither `events[]` nor controlled props nor store-driven structure: write the markup with R-6, R-7; no hook; no directive. (Example: ProductForm.)
3. It has `events[]` or a controlled prop: add `useRef`, `useElement`, `useState` for R-3, the callbacks of D-036, and `"use client";`. (Examples: Dialog, Tabs.)
4. Its structure depends on the cart: add `useCart` and `"use client";`. (Example: CartLines.)

### 6.2 `<pkg>/react`: `useElement`, `useCart`, `RestProps`

```ts
// src/react/index.ts
import type { HTMLAttributes } from "react";
import "./jsx.generated.ts";

export { useElement } from "./use-element.ts";
export type { UseElementOptions } from "./use-element.ts";
export { useCart } from "./hooks.ts";

/** Props a caller may add to a component root: every React HTML attribute and handler that the component does not define itself. */
export type RestProps<Own> = Omit<HTMLAttributes<HTMLElement>, keyof Own | "className" | "children">;
```

```ts
// src/react/use-element.ts
import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseElementOptions {
  /** Live properties to assign to the element. A value of undefined means "do not touch" (uncontrolled). */
  props?: Record<string, unknown>;
  /** DOM event name (lowercase) to handler. Attached once per name; the latest handler is always called. */
  events?: Record<string, ((event: CustomEvent) => void) | undefined>;
}

export function useElement<E extends HTMLElement>(ref: RefObject<E | null>, options: UseElementOptions): void {
  const { props = {}, events = {} } = options;
  const latest = useRef(events);
  latest.current = events;

  const names = Object.keys(events).sort().join(",");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const off = names
      .split(",")
      .filter(Boolean)
      .map((name) => {
        const listener = (event: Event) => latest.current[name]?.(event as CustomEvent);
        el.addEventListener(name, listener);
        return () => el.removeEventListener(name, listener);
      });
    return () => off.forEach((remove) => remove());
  }, [ref, names]);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let live = true;
    const assign = () => {
      if (!live) return;
      for (const [key, value] of Object.entries(props)) {
        if (value !== undefined && (el as unknown as Record<string, unknown>)[key] !== value) {
          (el as unknown as Record<string, unknown>)[key] = value;
        }
      }
    };
    if (customElements.get(el.localName)) assign();
    else void customElements.whenDefined(el.localName).then(assign);
    return () => {
      live = false;
    };
  });
}
```

```ts
// src/react/hooks.ts
import { useSyncExternalStore } from "react";
import type { CartState, CartStore } from "@shopify/hydrogen";
import { getCommerce } from "../commerce/adapter.ts";

function cartStore(): CartStore | null {
  try {
    const commerce = getCommerce();
    return commerce.usable ? commerce.cart : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

/**
 * Reads a value from the one cart store of the page.
 * `serverValue` is what the server rendered; it is returned during server rendering, during hydration,
 * and whenever the store is not usable.
 * `selector` MUST return a primitive or a reference taken from the state (no new object or array per call).
 */
export function useCart<T>(selector: (state: CartState) => T, serverValue: T): T {
  const store = cartStore();
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => (store ? selector(store.getState()) : serverValue),
    () => serverValue,
  );
}
```

Semantics an implementer MUST keep:

1. `useElement` attaches one DOM listener per event name in an effect keyed on the SORTED LIST OF NAMES, not on the handlers. The latest handler is read from a ref at call time. Passing a new closure each render therefore adds and removes no listener.
2. `useElement` assigns `props` in a layout effect after every render. A value of `undefined` is skipped (uncontrolled). A value equal to the element's current property is skipped. When the element is not yet defined, assignment waits for `customElements.whenDefined(el.localName)`.
3. The element MUST expose each controlled prop as a settable property and MUST dispatch its change event as cancelable before changing state (`04-elements.md`; for `rp-dialog`: property `open`, event `openchange`; for `rp-quantity` and `ui-tabs`: property `value`, event `valuechange`). Event `detail` is `{ value, reason?, source? }` (D-023).
4. A React callback is called as `(value, detail)`: `onOpenChange(detail.value, detail)` (D-036).
5. `useCart` returns `serverValue` on the server, during hydration, and whenever `getCommerce()` throws or `getCommerce().usable` is `false`. The selector MUST return a primitive or a reference held by the state; returning a new object or array per call causes an infinite render loop in `useSyncExternalStore`.
6. `getCommerce()`, its `usable` flag and its `cart` member are owned by `05-commerce.md` (file `src/commerce/adapter.ts`). `cart` has the Hydrogen `CartStore` surface (`getState()`, `subscribe(listener)`; `hydrogen/packages/hydrogen/src/core/cart/cart.ts`, `hydrogen/packages/hydrogen/src/core/cart/state.ts`).
7. `<pkg>/react` exports exactly: `useElement`, `useCart`, the types `UseElementOptions` and `RestProps`, and the JSX augmentation of 6.3. V1 has no other store hook.

### 6.3 JSX types for custom elements and Invoker attributes

`src/react/jsx.generated.ts` is written by `pnpm gen`. It contains one `IntrinsicElements` entry per custom element tag that appears in any manifest contract template, in this order: `rp-*` tags, then `ui-*` tags, each group in the order the tags first appear in the built manifest. A tag attribute that the contract passes as a required attribute is typed required (`value` on `ui-tabs-tab`). It also adds the two Invoker attributes that `@types/react@19.3.0` lacks on `<button>`. With the V1 tag set the file is exactly:

```ts
// src/react/jsx.generated.ts (GENERATED by pnpm gen; do not edit)
import type { HTMLAttributes, ReactNode, Ref } from "react";

type CE<Extra = {}> = Omit<HTMLAttributes<HTMLElement>, "className"> &
  Extra & { class?: string; ref?: Ref<HTMLElement>; children?: ReactNode; tabindex?: number | string; for?: string };

declare module "react" {
  interface ButtonHTMLAttributes<T> {
    commandfor?: string | undefined;
    command?: string | undefined;
  }
  namespace JSX {
    interface IntrinsicElements {
      "rp-dialog": CE;
      "rp-quantity": CE;
      "rp-carousel": CE;
      "rp-navigation-menu": CE;
      "rp-cart": CE;
      "rp-product-form": CE;
      "rp-live": CE;
      "rp-predictive-search": CE;
      "rp-recommendations": CE;
      "ui-tabs": CE<{ "default-value"?: string }>;
      "ui-tabs-list": CE;
      "ui-tabs-tab": CE<{ value: string }>;
      "ui-tabs-panel": CE<{ value: string }>;
      "ui-tooltip": CE;
      "ui-tooltip-trigger": CE;
      "ui-tooltip-content": CE;
      "ui-toast-region": CE;
    }
  }
}
```

Verified spellings on native elements in React 19.3.1 (server and client output identical): `commandfor="x"` and `command="show-modal"` are written lowercase in JSX and printed unchanged; `popoverTarget="x"` prints `popovertarget="x"`; `closedby="any"` is written lowercase and printed unchanged; on a custom element `class="x"` prints `class="x"`.

### 6.4 Static pattern: Button (generated)

`components/button/react/button.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx, rv, type Responsive } from "__PKG__";
import type { RestProps } from "__PKG__/react";

const VARIANT = ["primary", "secondary", "outline", "ghost", "link", "destructive"] as const;
const SIZE = ["sm", "md", "lg"] as const;
const TYPE = ["button", "submit", "reset"] as const;
const SPAN = ["1", "2", "3", "4", "5", "6", "full"] as const;
const HIDDEN = ["true", "false"] as const;

interface ButtonOwnProps {
  variant?: (typeof VARIANT)[number];
  size?: (typeof SIZE)[number];
  type?: (typeof TYPE)[number];
  href?: string;
  target?: string;
  rel?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  pending?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  commandFor?: string;
  command?: string;
  popoverTarget?: string;
  id?: string;
  span?: Responsive<(typeof SPAN)[number] | 1 | 2 | 3 | 4 | 5 | 6>;
  hidden?: Responsive<(typeof HIDDEN)[number] | boolean>;
  className?: string;
  children?: ReactNode;
}
export type ButtonProps = ButtonOwnProps & RestProps<ButtonOwnProps>;

export function Button(props: ButtonProps) {
  const {
    variant: variantProp, size: sizeProp, type: typeProp, href, target, rel, name, value,
    disabled, pending, fullWidth, ariaLabel, commandFor, command, popoverTarget,
    id, span, hidden, className, children, ...rest
  } = props;
  const variant = (VARIANT as readonly string[]).includes(variantProp ?? "") ? variantProp : "primary";
  const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
  const type = (TYPE as readonly string[]).includes(typeProp ?? "") ? typeProp : "button";
  if (rv(href) !== undefined) {
    return (
      <a
        {...rest}
        className={cx("rp-button", className)}
        id={rv(id)}
        href={rv(href)}
        target={rv(target)}
        rel={rv(rel)}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth === true ? "" : undefined}
        data-span={rv(span, SPAN, "Button.span")}
        data-hidden={rv(hidden, HIDDEN, "Button.hidden")}
        data-pending={pending === true ? "" : undefined}
        aria-busy={pending === true ? "true" : undefined}
        aria-disabled={disabled === true ? "true" : undefined}
        tabIndex={disabled === true ? -1 : undefined}
        aria-label={rv(ariaLabel)}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      {...rest}
      className={cx("rp-button", className)}
      id={rv(id)}
      type={type}
      name={rv(name)}
      value={rv(value)}
      disabled={disabled === true}
      commandfor={rv(commandFor)}
      command={rv(command)}
      popoverTarget={rv(popoverTarget)}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth === true ? "" : undefined}
      data-span={rv(span, SPAN, "Button.span")}
      data-hidden={rv(hidden, HIDDEN, "Button.hidden")}
      data-pending={pending === true ? "" : undefined}
      aria-busy={pending === true ? "true" : undefined}
      aria-label={rv(ariaLabel)}
    >
      {children}
    </button>
  );
}
```

What to copy from this pattern: value arrays first; `OwnProps` then `Props`; destructure with `<name>Prop` aliases for enums; guards (T-8); `{...rest}` first; `cx` for the class; `rv` for every optional attribute; `=== true` for booleans; two root elements chosen by `rv(href) !== undefined`; a disabled link is `aria-disabled="true"` plus `tabIndex={-1}`, never the `disabled` attribute.

### 6.5 Static pattern with responsive props: Stack (generated)

`components/stack/react/stack.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx, rv, type Responsive } from "__PKG__";
import type { RestProps } from "__PKG__/react";

const AS = ["div", "section", "ul", "ol", "nav", "header", "footer", "main", "aside", "article", "form"] as const;
const SPACE = ["0", "0.5", "1", "1.5", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24", "32"] as const;
const DIRECTION = ["row", "column"] as const;
const ALIGN = ["start", "center", "end", "stretch", "baseline"] as const;
const JUSTIFY = ["start", "center", "end", "between"] as const;
const SPAN = ["1", "2", "3", "4", "5", "6", "full"] as const;
const HIDDEN = ["true", "false"] as const;

type Space = Responsive<(typeof SPACE)[number] | 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32>;

interface StackOwnProps {
  as?: (typeof AS)[number];
  direction?: Responsive<(typeof DIRECTION)[number]>;
  gap?: Space;
  p?: Space;
  px?: Space;
  py?: Space;
  pt?: Space;
  pb?: Space;
  align?: Responsive<(typeof ALIGN)[number]>;
  justify?: Responsive<(typeof JUSTIFY)[number]>;
  id?: string;
  span?: Responsive<(typeof SPAN)[number] | 1 | 2 | 3 | 4 | 5 | 6>;
  hidden?: Responsive<(typeof HIDDEN)[number] | boolean>;
  className?: string;
  children?: ReactNode;
}
export type StackProps = StackOwnProps & RestProps<StackOwnProps>;

export function Stack(props: StackProps) {
  const { as: asProp, direction, gap, p, px, py, pt, pb, align, justify, id, span, hidden, className, children, ...rest } = props;
  const Tag = (AS as readonly string[]).includes(asProp ?? "") ? (asProp as (typeof AS)[number]) : "div";
  return (
    <Tag
      {...rest}
      className={cx("rp-stack", className)}
      id={rv(id)}
      data-direction={rv(direction, DIRECTION, "Stack.direction") ?? "column"}
      data-gap={rv(gap, SPACE, "Stack.gap")}
      data-p={rv(p, SPACE, "Stack.p")}
      data-px={rv(px, SPACE, "Stack.px")}
      data-py={rv(py, SPACE, "Stack.py")}
      data-pt={rv(pt, SPACE, "Stack.pt")}
      data-pb={rv(pb, SPACE, "Stack.pb")}
      data-align={rv(align, ALIGN, "Stack.align")}
      data-justify={rv(justify, JUSTIFY, "Stack.justify")}
      data-span={rv(span, SPAN, "Stack.span")}
      data-hidden={rv(hidden, HIDDEN, "Stack.hidden")}
    >
      {children}
    </Tag>
  );
}
```

### 6.6 Interactive patterns: Dialog (kind `native`) and Tabs (kind `ui`), hand-written

`components/dialog/react/dialog.tsx`:

```tsx
"use client";
import { useRef, useState, type ReactNode } from "react";
import { cx } from "__PKG__";
import { useElement, type RestProps } from "__PKG__/react";

const SIZE = ["sm", "md", "lg", "full"] as const;

export interface OpenChangeDetail {
  value: boolean;
  reason?: string;
  source?: string;
}

interface DialogOwnProps {
  /** Required. Printed on the <dialog>. The title id is `<id>-title`. */
  id: string;
  size?: (typeof SIZE)[number];
  defaultOpen?: boolean;
  /** Controlled open state. React only. */
  open?: boolean;
  /** React only. */
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
  className?: string;
  children?: ReactNode;
}
export type DialogProps = DialogOwnProps & RestProps<DialogOwnProps>;

export function Dialog(props: DialogProps) {
  const { id, size: sizeProp, defaultOpen, open, onOpenChange, className, children, ...rest } = props;
  const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
  const ref = useRef<HTMLElement>(null);
  const controlled = open !== undefined;
  // R-3: the initial state is captured once and never recomputed.
  const [initialOpen] = useState(() => (open ?? defaultOpen) === true);

  // R-4, R-5: listeners and live properties go through the ref.
  useElement(ref, {
    props: { open },
    events: {
      openchange: (event) => {
        if (controlled) event.preventDefault();
        onOpenChange?.(event.detail.value, event.detail);
      },
    },
  });

  return (
    <rp-dialog {...rest} ref={ref} class={cx("rp-dialog", className)} data-slot="rp-dialog" suppressHydrationWarning>
      <dialog
        className="rp-dialog-panel"
        id={id}
        data-size={size}
        aria-labelledby={`${id}-title`}
        closedby="any"
        data-default-open={initialOpen ? "" : undefined}
        suppressHydrationWarning
      >
        {children}
      </dialog>
    </rp-dialog>
  );
}

interface DialogTitleOwnProps {
  /** Required. The id of the Dialog this title belongs to. */
  dialog: string;
  className?: string;
  children?: ReactNode;
}
export type DialogTitleProps = DialogTitleOwnProps & RestProps<DialogTitleOwnProps>;

export function DialogTitle(props: DialogTitleProps) {
  const { dialog, className, children, ...rest } = props;
  return (
    <h2 {...rest} className={cx("rp-dialog-title", className)} id={`${dialog}-title`}>
      {children}
    </h2>
  );
}
```

Notes:

- The opener is not part of this file. A caller opens the dialog with `<Button commandFor="size-guide" command="show-modal">` (D-008); no React state is needed.
- Uncontrolled use passes neither `open` nor `onOpenChange`. `useElement` then assigns nothing and the handler only forwards.
- `defaultOpen` prints `data-default-open=""` (D-008 item 5); the element opens the dialog at upgrade. React never prints the `open` attribute.

`components/tabs/react/tabs.tsx`:

```tsx
"use client";
import { useRef, useState, type ReactNode } from "react";
import { cx, rv } from "__PKG__";
import { useElement, type RestProps } from "__PKG__/react";

export interface ValueChangeDetail {
  value: string;
  reason?: string;
  source?: string;
}

interface TabsOwnProps {
  /** Required. Part ids are `<id>-tab-<value>` and `<id>-panel-<value>`. */
  id: string;
  /** The value of the tab that is selected in the server HTML. Required. */
  defaultValue: string;
  /** Controlled value. React only. */
  value?: string;
  /** React only. */
  onValueChange?: (value: string, detail: ValueChangeDetail) => void;
  className?: string;
  children?: ReactNode;
}
export type TabsProps = TabsOwnProps & RestProps<TabsOwnProps>;

export function Tabs(props: TabsProps) {
  const { id, defaultValue, value, onValueChange, className, children, ...rest } = props;
  const ref = useRef<HTMLElement>(null);
  const controlled = value !== undefined;
  const [initialValue] = useState(() => value ?? defaultValue); // R-3

  useElement(ref, {
    props: { value },
    events: {
      valuechange: (event) => {
        if (controlled) event.preventDefault();
        onValueChange?.(event.detail.value, event.detail);
      },
    },
  });

  return (
    <ui-tabs
      {...rest}
      ref={ref}
      class={cx("rp-tabs", className)}
      id={id}
      default-value={initialValue}
      data-activation-direction="none"
      data-orientation="horizontal"
      data-slot="tabs"
      suppressHydrationWarning
    >
      {children}
    </ui-tabs>
  );
}

interface TabsListOwnProps {
  ariaLabel: string;
  className?: string;
  children?: ReactNode;
}
export type TabsListProps = TabsListOwnProps & RestProps<TabsListOwnProps>;

export function TabsList(props: TabsListProps) {
  const { ariaLabel, className, children, ...rest } = props;
  return (
    <ui-tabs-list
      {...rest}
      class={cx("rp-tabs-list", className)}
      aria-label={rv(ariaLabel)}
      role="tablist"
      data-activation-direction="none"
      data-orientation="horizontal"
      data-slot="tabs-list"
      suppressHydrationWarning
    >
      {children}
    </ui-tabs-list>
  );
}

interface TabsTabOwnProps {
  /** Required. The id of the Tabs root. */
  tabs: string;
  value: string;
  /** True on the tab whose value equals the root's defaultValue. */
  selected?: boolean;
  className?: string;
  children?: ReactNode;
}
export type TabsTabProps = TabsTabOwnProps & RestProps<TabsTabOwnProps>;

export function TabsTab(props: TabsTabProps) {
  const { tabs, value, selected, className, children, ...rest } = props;
  const [initialSelected] = useState(() => selected === true); // R-3
  return (
    <ui-tabs-tab value={value} role="none" suppressHydrationWarning>
      <button
        {...rest}
        className={cx("rp-tabs-tab", className)}
        type="button"
        role="tab"
        id={`${tabs}-tab-${value}`}
        aria-controls={initialSelected ? `${tabs}-panel-${value}` : undefined}
        aria-selected={initialSelected ? "true" : "false"}
        tabIndex={initialSelected ? 0 : -1}
        data-selected={initialSelected ? "" : undefined}
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs-tab"
        suppressHydrationWarning
      >
        {children}
      </button>
    </ui-tabs-tab>
  );
}

interface TabsPanelOwnProps {
  tabs: string;
  value: string;
  selected?: boolean;
  className?: string;
  children?: ReactNode;
}
export type TabsPanelProps = TabsPanelOwnProps & RestProps<TabsPanelOwnProps>;

export function TabsPanel(props: TabsPanelProps) {
  const { tabs, value, selected, className, children, ...rest } = props;
  const [initialSelected] = useState(() => selected === true); // R-3
  if (initialSelected) {
    return (
      <ui-tabs-panel
        {...rest}
        class={cx("rp-tabs-panel", className)}
        value={value}
        role="tabpanel"
        id={`${tabs}-panel-${value}`}
        aria-labelledby={`${tabs}-tab-${value}`}
        tabindex="0"
        data-selected=""
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs-panel"
        suppressHydrationWarning
      >
        {children}
      </ui-tabs-panel>
    );
  }
  return (
    <ui-tabs-panel {...rest} class={cx("rp-tabs-panel", className)} value={value} hidden data-slot="tabs-panel" suppressHydrationWarning>
      {children}
    </ui-tabs-panel>
  );
}
```

Notes:

- `TabsTab` puts `rest` and the class on the native `<button>` (the focusable control), not on `ui-tabs-tab` (T-4 exception).
- The caller passes `selected` to the tab AND the panel whose `value` equals `defaultValue` (S-7: no context). Both capture it once (R-3); after hydration the element owns selection.
- An unselected panel prints only `class`, `value`, `hidden`, `data-slot`: the verified upgrade snapshot (`02-html-contract.md` section 11.9, Ledger issues item 12 there).

### 6.7 Commerce patterns: ProductForm and CartLines (hand-written)

`components/product-form/react/product-form.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "__PKG__";
import type { RestProps } from "__PKG__/react";

/** The fields ProductForm reads. The full resource shape is defined in 05-commerce.md. */
export interface ProductFormProduct {
  selectedOrFirstAvailableVariant: { id: string };
}

interface ProductFormOwnProps {
  /** Required. Printed on the <form>. */
  id: string;
  product: ProductFormProduct;
  /** The route where createCartServerHandlers() is mounted. */
  action?: string;
  className?: string;
  children?: ReactNode;
}
export type ProductFormProps = ProductFormOwnProps & RestProps<ProductFormOwnProps>;

export function ProductForm(props: ProductFormProps) {
  const { id, product, action = "/api/cart", className, children, ...rest } = props;
  return (
    <rp-product-form {...rest} class={cx("rp-product-form", className)} data-slot="rp-product-form" suppressHydrationWarning>
      <form className="rp-product-form-fields" id={id} method="post" action={action} suppressHydrationWarning>
        <input type="hidden" name="merchandiseId" value={product.selectedOrFirstAvailableVariant.id} data-rp-field="merchandise-id" />
        {children}
        <p className="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden suppressHydrationWarning></p>
      </form>
    </rp-product-form>
  );
}
```

Notes:

- No hook and no directive: the form is a real form that posts to the cart route when JavaScript never loads (PE-2 in `02-html-contract.md`); `rp-product-form` intercepts the submit when it is defined.
- The error `<p>` is rendered empty and `hidden` with constant props; the element writes its text and removes `hidden` (R-11).
- The field name `merchandiseId`, the default action and the hook attribute `data-rp-field` belong to the hydrogen form dialect (D-043; `05-commerce.md`).

`components/cart-lines/react/cart-lines.tsx`:

```tsx
"use client";
import type { ReactNode } from "react";
import type { CartData } from "@shopify/hydrogen";
import { cx } from "__PKG__";
import { useCart, type RestProps } from "__PKG__/react";

type CartLineData = CartData["lines"]["nodes"][number];

interface CartLinesOwnProps {
  /** The cart the server loaded. It is what the server HTML shows. */
  cart: CartData;
  /** Renders one line. The CartLine contract is owned by 11-components-commerce.md. */
  renderLine: (line: CartLineData) => ReactNode;
  className?: string;
}
export type CartLinesProps = CartLinesOwnProps & RestProps<CartLinesOwnProps>;

export function CartLines(props: CartLinesProps) {
  const { cart, renderLine, className, ...rest } = props;
  // Structure comes from the store (D-045 item 2). The selector returns a reference held by the state.
  const lines = useCart((state) => state.data.lines.nodes, cart.lines.nodes);
  return (
    <rp-cart {...rest} class={cx("rp-cart-lines", className)} data-slot="rp-cart" suppressHydrationWarning>
      {lines.map((line) => renderLine(line))}
    </rp-cart>
  );
}
```

Notes:

- This is the ONLY place React re-renders from the store: the list of lines (R-12). `CartData` is a type export of `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/index.ts`).
- `renderLine` is how this example stays independent of the CartLine contract; `11-components-commerce.md` decides whether the shipped `CartLines` takes `renderLine` or imports `CartLine` from `./cart-line` directly. Either way the store read is the one line shown.
- Each rendered line MUST carry `key` equal to the line id inside `renderLine`'s result (React list rule) and the `data-rp-line` hook attribute required by the contract.

## 7. Remix 3 binding

### 7.1 Rules

- **X-1** A Ripple component in Remix is a plain server component: `export function X(handle: Handle<XProps>) { return () => { ... }; }`. It reads `handle.props` and nothing else on `handle`. It MUST NOT use `clientEntry`, `on()`, `ref()`, `css()`, the `mix` prop, or `@remix-run/ui` (D-034 item 1).
- **X-2** Props are read INSIDE the returned render function (`const {...} = handle.props;`), never in the setup function, so a re-render with new props prints new markup.
- **X-3** Every component ROOT element whose tag is `ui-*` or `rp-*` prints `data-rmx-key` (part elements do not). Its value is the component's required id when the manifest says `root.requiresId`; otherwise the value of the optional prop `rmxKey`, and the attribute is omitted when `rmxKey` is unset (`data-rmx-key={rv(rmxKey)}`). `rmxKey` exists only in the Remix binding of components whose custom element root has no required id.
- **X-4** Every element that a custom element or the browser writes to prints `data-rmx-preserve-attrs="<names>"`. `<names>` is the set of attribute names of the manifest `state[]` rows whose target is that element and whose writer is the element or the browser, joined with one space. Order is not significant; the generator prints each group sorted ascending by code point and MAY hold a group in a module-level string constant. Example: the `<dialog>` of Dialog prints `data-rmx-preserve-attrs="open"`.
- **X-5** Forms that post to the cart route, and links and forms to account routes and to `/checkout`, print the bare attribute `data-rmx-document` (D-034 item 3).
- **X-6** The document shell prints `<html data-rmx-preserve-attrs="style">` (D-034 item 2). The shell is owned by `12-components-chrome-and-blueprints.md`; this rule is restated because morph navigation breaks scroll locking without it.
- **X-7** Remix components are uncontrolled and have no callback props (D-034 item 7). Code that needs to react listens to the DOM events of `04-elements.md`.
- **X-8** `data-rmx-*` attributes are host extras. The canonicaliser removes them before comparison (K-rules in `02-html-contract.md` section 12), so they never appear in fixtures.
- **X-9** RichText prints its HTML with `innerHTML={unsafeHTML(html)}`, `unsafeHTML` imported from `remix/component` (D-034 item 6). No other binding uses `innerHTML`.
- **X-10** Structural commerce updates use named blocking `<Frame>` regions reloaded by the Remix adapter on `rp:refresh` (D-046). Which component owns which Frame, the Frame names and the route that serves them are owned by `05-commerce.md`. A binding that owns a region imports `Frame` from `remix/component` and prints the region root with `data-rp-region`.
- **X-11** `ripple.js` is loaded from `public/ripple/` with a plain `<script type="module" src="/ripple/ripple.js">` in the document shell; it MUST NOT be imported by a binding or passed through the Remix asset server (D-034 item 5).
- **X-12** Attribute names are HTML names in lowercase (`class`, `tabindex`, `for`, `popovertarget`, `commandfor`). Boolean attributes are passed as `true` or as a bare JSX attribute.

### 7.2 `<pkg>/remix`

`src/remix/**` contains types only and no runtime code. It has exactly one external import, and it is type-only: `import type {} from "remix/component";`. That line loads Remix's global `JSX` namespace so the files type-check in the Ripple repository, where the root `tsconfig.json` is not a Remix project; it is erased from the JavaScript output, so Remix stays an undeclared peer at run time (D-052). `remix` is a devDependency of the repository. Without that line `tsc` fails with "Property 'div' does not exist on type 'IntrinsicElements'" (verified). This needs one change in `01-architecture.md` (Ledger issues, item 4).

```ts
// src/remix/index.ts
import type {} from "remix/component";
import "./jsx.generated.ts";

/** Props a caller may add to a component root: every Remix host prop that the component does not define itself. */
export type RestProps<Own> = Omit<JSX.IntrinsicElements["div"], keyof Own | "class" | "className" | "children" | "mix" | "role">;
```

`mix` and `role` are omitted from `RestProps` because their types differ between host tags in `remix@3.3.0`, which makes a spread onto a tag other than `div` a type error.

```ts
// src/remix/jsx.generated.ts (GENERATED by pnpm gen; do not edit)
import type {} from "remix/component";

type El<Extra = {}> = JSX.IntrinsicElements["span"] & Extra;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "rp-dialog": El;
      "rp-quantity": El;
      "rp-carousel": El;
      "rp-navigation-menu": El;
      "rp-cart": El;
      "rp-product-form": El;
      "rp-live": El;
      "rp-predictive-search": El;
      "rp-recommendations": El;
      "ui-tabs": El<{ "default-value"?: string }>;
      "ui-tabs-list": El;
      "ui-tabs-tab": El<{ value: string }>;
      "ui-tabs-panel": El<{ value: string }>;
      "ui-tooltip": El;
      "ui-tooltip-trigger": El;
      "ui-tooltip-content": El;
      "ui-toast-region": El;
    }
  }
}
```

`<pkg>/remix` exports exactly: the type `RestProps` and this JSX augmentation. There are no runtime helpers.

### 7.3 Host extras, complete table

| Attribute | Printed on | Value | Source |
|---|---|---|---|
| `data-rmx-key` | every `ui-*` and `rp-*` root | the root id, or `rmxKey` | X-3 |
| `data-rmx-preserve-attrs` | every element with element-written or browser-written state | state attribute names | X-4, manifest `state[]` |
| `data-rmx-document` | cart forms; links and forms to account routes and `/checkout` | bare | X-5 |

For Tabs the generated constants are (from the manifest `state[]` of Tabs; the list is owned by `10-components-interactive.md`):

```ts
const TAB_STATE = "aria-controls aria-selected data-selected tabindex";
const PANEL_STATE = "aria-labelledby data-activation-direction data-orientation data-selected hidden id role tabindex";
const DIRECTION_STATE = "data-activation-direction";
```

### 7.4 Static pattern: Button (generated)

`components/button/remix/button.tsx`:

```tsx
import type { Handle, RemixNode } from "remix/component";
import { cx, rv, type Responsive } from "__PKG__";
import type { RestProps } from "__PKG__/remix";

const VARIANT = ["primary", "secondary", "outline", "ghost", "link", "destructive"] as const;
const SIZE = ["sm", "md", "lg"] as const;
const TYPE = ["button", "submit", "reset"] as const;
const SPAN = ["1", "2", "3", "4", "5", "6", "full"] as const;
const HIDDEN = ["true", "false"] as const;

interface ButtonOwnProps {
  variant?: (typeof VARIANT)[number];
  size?: (typeof SIZE)[number];
  type?: (typeof TYPE)[number];
  href?: string;
  target?: string;
  rel?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  pending?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  commandFor?: string;
  command?: string;
  popoverTarget?: string;
  id?: string;
  span?: Responsive<(typeof SPAN)[number] | 1 | 2 | 3 | 4 | 5 | 6>;
  hidden?: Responsive<(typeof HIDDEN)[number] | boolean>;
  class?: string;
  children?: RemixNode;
}
export type ButtonProps = ButtonOwnProps & RestProps<ButtonOwnProps>;

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const {
      variant: variantProp, size: sizeProp, type: typeProp, href, target, rel, name, value,
      disabled, pending, fullWidth, ariaLabel, commandFor, command, popoverTarget,
      id, span, hidden, class: className, children, ...rest
    } = handle.props;
    const variant = (VARIANT as readonly string[]).includes(variantProp ?? "") ? variantProp : "primary";
    const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
    const type = (TYPE as readonly string[]).includes(typeProp ?? "") ? typeProp : "button";
    if (rv(href) !== undefined) {
      return (
        <a
          {...rest}
          class={cx("rp-button", className)}
          id={rv(id)}
          href={rv(href)}
          target={rv(target)}
          rel={rv(rel)}
          data-variant={variant}
          data-size={size}
          data-full-width={fullWidth === true ? "" : undefined}
          data-span={rv(span, SPAN, "Button.span")}
          data-hidden={rv(hidden, HIDDEN, "Button.hidden")}
          data-pending={pending === true ? "" : undefined}
          aria-busy={pending === true ? "true" : undefined}
          aria-disabled={disabled === true ? "true" : undefined}
          tabIndex={disabled === true ? -1 : undefined}
          aria-label={rv(ariaLabel)}
        >
          {children}
        </a>
      );
    }
    return (
      <button
        {...rest}
        class={cx("rp-button", className)}
        id={rv(id)}
        type={type}
        name={rv(name)}
        value={rv(value)}
        disabled={disabled === true}
        commandfor={rv(commandFor)}
        command={rv(command)}
        popovertarget={rv(popoverTarget)}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth === true ? "" : undefined}
        data-span={rv(span, SPAN, "Button.span")}
        data-hidden={rv(hidden, HIDDEN, "Button.hidden")}
        data-pending={pending === true ? "" : undefined}
        aria-busy={pending === true ? "true" : undefined}
        aria-label={rv(ariaLabel)}
      >
        {children}
      </button>
    );
  };
}
```

### 7.5 Static pattern with responsive props: Stack (generated)

`components/stack/remix/stack.tsx`:

```tsx
import type { Handle, RemixNode } from "remix/component";
import { cx, rv, type Responsive } from "__PKG__";
import type { RestProps } from "__PKG__/remix";

const AS = ["div", "section", "ul", "ol", "nav", "header", "footer", "main", "aside", "article", "form"] as const;
const SPACE = ["0", "0.5", "1", "1.5", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24", "32"] as const;
const DIRECTION = ["row", "column"] as const;
const ALIGN = ["start", "center", "end", "stretch", "baseline"] as const;
const JUSTIFY = ["start", "center", "end", "between"] as const;
const SPAN = ["1", "2", "3", "4", "5", "6", "full"] as const;
const HIDDEN = ["true", "false"] as const;

type Space = Responsive<(typeof SPACE)[number] | 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32>;

interface StackOwnProps {
  as?: (typeof AS)[number];
  direction?: Responsive<(typeof DIRECTION)[number]>;
  gap?: Space;
  p?: Space;
  px?: Space;
  py?: Space;
  pt?: Space;
  pb?: Space;
  align?: Responsive<(typeof ALIGN)[number]>;
  justify?: Responsive<(typeof JUSTIFY)[number]>;
  id?: string;
  span?: Responsive<(typeof SPAN)[number] | 1 | 2 | 3 | 4 | 5 | 6>;
  hidden?: Responsive<(typeof HIDDEN)[number] | boolean>;
  class?: string;
  children?: RemixNode;
}
export type StackProps = StackOwnProps & RestProps<StackOwnProps>;

export function Stack(handle: Handle<StackProps>) {
  return () => {
    const { as: asProp, direction, gap, p, px, py, pt, pb, align, justify, id, span, hidden, class: className, children, ...rest } = handle.props;
    const Tag = (AS as readonly string[]).includes(asProp ?? "") ? (asProp as (typeof AS)[number]) : "div";
    return (
      <Tag
        {...rest}
        class={cx("rp-stack", className)}
        id={rv(id)}
        data-direction={rv(direction, DIRECTION, "Stack.direction") ?? "column"}
        data-gap={rv(gap, SPACE, "Stack.gap")}
        data-p={rv(p, SPACE, "Stack.p")}
        data-px={rv(px, SPACE, "Stack.px")}
        data-py={rv(py, SPACE, "Stack.py")}
        data-pt={rv(pt, SPACE, "Stack.pt")}
        data-pb={rv(pb, SPACE, "Stack.pb")}
        data-align={rv(align, ALIGN, "Stack.align")}
        data-justify={rv(justify, JUSTIFY, "Stack.justify")}
        data-span={rv(span, SPAN, "Stack.span")}
        data-hidden={rv(hidden, HIDDEN, "Stack.hidden")}
      >
        {children}
      </Tag>
    );
  };
}
```

### 7.6 Interactive patterns: Dialog and Tabs (generated)

`components/dialog/remix/dialog.tsx`:

```tsx
import type { Handle, RemixNode } from "remix/component";
import { cx } from "__PKG__";
import type { RestProps } from "__PKG__/remix";

const SIZE = ["sm", "md", "lg", "full"] as const;

interface DialogOwnProps {
  /** Required. Printed on the <dialog>. The title id is `<id>-title`. */
  id: string;
  size?: (typeof SIZE)[number];
  defaultOpen?: boolean;
  class?: string;
  children?: RemixNode;
}
export type DialogProps = DialogOwnProps & RestProps<DialogOwnProps>;

export function Dialog(handle: Handle<DialogProps>) {
  return () => {
    const { id, size: sizeProp, defaultOpen, class: className, children, ...rest } = handle.props;
    const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
    return (
      <rp-dialog {...rest} class={cx("rp-dialog", className)} data-slot="rp-dialog" data-rmx-key={id}>
        <dialog
          class="rp-dialog-panel"
          id={id}
          data-size={size}
          aria-labelledby={`${id}-title`}
          closedby="any"
          data-default-open={defaultOpen === true ? "" : undefined}
          data-rmx-preserve-attrs="open"
        >
          {children}
        </dialog>
      </rp-dialog>
    );
  };
}

interface DialogTitleOwnProps {
  /** Required. The id of the Dialog this title belongs to. */
  dialog: string;
  class?: string;
  children?: RemixNode;
}
export type DialogTitleProps = DialogTitleOwnProps & RestProps<DialogTitleOwnProps>;

export function DialogTitle(handle: Handle<DialogTitleProps>) {
  return () => {
    const { dialog, class: className, children, ...rest } = handle.props;
    return (
      <h2 {...rest} class={cx("rp-dialog-title", className)} id={`${dialog}-title`}>
        {children}
      </h2>
    );
  };
}
```

`components/tabs/remix/tabs.tsx`:

```tsx
import type { Handle, RemixNode } from "remix/component";
import { cx, rv } from "__PKG__";
import type { RestProps } from "__PKG__/remix";

// Attribute names UI SDK writes after upgrade (manifest `state[]` of Tabs). Remix must not overwrite them when it morphs.
const TAB_STATE = "aria-controls aria-selected data-selected tabindex";
const PANEL_STATE = "aria-labelledby data-activation-direction data-orientation data-selected hidden id role tabindex";
const DIRECTION_STATE = "data-activation-direction";

interface TabsOwnProps {
  id: string;
  defaultValue: string;
  class?: string;
  children?: RemixNode;
}
export type TabsProps = TabsOwnProps & RestProps<TabsOwnProps>;

export function Tabs(handle: Handle<TabsProps>) {
  return () => {
    const { id, defaultValue, class: className, children, ...rest } = handle.props;
    return (
      <ui-tabs
        {...rest}
        class={cx("rp-tabs", className)}
        id={id}
        default-value={defaultValue}
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs"
        data-rmx-key={id}
        data-rmx-preserve-attrs={DIRECTION_STATE}
      >
        {children}
      </ui-tabs>
    );
  };
}

interface TabsListOwnProps {
  ariaLabel: string;
  class?: string;
  children?: RemixNode;
}
export type TabsListProps = TabsListOwnProps & RestProps<TabsListOwnProps>;

export function TabsList(handle: Handle<TabsListProps>) {
  return () => {
    const { ariaLabel, class: className, children, ...rest } = handle.props;
    return (
      <ui-tabs-list
        {...rest}
        class={cx("rp-tabs-list", className)}
        aria-label={rv(ariaLabel)}
        role="tablist"
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs-list"
        data-rmx-preserve-attrs={DIRECTION_STATE}
      >
        {children}
      </ui-tabs-list>
    );
  };
}

interface TabsTabOwnProps {
  tabs: string;
  value: string;
  selected?: boolean;
  class?: string;
  children?: RemixNode;
}
export type TabsTabProps = TabsTabOwnProps & RestProps<TabsTabOwnProps>;

export function TabsTab(handle: Handle<TabsTabProps>) {
  return () => {
    const { tabs, value, selected, class: className, children, ...rest } = handle.props;
    const isSelected = selected === true;
    return (
      <ui-tabs-tab value={value} role="none">
        <button
          {...rest}
          class={cx("rp-tabs-tab", className)}
          type="button"
          role="tab"
          id={`${tabs}-tab-${value}`}
          aria-controls={isSelected ? `${tabs}-panel-${value}` : undefined}
          aria-selected={isSelected ? "true" : "false"}
          tabindex={isSelected ? 0 : -1}
          data-selected={isSelected ? "" : undefined}
          data-activation-direction="none"
          data-orientation="horizontal"
          data-slot="tabs-tab"
          data-rmx-preserve-attrs={`${TAB_STATE} ${DIRECTION_STATE}`}
        >
          {children}
        </button>
      </ui-tabs-tab>
    );
  };
}

interface TabsPanelOwnProps {
  tabs: string;
  value: string;
  selected?: boolean;
  class?: string;
  children?: RemixNode;
}
export type TabsPanelProps = TabsPanelOwnProps & RestProps<TabsPanelOwnProps>;

export function TabsPanel(handle: Handle<TabsPanelProps>) {
  return () => {
    const { tabs, value, selected, class: className, children, ...rest } = handle.props;
    if (selected === true) {
      return (
        <ui-tabs-panel
          {...rest}
          class={cx("rp-tabs-panel", className)}
          value={value}
          role="tabpanel"
          id={`${tabs}-panel-${value}`}
          aria-labelledby={`${tabs}-tab-${value}`}
          tabindex={0}
          data-selected=""
          data-activation-direction="none"
          data-orientation="horizontal"
          data-slot="tabs-panel"
          data-rmx-preserve-attrs={PANEL_STATE}
        >
          {children}
        </ui-tabs-panel>
      );
    }
    return (
      <ui-tabs-panel {...rest} class={cx("rp-tabs-panel", className)} value={value} hidden data-slot="tabs-panel" data-rmx-preserve-attrs={PANEL_STATE}>
        {children}
      </ui-tabs-panel>
    );
  };
}
```

### 7.7 Commerce pattern: ProductForm (hand-written)

`components/product-form/remix/product-form.tsx`:

```tsx
import type { Handle, RemixNode } from "remix/component";
import { cx } from "__PKG__";
import type { RestProps } from "__PKG__/remix";

/** The fields ProductForm reads. The full resource shape is defined in 05-commerce.md. */
export interface ProductFormProduct {
  selectedOrFirstAvailableVariant: { id: string };
}

interface ProductFormOwnProps {
  /** Required. Printed on the <form>. */
  id: string;
  product: ProductFormProduct;
  /** The route where createCartServerHandlers() is mounted. */
  action?: string;
  class?: string;
  children?: RemixNode;
}
export type ProductFormProps = ProductFormOwnProps & RestProps<ProductFormOwnProps>;

export function ProductForm(handle: Handle<ProductFormProps>) {
  return () => {
    const { id, product, action = "/api/cart", class: className, children, ...rest } = handle.props;
    return (
      <rp-product-form {...rest} class={cx("rp-product-form", className)} data-slot="rp-product-form" data-rmx-key={id}>
        <form class="rp-product-form-fields" id={id} method="post" action={action} data-rmx-document>
          <input type="hidden" name="merchandiseId" value={product.selectedOrFirstAvailableVariant.id} data-rp-field="merchandise-id" />
          {children}
          <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden data-rmx-preserve-attrs="hidden"></p>
        </form>
      </rp-product-form>
    );
  };
}
```

## 8. Liquid block binding

### 8.1 Tiers

Each component maps to Liquid by exactly one tier, recorded in the manifest key `liquid.tier` (D-037).

| Tier | Files | Outlet | Use for |
|---|---|---|---|
| `block` | `blocks/<id>.liquid`; plus `snippets/rp-<id>.liquid` when `liquid.embeddedBy` is non-empty | one `{{ content }}` | a primitive with children (Button, Stack) |
| `parts` | `blocks/<id>.liquid` and one `blocks/<id>-<part>.liquid` per author-placed part | one `{{ content }}` per file | a compound (Dialog, Tabs) |
| `resource` | ONE `blocks/<id>.liquid`; the default body is built from `rp-*` snippets | `{{ content }}` replaces the default body when not blank | a component that renders a Shopify resource or a fixed commerce structure (ProductForm) |
| `snippet` | `snippets/rp-<id>.liquid` only | none | Icon only (D-068) |

Decision procedure for the tier of a new component: (1) it is Icon: `snippet`. (2) It takes a Shopify resource or is in the list of D-037 item 3: `resource`. (3) Its manifest has parts with `authoredBy: "author"`: `parts`. (4) Otherwise: `block`.

### 8.2 Rules

L-1 to L-11 are the rules of `ripple/docs/research/liquid-blocks-partials.md` with the choices of D-038 applied. L-12 to L-18 are added by this document.

- **L-1 File per component or part.** Every component a template author calls is `blocks/<id>.liquid`. A component of tier `parts` has one block file per author-placed part, named `<id>-<part>`, matching the contract class `rp-<id>-<part>`.
- **L-2 Prefix.** Block file names are unprefixed. The CLI flag `--prefix` (D-038 item 1) changes block FILE names only. Snippet names are always `rp-<id>`; partial names are always `rp-<region>`.
- **L-3 One source of markup.** When the manifest `liquid.embeddedBy` is non-empty, the markup is in `snippets/rp-<id>.liquid` and the block file is a thin wrapper: `{% doc %}`, ONE `{% render 'rp-<id>', ... %}` that passes every param by name in manifest prop order followed by `class`, `attributes`, `content`, then `{% schema %}`. Otherwise the markup is in the block file. A component's markup MUST exist in exactly one file.
- **L-4 Budget.** Ripple-owned block files MUST NOT exceed 150, parts included (D-038 item 7). `pnpm gen --check` counts `components/*/liquid/blocks/*.liquid` and fails above 150.
- **L-5 Names.** A Liquid param name is the manifest `prop.liquid.name`; its default is the prop name in snake_case (`fullWidth` gives `full_width`). The generator MUST reject these names: `true`, `false`, `nil`, `blank`, `empty`, `content`, `block`, `section`, `form`, `settings`, `for`, and the name of any Shopify global object the same file reads (for example `product` may be a param of ProductForm because the block reads only the param).
- **L-6 One outlet.** A block file prints `{{ content }}` at most once (tier `resource`: once, inside the `{% if content != blank %}` branch).
- **L-7 No captured slots.** `{% capture %}` MUST NOT be used to pass markup from one file to another. Exception: a named slot param on a tier `resource` block that the manifest lists; it is documented as HTML and printed without `escape`. V1 has no such param in the examples of this document.
- **L-8 Explicit ids.** When the contract links elements by id, the root takes a required `id` param and each linked part takes a required param named after the root component (`dialog: 'size-guide'`). `block.id` MUST NOT be used.
- **L-9 Initial state.** A block prints every attribute of the initial state. State that is a prop is printed by each part from its OWN params (`selected: true` on both `tabs-tab` and `tabs-panel`).
- **L-10 Locale keys.** A string the block prints itself is `{{ 'ripple.<component id>.<key>' | t }}`, assigned to a variable when passed to a snippet. Schema labels are `t:` keys (L-17).
- **L-11 Escaping.** Every param printed into an attribute value is `| escape`d and the attribute value is double-quoted. A validated enumeration (after its guard) is printed bare. `class` is escaped. `attributes` is the only raw attribute input. `content` is HTML. Text from data (`product.title`) is escaped; HTML fields are not. Numeric resource ids (`variant.id`) are printed bare.
- **L-12 No blocks inside Ripple files.** `{% block %}` appears only in templates and layouts (platform rule; Theme Check `ValidBlockTagPlacement`). A Ripple block or snippet file MUST NOT contain `{% block %}`; reuse is `{% render 'rp-<id>' %}` (D-037).
- **L-13 Liquid subset.** Ripple-owned `.liquid` files under `blocks/` and `snippets/` use only these tags: `doc`, `schema`, `liquid`, `assign`, `if`, `unless`, `elsif`, `else`, `case`, `when`, `for`, `capture` (only under L-7), `render`, `form`, `comment`, `echo`. And only these filters: `escape`, `split`, `t`, `default`, `append`, `prepend`, `strip`, `plus`, `minus`, `times`, `size`, `money`, `image_url`, `json`. A component spec that needs another filter MUST add it to this list in the same pull request that adds it to the shim (`13-testing.md`). The checker rejects anything else (`07-manifest-registry-cli.md`).
- **L-14 Booleans.** A boolean param is true only for the Liquid boolean `true`: `{% if disabled == true %}`. The string `'false'` and the string `'true'` are both not true.
- **L-15 Enumerations.** Each non-responsive enumeration param, including schema settings, is guarded before first use and falls back to the manifest default (M-6):

  ```liquid
  assign allowed_variant = 'primary,secondary,outline,ghost,link,destructive' | split: ','
  unless allowed_variant contains variant
    assign variant = 'primary'
  endunless
  ```

  An enumeration with no default has no fallback assignment: its attribute is printed inside `{% if allowed_<param> contains <param> %}...{% endif %}`.
- **L-16 Unset and responsive.** A param is unset when it `== blank` (nil, empty string, whitespace-only string). Optional attributes are printed as `{% if x != blank %}data-x="{{ x | escape }}"{% endif %}`. Responsive params are strings, always quoted at the call site, escaped and printed unchanged (D-038 item 4); they are not validated at render time (V-7).
- **L-17 `{% doc %}` and `{% schema %}`.** Every block file has both; every snippet file has `{% doc %}`. Every block accepts `class` and `attributes`. A schema has at most three settings, all styling settings (manifest `prop.liquid.surface: "setting"`), of type `select`; option values are prop tokens, never classes (D-038 item 5). Label keys: block name `t:ripple.<component id>.name` for the root and `t:ripple.<component id>.<part>_name` for a part (part name in snake_case); setting labels `t:ripple.props.<prop liquid name>`; option labels `t:ripple.props.<value>` (shared across components; a value that is not a valid key segment, such as `2xl` or `0.5`, uses the key `t:ripple.props.v_<value with "." replaced by "_">`).
- **L-18 `attributes` last.** `{{ attributes }}` is printed as the LAST thing inside the root start tag, after every contract attribute (M-14: the HTML parser keeps the first duplicate, so the contract wins). The class attribute is always `class="<root class> {{ class | escape }}"` (the trailing space when `class` is unset is removed by canonicalisation and is harmless in browsers).

How schema settings and params meet: a call-site argument with the same name as a schema setting sets that setting, and the block reads it by its bare name (`{{ variant }}`); the dotted form `block.settings.variant:` is a syntax error at the call site (`ripple/docs/research/liquid-blocks-partials.md` section 2). Reading a setting by bare name when the caller did not pass it is used by `ripple/theme/blocks/container.liquid` and accepted by Theme Check; behaviour on a live store is UNVERIFIED and covered by tier 8. Because every enumeration is guarded (L-15), an unset or unknown value prints the default in either case.

### 8.3 Anatomy of a block file

In this order, nothing else:

1. `{% doc %}`: one-paragraph description; for each schema setting, a sentence naming allowed values and the default; one `@param` line per param in manifest prop order, then `class`, `attributes`, `content`; at least one `@example` that is a valid call. Optional params are written `[name]`. Enumerations are typed as a union of quoted literals; responsive params as `string`.
2. An optional `{%- liquid ... -%}` block: guards (L-15), defaults, locale lookups.
3. The markup, or the single `{% render %}` (L-3).
4. `{% schema %}` with `name` and `settings` (an empty array when there are none).
5. In scaffolded copies only: the provenance trailer (D-056).

### 8.4 Static pattern: Button (tier `block`, embedded by other files, generated)

`components/button/liquid/snippets/rp-button.liquid`:

```liquid
{% doc %}
  Ripple Button markup. The single source of the Button HTML contract on Liquid.
  Templates and layouts call the `button` block. Ripple block and snippet files render this snippet.
  Root element: <a> when `href` is set, otherwise <button>.

  @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'} [variant] - Visual style. Default: 'primary'.
  @param {'sm' | 'md' | 'lg'} [size] - Control size. Default: 'md'.
  @param {'button' | 'submit' | 'reset'} [type] - Native button type. Ignored when `href` is set. Default: 'button'.
  @param {string} [href] - When set, the root element is a link.
  @param {string} [target] - Link target. Only with `href`.
  @param {string} [rel] - Link rel. Only with `href`.
  @param {string} [name] - Form field name. Button only.
  @param {string} [value] - Form field value. Button only.
  @param {boolean} [disabled] - Pass the boolean `true`. Any other value is ignored.
  @param {boolean} [pending] - Pass the boolean `true` to print the busy state.
  @param {boolean} [full_width] - Pass the boolean `true` to fill the inline size.
  @param {string} [aria_label] - Accessible name. Required when the content is only an icon.
  @param {string} [command_for] - Id of the element this button commands. Button only.
  @param {string} [command] - Invoker command, for example 'show-modal' or 'close'. Button only.
  @param {string} [popover_target] - Id of the popover this button toggles. Button only.
  @param {string} [id] - Root element id.
  @param {string} [span] - Grid column span token(s). Always a quoted string.
  @param {string} [hidden] - Responsive visibility token(s), for example 'true md:false'. Always a quoted string.
  @param {string} [class] - Extra classes appended after `rp-button`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - The label, as HTML. Required.

  @example
  {% render 'rp-button', type: 'submit', content: label %}
{% enddoc %}

{%- liquid
  assign allowed_variant = 'primary,secondary,outline,ghost,link,destructive' | split: ','
  unless allowed_variant contains variant
    assign variant = 'primary'
  endunless
  assign allowed_size = 'sm,md,lg' | split: ','
  unless allowed_size contains size
    assign size = 'md'
  endunless
  assign allowed_type = 'button,submit,reset' | split: ','
  unless allowed_type contains type
    assign type = 'button'
  endunless
-%}
{%- if href != blank -%}
  <a
    class="rp-button {{ class | escape }}"
    {% if id != blank %}id="{{ id | escape }}"{% endif %}
    href="{{ href | escape }}"
    {% if target != blank %}target="{{ target | escape }}"{% endif %}
    {% if rel != blank %}rel="{{ rel | escape }}"{% endif %}
    data-variant="{{ variant }}"
    data-size="{{ size }}"
    {% if full_width == true %}data-full-width=""{% endif %}
    {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
    {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
    {% if pending == true %}data-pending="" aria-busy="true"{% endif %}
    {% if disabled == true %}aria-disabled="true" tabindex="-1"{% endif %}
    {% if aria_label != blank %}aria-label="{{ aria_label | escape }}"{% endif %}
    {{ attributes }}
  >
    {{- content -}}
  </a>
{%- else -%}
  <button
    class="rp-button {{ class | escape }}"
    {% if id != blank %}id="{{ id | escape }}"{% endif %}
    type="{{ type }}"
    {% if name != blank %}name="{{ name | escape }}"{% endif %}
    {% if value != blank %}value="{{ value | escape }}"{% endif %}
    {% if disabled == true %}disabled{% endif %}
    {% if command_for != blank %}commandfor="{{ command_for | escape }}"{% endif %}
    {% if command != blank %}command="{{ command | escape }}"{% endif %}
    {% if popover_target != blank %}popovertarget="{{ popover_target | escape }}"{% endif %}
    data-variant="{{ variant }}"
    data-size="{{ size }}"
    {% if full_width == true %}data-full-width=""{% endif %}
    {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
    {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
    {% if pending == true %}data-pending="" aria-busy="true"{% endif %}
    {% if aria_label != blank %}aria-label="{{ aria_label | escape }}"{% endif %}
    {{ attributes }}
  >
    {{- content -}}
  </button>
{%- endif -%}
```

`components/button/liquid/blocks/button.liquid`:

```liquid
{% doc %}
  Ripple Button. Static component: no JavaScript.
  Renders an <a> when `href` is set, otherwise a <button>.

  `variant` and `size` are schema settings. Override them at the call site
  with bare arguments: `variant: 'outline'`, `size: 'lg'`.
  Allowed `variant`: primary, secondary, outline, ghost, link, destructive. Default: primary.
  Allowed `size`: sm, md, lg. Default: md.

  @param {'button' | 'submit' | 'reset'} [type] - Native button type. Ignored when `href` is set. Default: 'button'.
  @param {string} [href] - When set, the root element is a link.
  @param {string} [target] - Link target. Only with `href`.
  @param {string} [rel] - Link rel. Only with `href`.
  @param {string} [name] - Form field name. Button only.
  @param {string} [value] - Form field value. Button only.
  @param {boolean} [disabled] - Pass the boolean `true`. Any other value is ignored.
  @param {boolean} [pending] - Pass the boolean `true` to print the busy state.
  @param {boolean} [full_width] - Pass the boolean `true` to fill the inline size.
  @param {string} [aria_label] - Accessible name. Required when the content is only an icon.
  @param {string} [command_for] - Id of the element this button commands. Button only.
  @param {string} [command] - Invoker command, for example 'show-modal' or 'close'. Button only.
  @param {string} [popover_target] - Id of the popover this button toggles. Button only.
  @param {string} [id] - Root element id.
  @param {string} [span] - Grid column span token(s). Always a quoted string.
  @param {string} [hidden] - Responsive visibility token(s), for example 'true md:false'. Always a quoted string.
  @param {string} [class] - Extra classes appended after `rp-button`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - The label. Required.

  @example
  {% block 'button', type: 'submit' %}Add to cart{% endblock %}

  @example
  {% block 'button', variant: 'outline', href: routes.cart_url %}View cart{% endblock %}
{% enddoc %}

{% render 'rp-button',
  variant: variant,
  size: size,
  type: type,
  href: href,
  target: target,
  rel: rel,
  name: name,
  value: value,
  disabled: disabled,
  pending: pending,
  full_width: full_width,
  aria_label: aria_label,
  command_for: command_for,
  command: command,
  popover_target: popover_target,
  id: id,
  span: span,
  hidden: hidden,
  class: class,
  attributes: attributes,
  content: content
%}

{% schema %}
{
  "name": "t:ripple.button.name",
  "settings": [
    {
      "type": "select",
      "id": "variant",
      "label": "t:ripple.props.variant",
      "default": "primary",
      "options": [
        { "value": "primary", "label": "t:ripple.props.primary" },
        { "value": "secondary", "label": "t:ripple.props.secondary" },
        { "value": "outline", "label": "t:ripple.props.outline" },
        { "value": "ghost", "label": "t:ripple.props.ghost" },
        { "value": "link", "label": "t:ripple.props.link" },
        { "value": "destructive", "label": "t:ripple.props.destructive" }
      ]
    },
    {
      "type": "select",
      "id": "size",
      "label": "t:ripple.props.size",
      "default": "md",
      "options": [
        { "value": "sm", "label": "t:ripple.props.sm" },
        { "value": "md", "label": "t:ripple.props.md" },
        { "value": "lg", "label": "t:ripple.props.lg" }
      ]
    }
  ]
}
{% endschema %}
```

### 8.5 Static pattern with responsive params: Stack (tier `block`, not embedded, generated)

`components/stack/liquid/blocks/stack.liquid`:

```liquid
{% doc %}
  Ripple Stack. Flex layout, vertical by default. Static component: no JavaScript.

  Responsive params take one token, or several tokens separated by one space where
  later tokens carry a breakpoint prefix (sm, md, lg, xl, 2xl). Example: '2 md:6'.
  Always pass them as quoted strings.

  @param {'div' | 'section' | 'ul' | 'ol' | 'nav' | 'header' | 'footer' | 'main' | 'aside' | 'article' | 'form'} [as] - Root element. Default: 'div'.
  @param {string} [direction] - Token(s): row, column. Default: 'column'.
  @param {string} [gap] - Space step token(s). Example: '4' or '2 md:6'.
  @param {string} [p] - Padding token(s).
  @param {string} [px] - Inline padding token(s).
  @param {string} [py] - Block padding token(s).
  @param {string} [pt] - Block-start padding token(s).
  @param {string} [pb] - Block-end padding token(s).
  @param {string} [align] - Cross-axis token(s): start, center, end, stretch, baseline.
  @param {string} [justify] - Main-axis token(s): start, center, end, between.
  @param {string} [id] - Root element id.
  @param {string} [span] - Grid column span token(s).
  @param {string} [hidden] - Responsive visibility token(s), for example 'true md:false'.
  @param {string} [class] - Extra classes appended after `rp-stack`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} [content] - Children.

  @example
  {% block 'stack', gap: '2 md:6', align: 'start' %}<p>One</p><p>Two</p>{% endblock %}
{% enddoc %}

{%- liquid
  assign allowed_as = 'div,section,ul,ol,nav,header,footer,main,aside,article,form' | split: ','
  unless allowed_as contains as
    assign as = 'div'
  endunless
  if direction == blank
    assign direction = 'column'
  endif
-%}
<{{ as }}
  class="rp-stack {{ class | escape }}"
  {% if id != blank %}id="{{ id | escape }}"{% endif %}
  data-direction="{{ direction | escape }}"
  {% if gap != blank %}data-gap="{{ gap | escape }}"{% endif %}
  {% if p != blank %}data-p="{{ p | escape }}"{% endif %}
  {% if px != blank %}data-px="{{ px | escape }}"{% endif %}
  {% if py != blank %}data-py="{{ py | escape }}"{% endif %}
  {% if pt != blank %}data-pt="{{ pt | escape }}"{% endif %}
  {% if pb != blank %}data-pb="{{ pb | escape }}"{% endif %}
  {% if align != blank %}data-align="{{ align | escape }}"{% endif %}
  {% if justify != blank %}data-justify="{{ justify | escape }}"{% endif %}
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  {{ content }}
</{{ as }}>

{% schema %}
{
  "name": "t:ripple.stack.name",
  "settings": []
}
{% endschema %}
```

The param `as` passes Theme Check 4.0.2 and the shim. Whether Shopify accepts `as` as a block param name is UNVERIFIED (it is a keyword of `{% render ... as %}`). Default path: use `as`. Fallback: set the manifest `prop.liquid.name` of `as` to `tag` for every component; nothing else changes, because the name is generated from the manifest.

### 8.6 Interactive patterns: Dialog and Tabs (tier `parts`, generated)

`components/dialog/liquid/blocks/dialog.liquid`:

```liquid
{% doc %}
  Ripple Dialog root. Native <dialog> inside <rp-dialog>. Initial state is always closed.
  Open it with a `button` block: `command_for: '<id>', command: 'show-modal'`.

  `size` is a schema setting. Allowed: sm, md, lg, full. Default: md.

  @param {string} id - Required. Printed on the <dialog>. The title id is '<id>-title'.
  @param {boolean} [default_open] - Pass the boolean `true` to open the dialog when ripple.js loads.
  @param {string} [class] - Extra classes appended after `rp-dialog`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - A `dialog-title` block, then the dialog body. Required.

  @example
  {% block 'dialog', id: 'size-guide' %}{% block 'dialog-title', dialog: 'size-guide' %}Size guide{% endblock %}<p>S, M, L.</p>{% endblock %}
{% enddoc %}

{%- liquid
  assign allowed_size = 'sm,md,lg,full' | split: ','
  unless allowed_size contains size
    assign size = 'md'
  endunless
-%}
<rp-dialog
  class="rp-dialog {{ class | escape }}"
  data-slot="rp-dialog"
  {{ attributes }}
>
  <dialog
    class="rp-dialog-panel"
    id="{{ id | escape }}"
    data-size="{{ size }}"
    aria-labelledby="{{ id | escape }}-title"
    closedby="any"
    {% if default_open == true %}data-default-open=""{% endif %}
  >
    {{ content }}
  </dialog>
</rp-dialog>

{% schema %}
{
  "name": "t:ripple.dialog.name",
  "settings": [
    {
      "type": "select",
      "id": "size",
      "label": "t:ripple.props.size",
      "default": "md",
      "options": [
        { "value": "sm", "label": "t:ripple.props.sm" },
        { "value": "md", "label": "t:ripple.props.md" },
        { "value": "lg", "label": "t:ripple.props.lg" },
        { "value": "full", "label": "t:ripple.props.full" }
      ]
    }
  ]
}
{% endschema %}
```

`components/dialog/liquid/blocks/dialog-title.liquid`:

```liquid
{% doc %}
  Ripple Dialog title. Required inside every `dialog` block.

  @param {string} dialog - Required. The `id` of the dialog this title belongs to.
  @param {string} [class] - Extra classes appended after `rp-dialog-title`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - The title text. Required.

  @example
  {% block 'dialog-title', dialog: 'size-guide' %}Size guide{% endblock %}
{% enddoc %}

<h2
  class="rp-dialog-title {{ class | escape }}"
  id="{{ dialog | escape }}-title"
  {{ attributes }}
>
  {{- content -}}
</h2>

{% schema %}
{
  "name": "t:ripple.dialog.title_name",
  "settings": []
}
{% endschema %}
```

`components/tabs/liquid/blocks/tabs.liquid`:

```liquid
{% doc %}
  Ripple Tabs root (UI SDK `ui-tabs`). The markup is the post-upgrade DOM: every part prints its own state.

  @param {string} id - Required. Part ids are '<id>-tab-<value>' and '<id>-panel-<value>'.
  @param {string} default_value - Required. The `value` of the tab that is selected in the server HTML.
  @param {string} [class] - Extra classes appended after `rp-tabs`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - One `tabs-list` block, then one `tabs-panel` block per tab. Required.

  @example
  {% block 'tabs', id: 't', default_value: 'a' %}{% block 'tabs-list', aria_label: 'Details' %}{% block 'tabs-tab', tabs: 't', value: 'a', selected: true %}A{% endblock %}{% endblock %}{% block 'tabs-panel', tabs: 't', value: 'a', selected: true %}<p>A</p>{% endblock %}{% endblock %}
{% enddoc %}

<ui-tabs
  class="rp-tabs {{ class | escape }}"
  id="{{ id | escape }}"
  default-value="{{ default_value | escape }}"
  data-activation-direction="none"
  data-orientation="horizontal"
  data-slot="tabs"
  {{ attributes }}
>
  {{ content }}
</ui-tabs>
{% schema %}
{ "name": "t:ripple.tabs.name", "settings": [] }
{% endschema %}
```

`components/tabs/liquid/blocks/tabs-list.liquid`:

```liquid
{% doc %}
  Ripple Tabs list. Holds the `tabs-tab` blocks.

  @param {string} aria_label - Required. Accessible name of the tab list.
  @param {string} [class] - Extra classes appended after `rp-tabs-list`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - The `tabs-tab` blocks. Required.

  @example
  {% block 'tabs-list', aria_label: 'Details' %}{% block 'tabs-tab', tabs: 't', value: 'a', selected: true %}A{% endblock %}{% endblock %}
{% enddoc %}

<ui-tabs-list
  class="rp-tabs-list {{ class | escape }}"
  {% if aria_label != blank %}aria-label="{{ aria_label | escape }}"{% endif %}
  role="tablist"
  data-activation-direction="none"
  data-orientation="horizontal"
  data-slot="tabs-list"
  {{ attributes }}
>
  {{ content }}
</ui-tabs-list>
{% schema %}
{ "name": "t:ripple.tabs.list_name", "settings": [] }
{% endschema %}
```

`components/tabs/liquid/blocks/tabs-tab.liquid`:

```liquid
{% doc %}
  Ripple Tabs tab. Prints its own initial state from its own params.

  @param {string} tabs - Required. The `id` of the tabs root.
  @param {string} value - Required. Lowercase letters, digits, '-' and '_' only.
  @param {boolean} [selected] - Pass the boolean `true` on the tab whose value equals the root's `default_value`.
  @param {string} [class] - Extra classes appended after `rp-tabs-tab`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the <button>. Never pass shopper or merchant input.
  @param {string} content - The tab label. Required.

  @example
  {% block 'tabs-tab', tabs: 't', value: 'a', selected: true %}A{% endblock %}
{% enddoc %}

<ui-tabs-tab value="{{ value | escape }}" role="none">
  <button
    class="rp-tabs-tab {{ class | escape }}"
    type="button"
    role="tab"
    id="{{ tabs | escape }}-tab-{{ value | escape }}"
    {% if selected == true %}aria-controls="{{ tabs | escape }}-panel-{{ value | escape }}"{% endif %}
    aria-selected="{% if selected == true %}true{% else %}false{% endif %}"
    tabindex="{% if selected == true %}0{% else %}-1{% endif %}"
    {% if selected == true %}data-selected=""{% endif %}
    data-activation-direction="none"
    data-orientation="horizontal"
    data-slot="tabs-tab"
    {{ attributes }}
  >
    {{- content -}}
  </button>
</ui-tabs-tab>
{% schema %}
{ "name": "t:ripple.tabs.tab_name", "settings": [] }
{% endschema %}
```

`components/tabs/liquid/blocks/tabs-panel.liquid`:

```liquid
{% doc %}
  Ripple Tabs panel. Prints its own initial state from its own params.

  @param {string} tabs - Required. The `id` of the tabs root.
  @param {string} value - Required. The `value` of the tab that shows this panel.
  @param {boolean} [selected] - Pass the boolean `true` on the panel of the selected tab. Every other panel is printed `hidden`.
  @param {string} [class] - Extra classes appended after `rp-tabs-panel`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} [content] - The panel content.

  @example
  {% block 'tabs-panel', tabs: 't', value: 'a', selected: true %}<p>A</p>{% endblock %}
{% enddoc %}

{%- if selected == true -%}
  <ui-tabs-panel
    class="rp-tabs-panel {{ class | escape }}"
    value="{{ value | escape }}"
    role="tabpanel"
    id="{{ tabs | escape }}-panel-{{ value | escape }}"
    aria-labelledby="{{ tabs | escape }}-tab-{{ value | escape }}"
    tabindex="0"
    data-selected=""
    data-activation-direction="none"
    data-orientation="horizontal"
    data-slot="tabs-panel"
    {{ attributes }}
  >
    {{ content }}
  </ui-tabs-panel>
{%- else -%}
  <ui-tabs-panel
    class="rp-tabs-panel {{ class | escape }}"
    value="{{ value | escape }}"
    hidden
    data-slot="tabs-panel"
    {{ attributes }}
  >
    {{ content }}
  </ui-tabs-panel>
{%- endif -%}
{% schema %}
{ "name": "t:ripple.tabs.panel_name", "settings": [] }
{% endschema %}
```

### 8.7 Commerce pattern: ProductForm (tier `resource`, hand-written)

`components/product-form/liquid/blocks/product-form.liquid`:

```liquid
{% doc %}
  Ripple ProductForm. Commerce component, self-contained (resource tier).

  Server HTML is a native Shopify product form: it posts `id` (the variant id) and every
  named control in the body to the cart, so add to cart works when JavaScript never loads.
  When ripple.js loads, <rp-product-form> handles the submit through the cart store.

  With no body, the block renders its default body: one submit Button labelled
  `ripple.product-form.add_to_cart`. A body replaces the default body.
  The body is rendered before this block runs and cannot read `form`.

  @param {string} id - Required. Printed on the <form>.
  @param {product} product - Required. The product to sell.
  @param {variant} [variant] - Selected variant. Default: product.selected_or_first_available_variant.
  @param {string} [class] - Extra classes appended after `rp-product-form`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} [content] - Replaces the default body. Must contain one submit `button` block with `name: 'add'`.

  @example
  {% block 'product-form', id: 'buy', product: product %}{% endblock %}
{% enddoc %}

{%- liquid
  if variant == blank
    assign variant = product.selected_or_first_available_variant
  endif
  assign add_label = 'ripple.product-form.add_to_cart' | t
-%}
<rp-product-form
  class="rp-product-form {{ class | escape }}"
  data-slot="rp-product-form"
  {{ attributes }}
>
  {% form 'product', product, id: id, class: 'rp-product-form-fields' %}
    <input type="hidden" name="id" value="{{ variant.id }}" data-rp-field="merchandise-id">
    {% if content != blank %}
      {{ content }}
    {% else %}
      {% render 'rp-button', type: 'submit', name: 'add', content: add_label %}
    {% endif %}
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  {% endform %}
</rp-product-form>

{% schema %}
{
  "name": "t:ripple.product-form.name",
  "settings": []
}
{% endschema %}
```

Notes:

- The form is the Liquid form dialect (D-043): `{% form 'product' %}` with a hidden `name="id"` input. The same hook attribute `data-rp-field="merchandise-id"` marks the field in both dialects, so the element and the fixture masks address it without knowing the dialect.
- The default body calls `{% render 'rp-button' %}`, never `{% block 'button' %}` (L-12). This is why Button's markup lives in a snippet (L-3).
- A caller-supplied body is rendered in the caller's scope BEFORE the block runs; it cannot read the `form` object.

## 9. The `html` host

- **H-1** The `html` host has no component functions. Its binding for a component is ONE reference file, `components/<id>/html/<id>.html`, that contains every fixture as copyable markup (D-040). The file format (markers `<!-- ripple:fixture <name> -->`, provenance trailer) is defined in `02-html-contract.md` section 11.7 and is not repeated here.
- **H-2** The file is ALWAYS generated by `pnpm gen`, for every kind: it concatenates the component's fixture files (`components/<id>/fixtures/<name>.html`) in manifest order. For kind `commerce` those fixture files are hand-written (`generated: "hand"`), in the hydrogen form dialect (F-9).
- **H-3** A person or agent using the `html` host copies a fixture body and edits values by following the prop-to-attribute rules of `02-html-contract.md` section 4. There is no runtime validation in this host: validation is `ripple check` (rendered-HTML layer, `07-manifest-registry-cli.md`).
- **H-4** Behaviour comes from `<script type="module" src="/ripple/ripple.js">`. The reference file itself contains no script (B-5).
- **H-5** Conformance for this host is F-23 in `02-html-contract.md`.

## 10. Validation of enumerated and responsive props, per host

- **V-5** Summary (complete):

| Prop | `react`, `remix`: compile time | `react`, `remix`: run time | `liquid`: authoring | `liquid`: run time | `html` |
|---|---|---|---|---|---|
| enum, not responsive | literal union type (T-15) | inline guard, falls back to default (T-8) | `{% doc %}` union type (LiquidDoc), schema `select` options | guard, falls back to default (L-15) | `ripple check` |
| enum or scale, responsive | `Responsive<...>`: literals autocomplete; any string is accepted | printed unchanged; development-only `console.warn` through `rv` (V-2) | `{% doc %}` type `string` with the tokens named in the description | escaped and printed unchanged (L-16) | `ripple check` |
| boolean | `boolean` | `=== true` (T-7) | `{% doc %}` type `boolean` | `== true` (L-14) | presence of the attribute |
| string, id, url | `string` | `rv` (unset omits) | `{% doc %}` | `!= blank`, `escape` | none |
| required id | no `?` in the type | printed as given | `@param` without brackets | printed as given | `ripple check` |

- **V-6** An invalid NON-responsive enumeration value MUST produce the default's markup in every host (M-6). Fixture `invalid-enum-falls-back` of Button (section 11) is the test: `variant: "huge"`, `size: 4`, `type: "bogus"`, `disabled: "false"` render exactly the `default` markup.
- **V-7** An invalid RESPONSIVE token is never repaired at render time in any host. It is printed and has no effect in CSS. It is reported: at compile time when it is a wrong literal type; at development run time by `rv`; statically by `ripple check` for all four hosts (the checker reads the attribute in rendered HTML and applies `parseResponsive`).
- **V-8** A binding MUST NOT throw for any prop value. A missing required id prints an empty id attribute and is reported by `ripple check`, not by the binding.

## 11. Conformance harness, per host

Tiers are those of D-063. The runner, resource fixtures, the Liquid shim and the placeholder mechanism for `children` are owned by `13-testing.md`. This section fixes what each HOST ADAPTER does, so that a binding author knows exactly how a binding is called.

### 11.1 Common rules

- **Q-1** For every component, every fixture record (`02-html-contract.md` section 11.2) and every host in the record's `hosts` (absent: all four), the adapter renders the binding and the test asserts `canonicalize(output, { mask }) === canonicalize(referenceHtml, { mask })`, with `canonicalize` from `src/testing/canonicalize.ts`. On failure the test prints the fixture name, the host and both canonical strings.
- **Q-2** The adapter renders the files under `components/<id>/<host>/` with `__PKG__` resolved to the built package. It MUST NOT render a re-implementation.
- **Q-3** Fixture `props` keys are manifest prop names. Each adapter maps them: React renames `class` to `className`; Remix keeps `class`; Liquid uses `prop.liquid.name`.
- **Q-4** Part instances in a fixture's `parts` are rendered in order as children. In TSX the export is `<Title><Part in PascalCase>`; in Liquid the block is `<id>-<part>`.
- **Q-5** Required fixtures every component with the stated feature MUST have, in addition to those of `02-html-contract.md` section 11.5: `invalid-enum-falls-back` (any non-responsive enum; V-6), `escaping` (any string prop printed into an attribute: the value `Say "hi" & <go>`), and one fixture passing `class` with two class names.

### 11.2 React adapter

- **Q-6** Work directory: `examples/react/.ripple-conformance/` (git-ignored, recreated per run). The adapter copies every `components/*/react/*.tsx` into it, flat, replacing `__PKG__` with the package name; `<pkg>` resolves through `examples/react/node_modules` (the example depends on `file:../../pkg`, `01-architecture.md`).
- **Q-7** Type check: `tsc --noEmit` over the work directory with these compiler options MUST exit 0: `strict: true`, `jsx: "react-jsx"`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `lib: ["ES2024","DOM","DOM.Iterable"]`, `verbatimModuleSyntax: true`, `isolatedModules: true`, `skipLibCheck: true`, `types: ["node"]`. The work directory also receives one generated file `typeprobe.tsx` that calls each component with its `default` fixture props and, on separate lines preceded by `// @ts-expect-error`, with (a) an enum value outside the list and (b) a misspelt prop; an unused `@ts-expect-error` fails the check.
- **Q-8** Render: bundle with esbuild (`bundle: true`, `format: "esm"`, `platform: "node"`, `jsx: "automatic"`, externals `react`, `react-dom`), then for each case build the element with `createElement(Component, props, children)` and call `renderToString` from `react-dom/server` (synchronous).
- **Q-9** Client render equality: for each fixture, `createRoot(container).render(element)` in Chromium, then `container.innerHTML` canonicalised MUST equal the canonical reference. This proves that server and client print the same attributes (tier 2 in a browser).
- **Q-10** Hydration (tier 4), for every component of kind `native`, `ui` or `commerce`, in a development build of React inside `<StrictMode>`, for both script orders (elements defined before `hydrateRoot`; `hydrateRoot` before elements defined):
  1. zero `console.error` and `console.warn` output;
  2. zero calls of `onRecoverableError`;
  3. a `MutationObserver` on the React root, installed before any module script, records nothing other than (i) entries of the component's `upgradeAllow` and (ii) the constant list `REACT_HYDRATION_ALLOW` below;
  4. each callback of D-036 fires on the FIRST interaction, with no prior re-render;
  5. in controlled mode with a parent that rejects the change, the state does not change (dialog stays closed; tab selection unchanged);
  6. a parent re-render while the element is in a non-initial state leaves that state unchanged (dialog stays open).

  ```ts
  // owned here; lives in test/hydration/react-allow.ts
  export const REACT_HYDRATION_ALLOW = [
    // React re-writes these with the SAME value on native inputs during hydration.
    { target: "input", type: "attributes", names: ["type", "value", "name", "checked"], sameValueOnly: true },
    // React re-sets the text of <textarea>; the text MUST be unchanged afterwards.
    { target: "textarea", type: "childList", textUnchanged: true },
  ] as const;
  ```

  Consequence: D-033's goal "no mutation at hydration" holds for custom elements and their descendants except for these same-value writes by React itself on native form controls. They are not contract violations (U-2 in `02-html-contract.md` ignores a write that does not change the value).

### 11.3 Remix adapter

- **Q-11** Work directory `examples/remix/.ripple-conformance/`, filled as in Q-6 from `components/*/remix/*.tsx`. Node 24.3 or later is required (`remix/packages/remix/package.json` `engines`).
- **Q-12** Type check as Q-7 with `jsx: "react-jsx"`, `jsxImportSource: "remix/component"`, `allowImportingTsExtensions: true`, `noEmit: true`; the same `typeprobe.tsx` rule.
- **Q-13** Render: esbuild with `jsx: "automatic"`, `jsxImportSource: "remix/component"`, external `remix`; the case entry is TSX source generated by the adapter (`<Component {...props}>{children}</Component>`), and the output is `await renderToString(node)` with `renderToString` from `remix/component/server` (asynchronous).
- **Q-14** After rendering and BEFORE canonicalisation, the adapter asserts on the raw output: (a) the ROOT element of every component whose root tag starts with `ui-` or `rp-` and whose manifest says `root.requiresId` has `data-rmx-key` equal to the id (part elements such as `ui-tabs-tab` carry no key); (b) every element named by X-4 has `data-rmx-preserve-attrs` whose space-separated names, compared as a set, equal the expected set; (c) no attribute name matches `/^on/i`; (d) the string `className` does not occur.
- **Q-15** Morph navigation (tier 4): for each component of kind `native`, `ui` or `commerce`, a test page is navigated client-side to a second URL that renders the same component with the same key while the component is in a non-initial state (dialog open, second tab selected, quantity changed). After the morph: the state is unchanged, the element instance is the same object (`===`), and no listener is lost (the next interaction still dispatches its event). Evidence that the attributes of X-3 and X-4 achieve this: `ripple/docs/research/remix-3.md` (morph section; spike `ripple/docs/research/spikes/remix/`). The morph test was not re-run for this document: UNVERIFIED for the exact files of sections 7.6 and 7.7; the test above is the gate.

### 11.4 Liquid adapter

- **Q-16** Work directory: a temporary theme directory with `blocks/` and `snippets/` filled from every `components/*/liquid/`, the locale files merged from the manifest, and one template per case under `templates/` (a `{% block %}` tag is only legal in templates and layouts).
- **Q-17** The case template is built mechanically:
  - tier `block`, `parts`, `resource`: `{% block '<name>', <args> %}<body>{% endblock %}`; tier `snippet`: `{% render 'rp-<id>', <args> %}`.
  - `<args>` are `name: literal` pairs in fixture key order, joined with `, `. Literals: string as `'...'`, or as `"..."` when the string contains `'` (F-5 forbids both quotes); boolean as `true` or `false`; a number for a `scale` or responsive prop as the quoted string of the number (F-3); any other number bare; `{ "$resource": "<type>.<name>" }` as a variable name bound in the render scope by the runner (`13-testing.md`).
  - `<body>` is the fixture's `children` string, literally, or the nested part blocks built by the same rule.
- **Q-18** Render with the shim of `13-testing.md` (liquidjs; reference `ripple/docs/research/spikes/liquid/shim.mjs`). Then Q-1. Fixtures of components with platform-owned markup use masks (`02-html-contract.md` section 11.6); for ProductForm the masks cover the form `action`, `accept-charset`, `enctype`, the platform's hidden inputs, and the `name` and `value` of the `data-rp-field="merchandise-id"` input.
- **Q-19** Theme Check: `themeCheckRun` from `@shopify/theme-check-node` over the work directory MUST report zero offenses of severity error and zero of severity warning.
- **Q-20** M-14 test: for each block, render with `attributes: 'class="evil" data-x="1"'` plus, when the root has a `type` attribute, `type="submit"`; the canonical output MUST contain `data-x="1"`, MUST have the contract's class (no `evil`) and the contract's `type`.
- **Q-21** Tier 8 (live store) repeats Q-17 to Q-18 against a preview store and is blocked until a store exists (D-063 item 8). Until then Q-16 to Q-20 are the gate.

### 11.5 `html` adapter

- **Q-22** For each fixture, extract its body from `components/<id>/html/<id>.html` (F-21) and compare per Q-1 (F-23). Additionally assert that the file's last line matches the trailer pattern of D-056 in the registry copy and is absent in the repository copy.

## 12. Acceptance criteria for this document

Each line is pass or fail. The tier of D-063 is given in brackets.

1. [1] `pnpm gen --check` exits 0, and exits non-zero after any of: editing a generated binding; changing a value array or a `{% doc %}` line in a hand-written binding (G-3); adding a 151st block file (L-4).
2. [1] `bindings-lint` rejects each forbidden pattern of section 1.2 and accepts every file under `components/` (`src/gen/bindings-lint.test.ts`).
3. [1] `src/index.test.ts` passes the table of section 4.
4. [2] Every fixture of every component passes Q-1 in all hosts listed for it, including for the six example components the twelve fixtures `button/default`, `button/link-disabled`, `button/invalid-enum-falls-back`, `button/escaping`, `button/opener`, `button/popover`, `stack/responsive`, `stack/as`, `dialog/default`, `dialog/default-open`, `tabs/default`, `product-form/default`.
5. [2] React and Remix type checks exit 0 (Q-7, Q-12), with every `@ts-expect-error` line used.
6. [2] Remix raw-output assertions pass (Q-14).
7. [2] Theme Check reports zero errors and zero warnings (Q-19); the M-14 test passes for every block (Q-20).
8. [2] React client render equals server render for every fixture (Q-9).
9. [4] React hydration passes Q-10 items 1 to 6 for both script orders in uncontrolled, controlled and rejecting modes.
10. [4] Remix morph passes Q-15.
11. [1] For every component, the React and Remix files export the same set of names, and the Liquid block names equal `<id>` plus `<id>-<part>` for exactly the manifest parts with `authoredBy: "author"` (checked by `pnpm gen --check`).
12. [1] No React binding file without a hook starts with `"use client";` and every one with a hook does (R-14; checked by `pnpm gen --check` with the pattern `\buse(Ref|State|Element|Cart)\(`).

## 13. Evidence and UNVERIFIED

All example code of sections 4 to 8 was executed in `ripple/docs/research/spikes/bindings/` (`sh run.sh`; output in `result.txt`): 100 checks `ok`, 0 failed, Theme Check offenses 0. Versions: `react@19.3.1`, `react-dom@19.3.1`, `@types/react@19.3.0`, `remix@3.3.0`, `typescript@5.9.3`, `liquidjs@10.30.1`, `parse5@8.1.1`, `@shopify/theme-check-node@4.0.2`, `@ui-sdk/web@0.1.0-beta.14`, Chromium (Playwright). The example files in this document are those spike files with the import paths changed to `__PKG__`.

| Claim | Evidence |
|---|---|
| React prints `commandfor`, `command`, `closedby` unchanged, `popoverTarget` as `popovertarget`, `class` on custom elements | `ripple/docs/research/spikes/bindings/react/ssr.tsx`, `react/client-render-test.mjs`, `result.txt` |
| `@types/react@19.3.0` lacks `commandfor` and `command` on `<button>` | `ripple/docs/research/spikes/bindings/pkg/react.ts` (augmentation needed for `tsc` to pass) |
| Remix JSX types accept `command`, `commandfor`, `closedby`, `popovertarget`; `renderToString` is async; `unsafeHTML`, `Frame` exported from `remix/component` | `remix/packages/component/`, `ripple/docs/research/spikes/bindings/remix/ssr.tsx`, `ripple/docs/research/remix-3.md` |
| `RestProps` for Remix must omit `mix` and `role`; `src/remix` needs the type-only import of `remix/component` | `ripple/docs/research/spikes/bindings/pkg/remix.ts`, `tsconfig.remix.json` |
| Hydration: no console output, no recoverable error, callbacks on first interaction, veto, re-render keeps state; same-value writes on `<input>` and `<textarea>` | `ripple/docs/research/spikes/bindings/react/hydrate-test.mjs`, `result.txt` |
| Rules R-1 to R-5, `useElement` design | `ripple/docs/research/react-and-custom-elements.md`; `ripple/docs/research/spikes/react-ce/` |
| `data-rmx-key`, `data-rmx-preserve-attrs`, `data-rmx-document` | `ripple/docs/research/remix-3.md`; `ripple/docs/research/spikes/remix/` |
| Liquid: 12 fixtures conform through the shim; Theme Check 0 offenses, including the param `as`; `{{ attributes }}` last cannot override | `ripple/docs/research/spikes/bindings/liquid/run.mjs`, `liquid/check.mjs`, `result.txt` |
| liquidjs: whitespace-only string `== blank`; `false != blank` is false; the string `'false' == true` is false | `ripple/docs/research/spikes/bindings/result.txt` |
| `CartStore`, `CartState`, `CartData` are type exports of `@shopify/hydrogen` | `hydrogen/packages/hydrogen/src/core/index.ts`, `hydrogen/packages/hydrogen/src/core/cart/cart.ts`, `hydrogen/packages/hydrogen/src/core/cart/state.ts` |
| Remix template compiles with NodeNext and TS extensions | `remix/template/tsconfig.json` |
| Liquid rules L-1 to L-11, schema setting semantics, subset tags | `ripple/docs/research/liquid-blocks-partials.md`; `ripple/theme/blocks/container.liquid` |

UNVERIFIED, each with its default path:

1. Shopify (live) accepts `as` as a block param name. Default: use `as`. Fallback: section 8.5.
2. Shopify (live) binds an unpassed schema setting to its bare name. Default: rely on it. Fallback: none needed for correctness, because L-15 prints the default for an unset value; the merchant's setting would then be ignored, which tier 8 detects.
3. Liquid blank semantics on Shopify equal liquidjs for whitespace-only strings. Default: assume equal. If not, a whitespace-only param prints an attribute with a whitespace value; `ripple check` reports it.
4. Remix morph with the exact files of section 7 (Q-15). Default: the attributes of X-3 to X-5.
5. `getCommerce()` shape (`usable`, `cart`): owned by `05-commerce.md`; the spike used a stand-in (`ripple/docs/research/spikes/bindings/pkg/commerce-adapter.ts`). If `05-commerce.md` names the members differently, only `src/react/hooks.ts` changes.
6. `rp-quantity` settable property `value` and cancelable `valuechange` (R-5): owned by `04-elements.md`; verified only for `rp-dialog` (`open`, `openchange`) and `ui-tabs` (`value`, `valuechange`).
7. WebKit and Gecko behaviour of Invoker attributes printed by bindings: SPIKE-05.

## 14. Fallbacks

### Fallback (SPIKE-05)

Applies only if the Invoker Commands polyfill fails in an engine (React 19.3.1 and Remix 3.3.0 printing the attributes unchanged is verified in Chromium, section 13).

1. The Button and IconButton bindings in all four hosts additionally print `data-rp-open="<id>"` when `command` is `show-modal` and `data-rp-close="<id>"` when `command` is `close`, where `<id>` is the `commandFor` value. The native attributes stay.
2. TSX (both hosts), added after the `command` attribute:

   ```tsx
   data-rp-open={rv(command) === "show-modal" ? rv(commandFor) : undefined}
   data-rp-close={rv(command) === "close" ? rv(commandFor) : undefined}
   ```

3. Liquid (`snippets/rp-button.liquid`), added after the `command` line:

   ```liquid
   {% if command == 'show-modal' and command_for != blank %}data-rp-open="{{ command_for | escape }}"{% endif %}
   {% if command == 'close' and command_for != blank %}data-rp-close="{{ command_for | escape }}"{% endif %}
   ```

4. The contract changes are those of `02-html-contract.md` "Fallback (SPIKE-05)"; affected fixtures are regenerated. No prop is added or renamed.

### Fallback (SPIKE-02)

Applies only if the platform wraps block output in an element.

1. Binding files do not change: a block cannot remove a platform wrapper.
2. The Liquid adapter passes the wrapper selector to `canonicalize(html, { mask, unwrap })` as defined in `02-html-contract.md` "Fallback (SPIKE-02)".
3. If the wrapper sits between a custom element root and a part that the element finds by child combinator, that component's Liquid tier changes from `parts` to `resource` with a fixed structure, in its component spec.

### Fallback (SPIKE-04)

Applies only if root-only `definePrimitive` fails and `rp-*` elements become `RippleElement` subclasses. Bindings do not change: the tag names, attributes, events (`openchange`, `valuechange`), settable properties and `customElements.whenDefined` behaviour that `useElement` relies on are part of the element's public surface, which the fallback keeps (`04-elements.md`).

---

## Ledger issues

Decisions this document had to make because the ledger is silent, and places where the ledger's wording is wrong. Each was resolved in the most consistent way and applied above.

1. **Enumeration fallback in TSX versus "only `rv()` and `cx()`" (D-035 item 7, `02-html-contract.md` M-6).** M-6 requires a fallback to the default in every host, and D-035 forbids a third helper. Applied: an inline `includes` expression on a `const` array (T-8).
2. **`rv` signature.** The ledger names `rv()` without a signature. Applied: `rv(value, allowed?, label?)`, accepts string, number, boolean, `null`, `undefined`; development-only warnings; never changes the output (section 4). `rv` is also the "unset" normaliser for plain string props (V-4).
3. **Where prop types live (D-003 "TypeScript prop types" generated; `01-architecture.md` lists "prop types" as an export of `<pkg>`).** Applied: value arrays and prop interfaces are generated INTO each scaffolded binding file; `<pkg>` exports only `Responsive` (T-13). `01-architecture.md` should read "the type `Responsive`".
4. **`RestProps`.** Not in the ledger. Applied: a type exported from `<pkg>/react` and `<pkg>/remix`; the Remix variant omits `mix` and `role` (7.2). `<pkg>/remix` has no runtime helper, although `01-architecture.md` says "Remix binding helpers". `src/remix/**` needs the type-only import `import type {} from "remix/component"`; `01-architecture.md` says `src/remix/**` imports nothing external and must allow `remix/component (type)`, as it allows `@shopify/hydrogen (type)` for `src/react/**`.
5. **Generated JSX type files.** D-003 says `IntrinsicElements` is generated; `01-architecture.md` lists only hand-written files in `src/react/` and `src/remix/`. Applied: `src/react/jsx.generated.ts` and `src/remix/jsx.generated.ts`, imported by the index files. The React file also augments `ButtonHTMLAttributes` with `commandfor` and `command`.
6. **"A stable key prop when the component has no id" (D-034 item 2).** No name was given. Applied: Remix-only optional prop `rmxKey`; the attribute is omitted when it is unset (X-3).
7. **Which names go in `data-rmx-preserve-attrs`.** Applied: the manifest `state[]` rows for that element written by the element or the browser, space-joined (X-4). `07-manifest-registry-cli.md` must make `state[]` rows carry the target element and the writer.
8. **Placement of Liquid `attributes` (D-035 item 4, ledger section 6.1).** Follows `02-html-contract.md` M-14: last in the start tag (L-18). The ledger wording "before contract attributes" is wrong for Liquid.
9. **Store hooks (D-033 "hooks from `<pkg>/react`").** No names were given. Applied: exactly one hook, `useCart(selector, serverValue)`; `serverValue` is returned on the server, during hydration and when the store is not usable (6.2).
10. **One writer per node in React (D-045).** D-045 lets React render structure from the store but does not say who writes counts, errors and pending state. Applied: the element writes them; React renders those nodes with constant props (R-11, R-12).
11. **React hydration is not literally mutation-free (D-033, D-063 tier 4).** React 19.3.1 re-writes `type`, `value`, `name`, `checked` on native `<input>` with the same value and re-sets `<textarea>` text. Applied: constant `REACT_HYDRATION_ALLOW` (Q-10).
12. **`"use client"`.** Not in the ledger. Applied: first line if and only if the file calls a hook (R-14).
13. **Generated versus hand-written per host for kinds `native` and `ui` (D-003).** D-003 names only "React wiring" as hand-written. Applied: `html`, `remix`, `liquid` generated; `react` hand-written with a generated, checked header region (G-1 to G-3). For hand-written Liquid (kind `commerce`) the generator checks `{% doc %}`, `{% schema %}` and guards instead of writing them.
14. **Schema label keys (D-038 item 6 says only `t:ripple.<...>`).** Applied: `t:ripple.<component id>.name`, `t:ripple.<component id>.<part>_name`, shared `t:ripple.props.<name or value>` (L-17).
15. **The closed filter list of the Ripple Liquid subset (D-038 item 8).** The research names the tags but not the filters. Applied: the 14 filters of L-13.
16. **Liquid param `as`.** D-038 item 3 does not reserve it; live acceptance is UNVERIFIED. Applied: use `as`; fallback name `tag` through `prop.liquid.name` (8.5).
17. **Sibling import specifiers.** Applied: `./<id>` in React, `./<id>.tsx` in Remix (section 1.1). The CLI must not rewrite them.
18. **Controlled props need element support (D-036).** Applied as a requirement on `04-elements.md`: settable properties `open` / `value` and cancelable change events (6.2 item 3).
19. **Parts cannot learn the root's initial state (D-020, S-7).** Applied: the caller passes `selected` to each Tabs part in every host, and React parts capture it once (R-3, L-9).
20. **Conformance work directories.** `01-architecture.md` says scaffolded TSX is type-checked "inside each host's example project" without a path. Applied: `examples/<host>/.ripple-conformance/` (Q-6, Q-11).
21. **Extra required fixtures.** Applied: `invalid-enum-falls-back`, `escaping`, and a two-class `class` fixture (Q-5), in addition to `02-html-contract.md` section 11.5.
