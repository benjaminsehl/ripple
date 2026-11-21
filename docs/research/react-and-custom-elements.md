# React 19 and UI SDK custom elements (risk R1)

Status: SETTLED BY RUN. Every claim tagged **[RUN]** was observed in Chromium (Playwright) against published npm packages. Claims tagged **[SRC]** come from reading source. Anything else is tagged **UNVERIFIED**.

Versions used: `react@19.3.1`, `react-dom@19.3.1`, `@ui-sdk/web@0.1.0-beta.14`, `@ui-sdk/react@0.1.0-beta.14`, `@ui-sdk/core@0.1.0-beta.14`, esbuild, headless Chromium. npm was reachable.

Spike source (re-runnable): `docs/research/spikes/react-ce/` in this repo (`build.sh`, then the `*.mjs` runners). Path prefixes in evidence: `uisdk/` = vercel-labs/ui clone, `hydrogen/` = Shopify/hydrogen clone, `spike/` = `docs/research/spikes/react-ce/`.

---

## 1. Verdict

**Recommendation: (A). The React binding renders the `ui-*` custom elements and prints the same HTML contract as every other host. Do NOT use `@ui-sdk/react` for Ripple components.**

A works cleanly in both load orders (elements upgrade before hydration, and after), in development and production builds, under `StrictMode`, with zero console output and zero DOM mutations at upgrade or hydration, **provided the binding follows five rules** (section 7). Each rule exists because the spike broke without it.

B (`@ui-sdk/react`) is rejected because it cannot print the web contract and by default violates Ben's decision 2:

- It omits closed/inactive content from server HTML (inactive tab panels, closed accordion panels, dialog and drawer content) unless `keepMounted` is passed on every part **[RUN]**.
- Even with `keepMounted`, its DOM differs from the web elements' DOM in tag names, wrapper elements, ids, and which attributes closed parts carry **[RUN]** (section 5). "Byte-identical minus the `ui-*` wrapper tags" is false.
- It would make the React host the only host with different markup, so shared fixtures and one CSS contract would not hold.
- It saves nothing: four components cost 59 KB gzip with `@ui-sdk/react` vs 62 KB gzip with `@ui-sdk/web` (React excluded) **[RUN]**.

---

## 2. What React 19 does with custom elements

All **[RUN]** with a probe element (`spike/src/props.jsx`, `spike/props.mjs`, `spike/props2.mjs`), confirmed in `react-dom/cjs/react-dom-client.development.js` (`setPropOnCustomElement`; the hydration path for custom elements only diffs for warnings).

### 2.1 Server rendering (`renderToString`)

Input:

```jsx
<x-probe id="a" str="s" num={3} t={true} f={false} obj={{a:1}} arr={["x","y"]} fn={() => 1}
  className="c1" htmlFor="hf" tabIndex={0} hidden={true} style={{color:"red","--v":1}}
  onfoo={fn} onFoo={fn}>text</x-probe>
```

Output:

```html
<x-probe id="a" str="s" num="3" t="" class="c1" htmlFor="hf" tabIndex="0" hidden="" style="color:red;--v:1">text</x-probe>
```

| Prop value | Server HTML |
|---|---|
| string, number | attribute with that value |
| `true` | attribute with empty value (`t=""`) |
| `false`, `undefined`, `null` | omitted |
| object, array, function | omitted |
| `className` | `class` |
| `htmlFor` | `htmlFor` verbatim (NOT `for`) |
| `tabIndex` | `tabIndex` verbatim (HTML parses it as `tabindex`, but the bytes differ) |
| `on*` handlers | omitted |
| JSX text mixed with an expression (`Lines {n}`) | `Lines <!-- -->3` (comment node inserted) |

### 2.2 Hydration (`hydrateRoot`)

- React does **not** attach `on*` listeners on custom elements during hydration. A `foo` event dispatched after hydration reached no handler. Listeners appear only after a later re-render in which the handler prop's identity changes.
- React does **not** assign object/array/function props as properties during hydration. Same caveat.
- Both are true whether the element was defined before or after hydration, in development and production builds.
- Attribute mismatches are never patched. In development React logs one `console.error` ("A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.") listing every extra attribute. Production logs nothing.
- `suppressHydrationWarning` on an element silences the attribute warning for that element only (one level; it must be repeated on each element).
- A **structural** mismatch (child added, removed or moved) raises a recoverable error "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client" and React discards and re-creates the server DOM for the whole root or Suspense boundary.

### 2.3 Client render and updates

