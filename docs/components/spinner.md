# Spinner

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `spinner` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `span` `.rp-spinner` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

An indeterminate activity indicator for a region whose content is loading.

- Use when: a region is being fetched by script and no layout placeholder fits (a streamed `Suspense` fallback, the body of a drawer before its content arrives).
- Do not use when: a Button is pending (Button draws its own spinner from `pending`; do not nest a Spinner in a Button), the shape of the coming content is known (use Skeleton), or progress is measurable (use Progress).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Spinner` | `blocks/spinner.liquid` | `span` | `rp-spinner` | none | yes | none |

Nesting rules: MUST NOT be placed inside Button or IconButton.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `ariaLabel` | `aria_label` | string | text | locale key `ripple.spinner.label` (`Loading`) | no | no | `aria-label` |

### Content model

`none` - the root is empty.

### HTML contract

Fixture `default` (no props):

```html
<span class="rp-spinner" data-size="md" role="status" aria-label="Loading"></span>
```

Fixture `large-labelled` (`size="lg"`, `ariaLabel="Loading cart"`):

```html
<span class="rp-spinner" data-size="lg" role="status" aria-label="Loading cart"></span>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `large-labelled` | `{ "size": "lg", "ariaLabel": "Loading cart" }` | absent |
| `small` | `{ "size": "sm" }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "size": "bogus" }` (output equals `default`) | absent |
| `escaping` | `{ "ariaLabel": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `role` | root | server | always | `status` |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional as markup. A page MUST NOT print a Spinner for content that only script can replace unless the same region has a no-JS path (`02-html-contract.md` PE-1, PE-8); without script and without motion preference the ring is static.

### Events, commands and methods

None.

### Accessibility

- Pattern: status; `checkPattern`: none.
- Accessible name: `aria-label`, default `Loading` (locale key `ripple.spinner.label`).
- Focus: not focusable.
- Announcements: none by script. When the Spinner is inserted by script the `role="status"` region is announced with its label.
- With `prefers-reduced-motion: reduce` the ring does not rotate; it stays visible as a three-quarter ring.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/spinner/spinner.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--rp-duration-slow`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-spinner-size` | `calc(var(--spacing) * 6)` | inline and block size |

| Modifier selector | Sets |
|---|---|
| `.rp-spinner[data-size="sm"]` | `--rp-spinner-size: calc(var(--spacing) * 4)` |
| `.rp-spinner[data-size="lg"]` | `--rp-spinner-size: calc(var(--spacing) * 8)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-spinner` | custom properties: `--rp-spinner-size`. Declarations: `display: inline-block; box-sizing: border-box; inline-size: var(--rp-spinner-size); block-size: var(--rp-spinner-size); border: 2px solid currentColor; border-block-start-color: transparent; border-radius: 9999px; vertical-align: middle` |
| MOTION | `.rp-spinner` (inside `@media (prefers-reduced-motion: no-preference)`) | `animation: rp-spin calc(var(--rp-duration-slow) * 2) linear infinite` |

The ring takes the current text colour. It has no colour slots and no `tone`.

### Host notes

- HTML: None.
- React: `export function Spinner(props: SpinnerProps)`; generated; `ariaLabel = "Loading"` is a default parameter value (`06-bindings.md` B-7).
- Remix: None.
- Liquid: `{% block 'spinner' %}{% endblock %}`; `aria_label` defaults to `{{ 'ripple.spinner.label' | t }}`. Schema settings: `size`. Locale keys: `ripple.spinner.name`, `ripple.spinner.label`.

```tsx
<Suspense fallback={<Spinner ariaLabel="Loading recommendations" />}>
  <Await resolve={recommendations}>{(r) => <Recommendations data={r} />}</Await>
</Suspense>
```

```liquid
{% block 'spinner', size: 'lg' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]` (reported by RP113, D-059): `spinner-not-in-button`: kind `forbids-ancestor`, selector `:scope`, target `.rp-button, .rp-icon-button`. Message: "A Spinner is nested inside a Button." Fix: "Use the Button pending prop instead of a nested Spinner."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixtures `small`, `default`, `large-labelled` compute an inline size and block size of 16, 24 and 32 px at default dials.
3. Tier 5: with `prefers-reduced-motion: no-preference` emulated, `getComputedStyle(root).animationName` is `rp-spin`; with `reduce` emulated it is `none`.
4. Tier 2: the Liquid host with no `aria_label` prints `aria-label="Loading"` using `locales/en.default.json`.
5. Tier 1: `<button class="rp-button" type="submit" data-variant="primary" data-size="md">` containing fixture `default` produces exactly one RP113 finding whose problem ends with `[spinner-not-in-button]`; fixture `default` alone produces none.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 8.1, D-038 (locale strings); `ripple/docs/03-styling-and-tokens.md` section 4.1 (`rp-spin` keyframes), section 8 rule 2 (spinner duration and easing), CSS-13 (`2px`, `9999px` allowed), CSS-20; `ripple/docs/06-bindings.md` B-7.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
