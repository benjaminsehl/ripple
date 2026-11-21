# SearchForm

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `search-form` |
| Kind | `static` |
| Category | `discovery` |
| Custom elements | none |
| Root element and class | `form` `.rp-search-form` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `input`, `icon-button`, `icon` |
| Milestone | M3 |

### Purpose

A search form: one search input and a submit button, sending `q` to the search page with GET.

- Use when: the header, the search page, or an empty state needs a search box.
- Do not use when: results should appear while typing (use PredictiveSearch, which embeds this form).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `SearchForm` | `blocks/search-form.liquid` + `snippets/rp-search-form.liquid` | `form` | `rp-search-form` | none | yes | none |
| input | printed by root | same | `input` | `rp-input rp-search-form-input` | `data-rp-part="input"` when `predictive` | yes | none |
| submit | printed by root | same | `button` | `rp-icon-button rp-search-form-submit` | none | yes | none |

Nesting rules: root children in order: children (extra hidden fields), input, submit. The root MUST NOT be inside another `<form>`. The markup lives in a snippet because PredictiveSearch embeds it. The input and the submit button compose Input and IconButton by contract (D-070, section 0.2): the generated binding prints both elements itself; manifest part classes `rp-input rp-search-form-input` and `rp-icon-button rp-search-form-submit`; `dependencies.components` contains `input`, `icon-button`, `icon`. The root is a plain `<form>` (not printed by `{% form %}`), so on Liquid it prints `{{ attributes }}` last (D-035).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `action` | `action` | url | the search route | `/search` (Liquid: `routes.search_url`) | no | no | `action` |
| `defaultValue` | `default_value` | string | the current search terms | none | no | no | `value` on the input (omitted when empty) |
| `placeholder` | `placeholder` | string | any text | none | no | no | `placeholder` on the input |
| `ariaLabel` | `aria_label` | string | any text | `Search` | no | no | `aria-label` on the input |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` on the input and on the submit button |
| `predictive` | `predictive` | boolean | `true false` | `false` | no | no | `data-rp-part="input"` and `autocomplete="off"` on the input; set only by PredictiveSearch |

### Content model

`flow` restricted to `<input type="hidden">` elements (for example `<input type="hidden" name="type" value="product">`). They are printed before the input.

### HTML contract

Fixture `default` (no props):

```html
<form class="rp-search-form" method="get" action="/search" role="search">
  <input class="rp-input rp-search-form-input" type="search" data-size="md" name="q" aria-label="Search">
  <button class="rp-icon-button rp-search-form-submit" type="submit" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
</form>
```

Fixture `predictive` (`predictive`: true, `defaultValue`: `shirt`, `placeholder`: `Search products`, children `<input type="hidden" name="type" value="product">`):

```html
<form class="rp-search-form" method="get" action="/search" role="search">
  <input type="hidden" name="type" value="product">
  <input class="rp-input rp-search-form-input" type="search" data-size="md" name="q" value="shirt" placeholder="Search products" aria-label="Search" autocomplete="off" data-rp-part="input">
  <button class="rp-icon-button rp-search-form-submit" type="submit" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
</form>
```

Further required fixtures: `action` (`action`: `/en-ca/search`); `sm` (`size`: `sm`); `class` (root class `rp-search-form custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals `default`); `escaping` (`defaultValue`: `Say "hi" & <go>`; attribute `Say &quot;hi&quot; &amp; &lt;go&gt;`).

Host-owned regions and masks: none.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `value` | input | server | `defaultValue` is not empty | the terms |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. The form submits natively. Inside PredictiveSearch the `rp-predictive-search` element listens to the input part; Enter still submits natively.

### Behaviour without JavaScript

Submitting navigates to `<action>?q=<terms>`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: search landmark (`role="search"` on the form) with a search field; `checkPattern`: none.
- Accessible name: input `aria-label` (default `Search`); submit button `aria-label="Search"`; both required. A page with more than one SearchForm SHOULD pass distinct `ariaLabel` values.
- Focus: input, then submit.
- Announcements: None.

| Key | Action |
|---|---|
| Enter in the input | submits the form |
| Escape in the input | clears it (native `type="search"` behaviour where the browser provides it) |

### Styling

- File: `components/search-form/search-form.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-search-form-gap` | `calc(var(--spacing) * 1)` | space between input and button |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: flex; align-items: center; gap: var(--rp-search-form-gap)`; `.rp-search-form-input { flex: 1 1 auto; min-inline-size: 0 }`.

### Host notes

- HTML: copy the contract.
- React: generated. `SearchForm(props: { action?: string; defaultValue?: string; placeholder?: string; ariaLabel?: string; size?: "sm" | "md" | "lg"; predictive?: boolean; className?: string; children?: ReactNode })`. The input is uncontrolled (`defaultValue`).
- Remix: generated; the form carries no `data-rmx-*` attribute (a GET navigation is handled by the router as a document or client navigation; both are correct).
- Liquid: generated snippet; params `action`, `default_value`, `placeholder`, `aria_label`, `size`, `predictive` (the mechanical mapping of ledger section 4.2: TSX `defaultValue` is Liquid `default_value`); the block wrapper applies `action | default: routes.search_url`. Schema settings: `placeholder`, `size` (labels `t:ripple.props.placeholder`, `t:ripple.props.size`; block name `t:ripple.search-form.name`; D-038). Locale key: `ripple.search-form.label` = `Search`.

```tsx
<SearchForm defaultValue={terms} placeholder="Search products" />
```

```liquid
{% block 'search-form', default_value: search.terms, placeholder: 'Search products' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP110, RP201 (input and button names). Manifest `rules[]`: `search-form-q` (`requires-descendant`, selector `:scope`, target `input[type="search"][name="q"]`); `search-form-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`).

### Acceptance tests

1. Tier 2: `default`, `predictive`, `action`, `sm`, `class`, `invalid-enum-falls-back`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: the form is exposed as a `search` landmark and the input's accessible name is `Search`.
3. Tier 6: with scripting disabled, typing `shirt` and pressing Enter navigates to `/search?q=shirt`.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) section 7.4 (required input markup); `ripple/docs/research/base-theme.md` (search form in header and search template).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