- For each prop React tests `name in element`. If true it assigns the **property**; otherwise it sets the **attribute**. An element that is not yet defined has no custom properties, so everything goes to attributes until it upgrades.
- Removing a prop (`undefined`) on a custom element assigns `undefined` to the property when `name in element`. Observed results: `id={undefined}` produced `id="undefined"`; `title={undefined}` produced `title="undefined"`; `tabIndex={undefined}` left `tabindex="0"`. `hidden={false}`, `role={undefined}`, `data-*={undefined}`, `aria-*={null}` removed the attribute correctly.
- Event props: the text after `on` is the event name, case-sensitive. `onfoo` listens for `foo`; `onFoo` listens for `Foo`; `onfooCapture` listens for `foo` in the capture phase. So a UI SDK `valuechange` event needs `onvaluechange`; `onValueChange` never fires.
- `onClick` and other React-known events keep React's delegated behavior.

Consequence: React's built-in custom-element support is not reliable for a server-rendered binding. The binding MUST attach listeners and assign properties itself through a ref.

---

## 3. What `@ui-sdk/web` elements do on upgrade

### 3.1 Attributes written

**[RUN]** `spike/base.mjs`, `spike/run.mjs min ...`. Starting from author-only markup, upgrading `ui-tabs`, `ui-accordion`, `ui-dialog` changed 23 elements. Representative results:

```html
<!-- before -->
<ui-tabs id="tabs" default-value="account">
  <ui-tabs-list aria-label="Settings">
    <ui-tabs-tab value="account"><button type="button">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password"><button type="button">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel value="account">Account panel</ui-tabs-panel>
  <ui-tabs-panel value="password">Password panel</ui-tabs-panel>
</ui-tabs>

<!-- after upgrade -->
<ui-tabs id="tabs" default-value="account" data-slot="tabs" data-orientation="horizontal" data-activation-direction="none">
  <ui-tabs-list aria-label="Settings" data-slot="tabs-list" role="tablist" data-orientation="horizontal" data-activation-direction="none">
    <ui-tabs-tab value="account" role="none"><button type="button" data-slot="tabs-tab" role="tab" id="tabs-tab-account" tabindex="0" aria-selected="true" data-selected="" data-orientation="horizontal" data-activation-direction="none" aria-controls="tabs-panel-account">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button type="button" data-slot="tabs-tab" role="tab" id="tabs-tab-password" tabindex="-1" aria-selected="false" data-orientation="horizontal" data-activation-direction="none">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel value="account" data-slot="tabs-panel" role="tabpanel" id="tabs-panel-account" aria-labelledby="tabs-tab-account" data-selected="" data-orientation="horizontal" data-activation-direction="none" tabindex="0">Account panel</ui-tabs-panel>
  <ui-tabs-panel value="password" hidden="" data-slot="tabs-panel">Password panel</ui-tabs-panel>
</ui-tabs>
```

Facts that follow:

- Before upgrade, **every panel is visible** and nothing has a role. Author-only markup therefore shifts layout on upgrade (`hidden` is added to inactive panels, dialog content, backdrops). This matches the UI SDK docs: "Plain server-rendered HTML does not calculate the primitive's ARIA state" (`uisdk/apps/docs/content/docs/web-components/server-rendering.mdx`).
- **Part ids derive from the root `id`.** With `<ui-tabs id="tabs">` parts get `tabs-tab-<value>`, `tabs-panel-<value>`; accordion gets `<id>-trigger-<value>`, `<id>-panel-<value>`; dialog gets `<id>-title`, `<id>-description`, `<id>-content`. Without a root id the prefix is a page-order counter (`ui-sdk-tabs-1-…`), which a server cannot predict. An id already present on a part is kept.
- Events are lowercase `CustomEvent`s that do not bubble, are cancelable, and carry `detail.value` and `detail.reason` (`uisdk/packages/web/src/define-element.ts`, `withEvents`; `uisdk/apps/docs/content/docs/web-components/state-and-events.mdx`). `preventDefault()` cancels the state change.
- State props (`value`, `open`) are live properties. Setting one changes state and fires **no** event (same docs page).
- Opening a modal dialog or drawer writes `inert` on sibling elements (including elements outside the popup that React rendered) and `style="overflow: hidden; scroll-behavior: auto;"` on `<html>`. Closing, or unmounting the React subtree while open, removes both **[RUN]** (`spike/unmount.mjs`).
- Dialog content stays in place in the DOM (`contentParent: "ui-dialog"`), shown through `popover="manual"` in the top layer. No portal node is created for a plain dialog **[RUN]**.

### 3.2 Upgrade is idempotent for most elements

**[RUN]** `spike/idem.mjs`: take each component's first docs example, upgrade it, serialize `innerHTML`, load that serialization in a fresh page, upgrade again, count DOM mutations.

Zero mutations on the second upgrade (the serialized post-upgrade HTML is a stable server contract):
accordion, alert-dialog, button, checkbox, collapsible, color-picker, dialog, drawer, file-input, hover-card, input, label, menu, menubar, meter, navigation-menu, number-input, otp-input, password-input, popover, progress, radio, rating, resizable, segmented-control, select, separator, switch, tabs, textarea, toggle, toolbar, tooltip, tree.

Not idempotent (the element rewrites something on every upgrade):

| Element | Mutations on second upgrade | Nature |
|---|---|---|
| slider | 1 | `style` on thumb re-serialized in a different property order (cosmetic) |
| scroll-area | 3 | `style` re-ordered (cosmetic) |
| combobox, autocomplete | 1 | `aria-labelledby` re-pointed |
| carousel | 4 | `inert` / `aria-hidden` on items recomputed from layout |
| field | 6 | error text and `aria-describedby` recomputed |
| toast | 1 | `<ol>` appended to the region again |
| pagination | 37 | page items regenerated |
| calendar, date-picker, date-input, time-input, token-input, listbox, command, trigger-menu, avatar, image-cropper, timeline | 2 to 292 | children or state regenerated |

### 3.3 Elements that change DOM structure on upgrade

**[RUN]** `spike/struct.mjs` (childList mutations from author-only docs markup):

| Element | Structural change on upgrade | Avoidable by pre-rendering? |
|---|---|---|
| **drawer** | Creates `<ui-drawer-viewport>` and moves `<ui-drawer-content>` into it | Yes. `uisdk/packages/web/src/drawer.ts` lines 86-91: skipped when the content's parent is already `ui-drawer-viewport`. Confirmed by run. |
| **navigation-menu** | None on upgrade. **On open** it moves `<ui-navigation-menu-content>` into `<ui-navigation-menu-viewport>` and leaves a comment placeholder | No (runtime behavior) |
| slider | Inserts `<ui-slider-thumb-input>`; writes value text | Yes (idempotent per 3.2 except style order) |
| rating | Inserts `<ui-rating-item>` / `<ui-rating-radio>` | Yes |
| progress, meter | Writes value text into `*-value` | Yes |
| select | Writes placeholder text into `<ui-select-value>` | Yes |
| otp-input | Inserts `<ui-otp-input-control>` | Yes |
| file-input | Inserts `<input type="file">` | Yes |
| field | Writes validation text into `<ui-field-error>` | No (3.2) |
| pagination | Generates `<ui-pagination-item>` children | No (3.2) |
| toast | Appends `<ol data-slot="toast-list">` to the region and a `<div>` to `<body>` | No (3.2) |
| dialog with `data-presentation="sheet"` or any popup with a `container` attribute | Moves backdrop/content into a viewport or another container (`uisdk/packages/web/src/popup.ts` `sheetPortal`, `uisdk/packages/web/src/dialog.ts`) | No. **[SRC]**, not run. |

### 3.4 What a structural change does to React

**[RUN]** `spike/drawer.mjs`, drawer rendered from React without `<ui-drawer-viewport>`:

- Elements upgrade **before** hydration: recoverable error "Hydration failed … this tree will be regenerated on the client". React threw away the server DOM for the root and re-created it (`sameNode=false`). Server rendering is wasted and the page flashes.
- Elements upgrade **after** hydration: no error in the cases tested (text update inside content, sibling insertion, unmount of the whole drawer). UNVERIFIED but expected from how React reconciles: removing or reordering the moved node itself (for example conditionally rendering `<ui-drawer-content>`) would throw `NotFoundError` because its parent is no longer the node React recorded.

With `<ui-drawer-viewport>` printed by the binding: zero errors in both orders, same DOM nodes kept.

---

## 4. Spike results for approach A

### 4.1 Naive binding (JSX custom elements, React `on*` props, no rules)

**[RUN]** `spike/src/app.jsx`, `spike/run.mjs`.

| Server HTML | Order | Dev console | Works after hydration? |
|---|---|---|---|
| author-only (`min`) | elements first | 1 hydration attribute-mismatch error | Events dead until first re-render (2.2) |
| author-only (`min`) | hydrate first | none | Events dead until first re-render; layout shift when elements upgrade |
| full contract for tabs (`static`) | either | none for tabs; error only for parts not pre-rendered | same event caveat |
| production build, any | either | none | same event caveat |

Other observations from the naive binding:

- React re-renders did **not** overwrite attributes the element wrote, as long as the corresponding JSX prop did not change between renders. React only writes props whose value changed in its own virtual tree.
- React adding a tab and panel at runtime worked: the element's observers bound the new children and wrote their attributes.
- React text updates inside element-managed nodes (open dialog content, hidden panels) worked.
- Array property update worked after upgrade (`<ui-accordion value={["shipping"]}>` assigned the property).
- Recomputing state attributes from React state on every render (`static-ctl` variant) hit the `id="undefined"` bug (2.3) when a panel switched between its two JSX shapes.

### 4.2 Final pattern (section 7)

**[RUN]** `spike/src/final.jsx`, `spike/final.mjs`. Tabs and Dialog, uncontrolled and controlled, wrapped in `React.StrictMode`, development build.

| Mode | Order | DOM mutations by upgrade | DOM mutations by hydration | Console |
|---|---|---|---|---|
| uncontrolled | elements first | 0 | 0 | none |
| uncontrolled | hydrate first | 0 | 0 | none |
| controlled | elements first | 0 | 0 | none |
| controlled | hydrate first | 0 | 0 | none |

Behavior verified in all four:

- Click a tab immediately after hydration with no prior re-render: `onValueChange("password")` fired.
- Parent re-render adds a third tab: bound correctly, selection preserved.
- Controlled: parent sets `value="account"`: element followed. Parent **rejects** a change (does not update state): element stayed on the old tab.
- Dialog: trigger click, re-render while open, Escape, parent sets `open={true}`, Close button: all correct, `onOpenChange` fired with the right value each time.

---

## 5. What `@ui-sdk/react` renders (approach B)

**[RUN]** `spike/src/b.jsx`, `spike/b.mjs`. **[SRC]** `uisdk/packages/react/src/tabs.tsx`, `accordion.tsx`, `dialog.tsx`, `dialog-parts.tsx`, `use-primitive.tsx`.

Default output for Tabs + Accordion + Dialog + Drawer (no `keepMounted`):

```html
<div id="tabs" data-slot="tabs" data-orientation="horizontal" data-activation-direction="none">
  <div aria-label="Settings" data-slot="tabs-list" role="tablist" …>
    <button data-slot="tabs-tab" role="tab" id="ui-sdk-_R_1_-tab-account" type="button" tabindex="0" aria-selected="true" …>Account</button>
    <button data-slot="tabs-tab" role="tab" id="ui-sdk-_R_1_-tab-password" type="button" tabindex="-1" aria-selected="false" …>Password</button>
  </div>
  <div data-slot="tabs-panel" role="tabpanel" id="ui-sdk-_R_1_-panel-account" …>Account panel</div>
  <!-- the Password panel is NOT rendered -->
</div>
<!-- closed accordion panel: NOT rendered -->
<button data-slot="dialog-trigger" id="ui-sdk-_R_3_-trigger" aria-haspopup="dialog" data-closed="" type="button">Edit</button>
<!-- dialog backdrop and content: NOT rendered. Drawer content: NOT rendered. -->
```

With `keepMounted` on every panel/content part the hidden content is rendered, but the DOM still differs from the web elements:

| Aspect | `@ui-sdk/web` (after upgrade) | `@ui-sdk/react` |
|---|---|---|
| Root / part tags | `ui-tabs`, `ui-tabs-list`, `ui-tabs-panel`, `ui-dialog-title` (`role="heading" aria-level="2"`), `ui-dialog-description` (`role="paragraph"`) | `div`, `div`, `div`, `h2`, `p` |
| Wrapper around native buttons | `<ui-tabs-tab role="none"><button>`, `<ui-dialog-trigger><button>`, `<ui-accordion-trigger><button>` | none; the `button` is the part |
| Dialog / drawer root element | `<ui-dialog id="dlg">` exists | no DOM element; the `id` prop is not printed |
| Part ids | `<rootId>-tab-<value>` | `ui-sdk-_R_1_-tab-<value>` (`React.useId`, `use-primitive.tsx` line 181); root `id` is ignored for derivation |
| Hidden tab panel | `hidden data-slot value` only | `hidden` plus `role`, `id`, `aria-labelledby`, `data-orientation`, … |
| Closed dialog content | `hidden data-slot` only; `role="dialog"`, `aria-modal`, `id` are added on open | `role="dialog" aria-modal="true" id tabindex="-1" hidden data-closed` while closed |
| Dialog backdrop when closed | present, `hidden` | absent even with `keepMounted` |
| Attributes present only after hydration | n/a | `aria-controls`, `data-index`, panel `tabindex`, accordion `style` vars are added client-side after hydration (SSR HTML ≠ hydrated HTML) |
| Form controls | form-associated custom element, no hidden input | visually hidden native input in server HTML (`uisdk/contributing/architecture.md` line 116) |

`data-slot` names and `data-*` state attribute names are the same in both adapters. Nothing else is guaranteed equal.

The `render` prop can swap a part's tag (`<Tabs render={<ui-tabs/>}>` printed `<ui-tabs …>`), but wrapper elements and the dialog root have no React part to attach to, and the page would then contain `ui-*` tags that the web bundle would upgrade a second time if it were ever loaded. Not a path to byte equality.

---

## 6. Hydrogen React bindings and how they compose

**[SRC]** `hydrogen/packages/hydrogen/src/react/index.ts`, `hydrogen/packages/hydrogen/src/react/cart.tsx`, `hydrogen/packages/hydrogen/src/core/index.ts`, `hydrogen/packages/hydrogen/src/core/cart/cart.ts`. Not run.

- `@shopify/hydrogen/react` is a `"use client"` module exporting `createCartComponents`, `useCartAnalytics`, `CollectionProvider`, `useCollection`, `useCollectionActions`, `useCollectionForm`, `LocaleProvider`, `useLocale`, `PredictiveSearchProvider`, `usePredictiveSearch`, `usePredictiveSearchActions`, `usePredictiveSearchForm`, `createProductComponents`, `useProductForm`, `ShopPayButton`, `ShopifyScripts`.
- `createCartComponents<THandlers>()` returns `{ CartProvider, useCart, useSuspenseCart, useOptionalCart, useCartActions, useCartForm }`.
  - `CartProvider({ initialData, children })` creates **its own** store with `createCartStore({ initialData })` inside `useMemo`, calls `store.connect()` in an effect and `store.destroy()` on unmount.
  - `useCart(selector, isEqual?)` reads through `useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot)`.
  - `useCartForm()` returns `{ formProps, register }`; `formProps()` yields `{ onSubmit, method: "post", action: endpoint }`, i.e. a real form that works without JS.
- The provider's store is **not reachable from outside React**: `useCartStore` exists in `cart.tsx` but is not re-exported from `react/index.ts`.
- `@shopify/hydrogen` core exports `createCartStore`, `configureCartEndpoint`, `createCartFormRegister`, `attachQuantityInput` and the `CartStore` type. `CartStore` has `getState()`, `subscribe()`, `connect()`, `destroy()`, `handleFormSubmit(event)` (names seen in `cart.tsx` and the `createCartStore` doc comment).
- Connected stores listen on `document` for `shopify:cart:lines-update`, `shopify:cart:discount-update`, `shopify:cart:note-update`, `shopify:cart:attributes-update` (`core/cart/cart.ts` `connectCartStore`). Whether two stores on one page stay fully consistent through these events is UNVERIFIED here (owned by the Hydrogen/commerce investigation).

Composition consequences for the React binding:

1. Interactive (UI SDK) components are independent of Hydrogen. Section 7 applies unchanged.
2. Commerce components in React have two possible wirings. The spec MUST pick one; this investigation recommends (a):
   - (a) **Ripple owns one core store per page** (`createCartStore` from `@shopify/hydrogen`), exposed through a tiny module-level accessor that both the `rp-*` elements and the React binding use. The React binding reads it with `useSyncExternalStore` and performs structural rendering (cart lines). The `rp-*` elements only reflect state, as in every other host. One store, one HTML contract.
   - (b) Use `createCartComponents()` from `@shopify/hydrogen/react` for React and never register `rp-*` commerce elements in React apps. Simpler for existing Hydrogen apps, but the React host then has different runtime wiring, and loading `ripple.js` on the same page would create a second store.
3. Hydrogen's `useCartForm().formProps()` and core `createCartFormRegister()` both produce real `<form method="post">` markup, which is compatible with rule "actions are real forms".

---

## 7. The React binding pattern (normative proposal)

### 7.1 Rules

**R-1. Print the upgrade-stable contract.** The HTML a binding prints for a component's initial state MUST equal the DOM after the element upgrades, attribute for attribute and node for node. Upgrading MUST cause zero DOM mutations. This removes hydration mismatches in both load orders and removes layout shift. For drawers this means printing `<ui-drawer-viewport>` around `<ui-drawer-content>`.

**R-2. Root `id` is required.** Every interactive component MUST print an `id` on its root `ui-*` element and derive part ids from it using the UI SDK scheme (`<id>-tab-<value>`, `<id>-panel-<value>`, `<id>-trigger-<value>`, `<id>-title`, `<id>-description`). In React the default comes from `useId()`; in Liquid from the block/section id.

**R-3. State attributes are printed from the initial state only.** Attributes the element owns (`aria-selected`, `aria-expanded`, `aria-controls`, `tabindex` on parts, `hidden`, `data-selected`, `data-open`, `data-closed`, `role` on parts, part `id`s) MUST be computed from a value captured once (`useState(() => initial)`), never from current props or state. After mount the element owns them. React then never rewrites them, because their JSX value never changes.

**R-4. Listeners and live properties go through a ref, never through React props.** Use the `useElement` hook below. MUST NOT use `onvaluechange={…}` or pass objects/arrays/functions as JSX props on `ui-*` / `rp-*` elements (React skips both during hydration).

**R-5. Controlled props are assigned as properties and changes are vetoed.** When `value`/`open` is passed, the wrapper MUST call `event.preventDefault()` on the change event, call the user's callback, and assign the property in a layout effect when the prop changes. When only `defaultValue`/`defaultOpen` is passed, the wrapper MUST NOT prevent the event.

Supporting rules:

- Put `suppressHydrationWarning` on every `ui-*` element and on every native element a `ui-*` part binds to (the wrapped `button`, heading). Reason: a visitor can interact before React hydrates (streaming, slow bundle), which legitimately changes element-owned attributes. Correctness of the printed contract is enforced by fixture tests, not by React's warning.
- On custom elements write attributes in lowercase HTML spelling when the bytes matter: `tabindex`, not `tabIndex`; `for`, not `htmlFor`. `className` is fine (prints `class`). On native elements use normal React names.
- Never toggle an attribute on a custom element between a string and `undefined`. Use `null` for "absent" only for `data-*`/`aria-*`; never remove `id`, `title` or `tabIndex` dynamically (2.3). R-3 makes this moot for state attributes.
- Text children MUST be a single string (`{`Lines ${n}`}`), not text plus expression, wherever fixture bytes are compared (2.1).
- Bindings MUST NOT render `inert`, and MUST NOT set `style` on `<html>`; the elements manage both while a modal is open.
- Bindings MUST NOT conditionally render, reorder or re-key a node that an element moves at runtime (navigation-menu content, anything with `container`, sheet presentation). Hide with element state instead.
- Element registration (`import "@ui-sdk/web/tabs"`) MAY happen before or after hydration; both orders are safe under R-1. The React entry SHOULD import the element modules at module top level so client-rendered routes upgrade synchronously.
- TypeScript: `@ui-sdk/web` declares `HTMLElementTagNameMap` (`dist/events.d.ts`) but no JSX `IntrinsicElements`. Ripple MUST ship a `.d.ts` that declares the `ui-*` and `rp-*` tags for `react/jsx-runtime`.

### 7.2 `useElement` (verified in `spike/src/final.jsx`)

```tsx
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * Connects a React component to a custom element.
 * - events: DOM event name -> handler. Attached once per name; always calls the latest handler.
 * - props:  live properties to assign. `undefined` means "do not touch" (uncontrolled).
 */
export function useElement<E extends HTMLElement>(
  ref: RefObject<E | null>,
  { props = {}, events = {} }: {
    props?: Record<string, unknown>
    events?: Record<string, (event: CustomEvent) => void>
  },
) {
  const latest = useRef(events)
  latest.current = events

  const names = Object.keys(events).sort().join(",")
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const off = names.split(",").filter(Boolean).map((name) => {
      const fn = (e: Event) => latest.current[name]?.(e as CustomEvent)
      el.addEventListener(name, fn)
      return () => el.removeEventListener(name, fn)
    })
    return () => off.forEach((f) => f())
  }, [ref, names])

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let live = true
    const assign = () => {
      if (!live) return
      for (const [key, value] of Object.entries(props)) {
        if (value !== undefined && (el as any)[key] !== value) (el as any)[key] = value
      }
    }
    if (customElements.get(el.localName)) assign()
    else customElements.whenDefined(el.localName).then(assign)
    return () => { live = false }
  })
}
```

### 7.3 Wrapper template (Tabs; verified)

```tsx
export function Tabs({ id: idProp, value, defaultValue, onValueChange, label, items }: TabsProps) {
  const autoId = useId()
  const id = idProp ?? `rp${autoId.replace(/[^a-zA-Z0-9]/g, "")}`
  const ref = useRef<HTMLElement>(null)
  const controlled = value !== undefined
  // R-3: captured once. Never recomputed.
  const [initial] = useState(() => value ?? defaultValue ?? items[0].value)

  useElement(ref, {
    props: { value },                                   // R-5: undefined when uncontrolled
    events: {
      valuechange: (e) => {
        if (controlled) e.preventDefault()              // R-5: element waits for the prop
        onValueChange?.(e.detail.value, e.detail)
      },
    },
  })

  return (
    <ui-tabs ref={ref} id={id} className="rp-tabs" default-value={initial}
      data-slot="tabs" data-orientation="horizontal" data-activation-direction="none" suppressHydrationWarning>
      <ui-tabs-list aria-label={label} className="rp-tabs-list" data-slot="tabs-list" role="tablist"
        data-orientation="horizontal" data-activation-direction="none" suppressHydrationWarning>
        {items.map((it) => {
          const sel = it.value === initial
          return (
            <ui-tabs-tab key={it.value} value={it.value} role="none" suppressHydrationWarning>
              <button type="button" className="rp-tabs-tab" data-slot="tabs-tab" role="tab"
                id={`${id}-tab-${it.value}`} tabIndex={sel ? 0 : -1}
                aria-selected={sel ? "true" : "false"} data-selected={sel ? "" : null}
                data-orientation="horizontal" data-activation-direction="none"
                aria-controls={sel ? `${id}-panel-${it.value}` : null} suppressHydrationWarning>
                {it.label}
              </button>
            </ui-tabs-tab>
          )
        })}
      </ui-tabs-list>
      {items.map((it) => it.value === initial ? (
        <ui-tabs-panel key={it.value} value={it.value} className="rp-tabs-panel" data-slot="tabs-panel"
          role="tabpanel" id={`${id}-panel-${it.value}`} aria-labelledby={`${id}-tab-${it.value}`}
          data-selected="" data-orientation="horizontal" data-activation-direction="none" tabindex="0"
          suppressHydrationWarning>{it.content}</ui-tabs-panel>
      ) : (
        <ui-tabs-panel key={it.value} value={it.value} className="rp-tabs-panel" hidden=""
          data-slot="tabs-panel" suppressHydrationWarning>{it.content}</ui-tabs-panel>
      ))}
    </ui-tabs>
  )
}
```

Notes on the template:

- The spike used the root id passed by the caller. The `useId()` fallback shown above is UNVERIFIED-BY-RUN (React's `useId` output contains characters such as `_R_1_`; the sanitising step is a proposal).
- Attribute order in the JSX is the order printed by `renderToString`. Fixture comparison SHOULD normalise attribute order rather than rely on it.
- The Dialog wrapper has the same shape: `props: { open }`, event `openchange`, closed-state contract (`hidden=""` on backdrop and content, `data-closed=""` and `aria-haspopup="dialog"` on the trigger button, `role="heading" aria-level="2"` on `ui-dialog-title`, `role="paragraph"` on `ui-dialog-description`). Full code in `spike/src/final.jsx`.

### 7.4 Decision rule a weaker model can follow

1. Is the component static (no `ui-*` or `rp-*` tag in its contract)? Write a plain function component that prints the contract HTML. No hooks, no `"use client"`.
2. Does the contract contain a `ui-*` or `rp-*` tag? Then:
   1. Add `"use client"` to the file.
   2. Copy the contract HTML for the initial state into JSX exactly.
   3. Capture the initial state once with `useState(() => …)` and compute every state attribute from it.
   4. Add `suppressHydrationWarning` to every `ui-*`/`rp-*` element and every element they bind to.
   5. Call `useElement(ref, { props, events })`. Controlled prop present: `preventDefault()` in the handler.
   6. Never import from `@ui-sdk/react`.
3. Run the fixture test and the upgrade-stability test (section 8, item 4). Both MUST pass.

---

## 8. What the spec must say

1. **React binding strategy.** The React binding MUST render the `ui-*` and `rp-*` custom elements and the same HTML contract as other hosts. `@ui-sdk/react` MUST NOT be a dependency of Ripple. (`@ui-sdk/web` and `@ui-sdk/core` are.)
2. **Contract definition.** For every interactive component, the HTML contract for a given initial state is defined as the **post-upgrade DOM** of the UI SDK elements in that state, plus Ripple's `rp-` classes and `data-` prop attributes. Server HTML is never the author-only shorthand from the UI SDK docs.
3. **Contract generation.** Fixtures for interactive components SHOULD be generated mechanically: load author markup in headless Chromium, upgrade, serialize. `spike/idem.mjs` is the prototype.
4. **Upgrade-stability test (new, mandatory).** For every fixture: load the fixture HTML, start a `MutationObserver` (attributes, childList, characterData, subtree), register the elements, wait, assert **zero** records. This runs for every host's output. Components on the "not idempotent" list in 3.2 need an explicit, documented allow-list of tolerated mutations (for example slider `style` re-ordering).
5. **Hydration test (mandatory for the React binding).** For every interactive component and both orders (elements defined before `hydrateRoot`; after): assert no console output in a development build, no `onRecoverableError` call, the root DOM node identity unchanged, and that the change callback fires on the first user interaction with no intervening re-render. `spike/final.mjs` is the prototype.
6. **Required root id** (R-2) and the id derivation table per component.
7. **The five rules R-1 to R-5 and the supporting rules** in 7.1, verbatim, in the React binding chapter and in the agent skill for writing bindings.
8. **`useElement`** (7.2) ships in the versioned library (not scaffolded), exported from the React entry. The scaffolded React bindings import it.
9. **Events.** The public React prop names are camelCase callbacks (`onValueChange(value, detail)`, `onOpenChange(open, detail)`); they are implemented with `addEventListener` on lowercase DOM events (`valuechange`, `openchange`). The manifest MUST record, per component: DOM event name, `detail` shape, React callback name.
10. **Controlled vs uncontrolled.** Every stateful component accepts `value`/`defaultValue` or `open`/`defaultOpen`. Controlled mode uses veto + property assignment (R-5). The manifest MUST record the live property name per component.
11. **Drawer contract** MUST include `<ui-drawer-viewport>` wrapping `<ui-drawer-content>`. CartDrawer and MobileNav inherit this.
12. **Components needing a design decision before implementation** because the element restructures or regenerates DOM (3.2, 3.3). For each, the spec MUST state one of: (i) pre-render the generated children in the contract, (ii) treat the element's subtree as element-owned (the binding prints an empty container and never renders children into it), or (iii) do not use the UI SDK element.
    - NavigationMenu (content is moved into a viewport on open): the React binding MUST NOT conditionally render or reorder `ui-navigation-menu-content`. Consider (iii) with native `<details>`/popover for the header mega-menu. Needs its own spike.
    - Pagination: recommend (iii), plain links; a storefront paginates with URLs.
    - Toast: (ii); the region is element-owned, toasts are created through the element API, not as React children.
    - Carousel: needs its own spike (layout-dependent `inert`/`aria-hidden`).
    - Slider: (i) with the `style` re-ordering allow-listed, or native `<input type="range">`.
    - Field error text: (ii) for the message node.
    - Dialog `data-presentation="sheet"` and any `container` attribute: MUST NOT be used in V1 contracts.
13. **Client-only render.** When React creates a component on the client (route transition), it prints the same contract HTML; the element upgrades on insertion. No separate code path. (Verified for drawer remount.)
14. **Types.** Ship JSX `IntrinsicElements` declarations for `ui-*` and `rp-*` tags.
15. **Hydrogen in React.** State which wiring from section 6 is chosen. If (a): Ripple exposes one store accessor used by `rp-*` elements and by React hooks built on `useSyncExternalStore`; the React binding MUST NOT also mount `CartProvider` from `@shopify/hydrogen/react`. If (b): the React entry MUST NOT register `rp-*` commerce elements.
16. **Conformance comparison.** Byte comparison of React output against fixtures MUST normalise: attribute order, `tabIndex`/`tabindex` case, `<!-- -->` text separators, and boolean attribute form (`hidden=""`). Alternatively the binding avoids each (7.1 supporting rules) and comparison is strict; pick one and state it.
17. **Dependency pinning.** All results are for `@ui-sdk/*@0.1.0-beta.14` and `react@19.3.1`. The attributes an element writes are not a documented stable API. Ripple MUST pin exact UI SDK versions, and the upgrade-stability test is the tripwire for upgrades: a UI SDK bump that changes written attributes fails item 4 and forces a fixture regeneration.

---

## 9. Not verified here

- React Server Components / streaming with multiple Suspense boundaries (only `renderToString` + `hydrateRoot` on one root was run). R-1 makes order irrelevant in principle; the hydration test in item 5 SHOULD add a streamed case.
- Remix 3 (`remix/packages/component`) hydration. Owned by another investigation; R-1 (upgrade-stable HTML) is host-independent and applies there too.
- Popover, Tooltip, Menu, Select, Accordion, Drawer were probed for upgrade idempotence (3.2) and Drawer for hydration (3.4), but only Tabs and Dialog were run through the full final pattern (4.2). Accordion was run through the naive pattern only.
- Form-associated controls (`ui-checkbox`, `ui-switch`, `ui-select`, `ui-number-input`): the web adapter uses `ElementInternals` and no hidden native input (`uisdk/contributing/architecture.md` line 116), so their values do not submit before upgrade unless the contract includes a native control. Not run. This is a progressive-enhancement question for the forms chapter, and argues for native-first (`<select>`, `<input type="checkbox">`, `<input type="number">`) in V1.
- Two Hydrogen cart stores on one page staying in sync (section 6).
- The `useId()` fallback for root ids (7.3).
- Firefox and Safari. All runs were Chromium. The `id="undefined"` behavior and ARIA property reflection (`role in element`) are browser-dependent details; R-3 avoids depending on them.
