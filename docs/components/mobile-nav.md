# MobileNav

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `mobile-nav` |
| Kind | `native` |
| Category | `chrome` |
| Custom elements | `rp-dialog` |
| Root element and class | `rp-dialog` `.rp-drawer.rp-mobile-nav` (composes Drawer by contract, D-017, D-070) |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `drawer`, `icon-button`, `icon` |
| Milestone | M4 |

### Purpose

The small-screen navigation: a Drawer (native modal `<dialog>` inside `rp-dialog`, D-008) that lists the whole menu, with nested `<details>` for sublevels. Its opener is a link to the footer menu (D-009), so the menu is reachable when JavaScript never loads.

- Use when: rendering the store's main menu for widths below `lg`. Render it once, in the `layout` blueprint, outside Header.
- Do not use when: rendering desktop navigation (use NavigationMenu) or any other drawer (use Drawer).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `MobileNav` | `blocks/mobile-nav.liquid` | `rp-dialog` | `rp-drawer rp-mobile-nav` | `data-slot="rp-dialog"` | yes | none (D-008: the id is on `panel`) |
| panel (Drawer part) | none (printed by root) | same file | `dialog` | `rp-drawer-panel` | none | yes | `<id>` |
| header (Drawer part) | none (printed by root) | same file | `div` | `rp-drawer-header` | none | yes | none |
| title (Drawer part) | none (printed by root) | same file | `h2` | `rp-drawer-title` | none | yes | `<id>-title` |
| close | none (printed by root) | same file | `button` (IconButton) | `rp-icon-button` | none | yes | none |
| body (Drawer part) | none (printed by root) | same file | `div` | `rp-drawer-body` | none | yes | none |
| list | none (default body) | same file | `ul` | `rp-mobile-nav-list` | none | yes; nested once per level | none |
| item | none (default body) | same file | `li` | `rp-mobile-nav-item` | none | one per menu item | none |
| link | none (default body) | same file | `a` | `rp-mobile-nav-link` | none | per item with URL | none |
| group | none (default body) | same file | `details` | `rp-mobile-nav-group` | none | per item with children | none |
| trigger | none (default body) | same file | `summary` | `rp-mobile-nav-trigger` | none | one per `group` | none |

Composition (D-017, D-070): the root, `panel`, `header`, `title` and `body` are the parts of Drawer (`10-components-interactive.md` `## Drawer`), printed by the MobileNav binding itself, following the Drawer contract exactly, with the class `rp-mobile-nav` added after `rp-drawer` on the root. MobileNav's OWN parts and classes are only `list`, `item`, `link`, `group`, `trigger`. `close` is an embedded IconButton with `commandFor="<id>"` and `command="close"`; Drawer has no close part.

Nesting rules: root contains exactly one `panel`. `panel` contains `header` then `body`. `header` contains `title` then `close`. `body` contains one `list`. An item without children is `<li><a class="rp-mobile-nav-link">`. An item with children is `<li><details class="rp-mobile-nav-group"><summary>title + chevron Icon</summary><ul class="rp-mobile-nav-list">...</ul></details></li>`; when that item has a URL, the nested list starts with one extra `item` whose `link` goes to the item's own URL and repeats its title. MobileNav MUST be outside every region (D-046 item 5) and outside Header, `<main>` and Footer. The opener is not a part (D-008 item 2): it is the Header's menu opener, `<a href="#<footer menu id>" data-rp-open="<id>">`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on `panel`; `<id>-title` on `title`; `commandfor` on `close` |
| `menu` | `menu` | object | `RippleMenu`; Liquid: a linklist drop | TSX: none. Liquid: `linklists['main-menu']` | yes in TSX (unless children are supplied) | no | default body |
| `side` | `side` | enum | `start`, `end` (a subset of Drawer's `side`; `bottom` is not accepted) | `start` | no | no | `data-side` on `panel` |
| `strings` | none | object | keys `title`, `close` | `"Menu"`, `"Close"` | no | no | TSX hosts only |

### Content model

`flow` - the default body is the menu as nested lists inside `body`. Children, when supplied, replace the content of `body`. `title` and `close` are always printed by the component.

### HTML contract

Fixture `default` (`id: "mobile-nav"`, `menu: menu.main`):

```html
<rp-dialog class="rp-drawer rp-mobile-nav" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="mobile-nav" data-side="start" aria-labelledby="mobile-nav-title" closedby="any">
    <div class="rp-drawer-header">
      <h2 class="rp-drawer-title" id="mobile-nav-title">Menu</h2>
      <button class="rp-icon-button" type="button" commandfor="mobile-nav" command="close" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="rp-drawer-body">
      <ul class="rp-mobile-nav-list">
        <li class="rp-mobile-nav-item">
          <details class="rp-mobile-nav-group" open>
            <summary class="rp-mobile-nav-trigger">Shop<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
            <ul class="rp-mobile-nav-list">
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/all" aria-current="page">Shop</a></li>
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/shirts">Shirts</a></li>
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/socks">Socks</a></li>
            </ul>
          </details>
        </li>
        <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/pages/about">About</a></li>
      </ul>
    </div>
  </dialog>
</rp-dialog>
```

Rule for `open` on a `group`: printed when the item itself is `current` or any descendant is `current` (Liquid: `link.current == true or link.child_current == true`). In `default` the first group is open because `Shop` is current.

Fixture `deep` (`id: "mobile-nav"`, `menu: menu.deep`, `side: "end"`): `panel` has `data-side="end"`; `body` contains:

```html
<ul class="rp-mobile-nav-list">
  <li class="rp-mobile-nav-item">
    <details class="rp-mobile-nav-group" open>
      <summary class="rp-mobile-nav-trigger">Clothing<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
      <ul class="rp-mobile-nav-list">
        <li class="rp-mobile-nav-item">
          <details class="rp-mobile-nav-group" open>
            <summary class="rp-mobile-nav-trigger">Tops<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
            <ul class="rp-mobile-nav-list">
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/tops">Tops</a></li>
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/shirts" aria-current="page">Shirts</a></li>
            </ul>
          </details>
        </li>
      </ul>
    </details>
  </li>
</ul>
```

Fixture `empty` (`id: "mobile-nav"`, `menu: menu.empty`): `body` contains `<ul class="rp-mobile-nav-list"></ul>`.

Fixture `invalid-enum-falls-back` (`side: "left"`): `data-side="start"`. `side: "bottom"` also falls back to `start`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-drawer rp-mobile-nav custom-a custom-b`.

There is no `defaultOpen` prop: a navigation drawer that opens on load would hide the page.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | `panel` | browser (`showModal()` / `close()`) | opened by the opener listener; closed by the close command, Escape, backdrop press, or navigation | absent (the server MUST NOT print it) |
| `open` | `group` | server, then browser | initial: current trail; then the shopper toggles it | present on groups in the current trail |
| `aria-current="page"` | `link` | server | the item's `current` is true | `page` or absent |
| `aria-haspopup`, `aria-controls` | the opener link (outside this component) | runtime | after upgrade | absent |

Upgrade allow-list (mutations permitted when the element upgrades): None of its own (global entry 1 covers the opener).

### Behaviour with JavaScript

Owned by `04-elements.md` section 9.1 (`rp-dialog`) and 3.4 (opener listener); MobileNav adds nothing. Summary of the testable statements:

1. Opening: the opener behaviour of `04-elements.md` section 3.4 (D-009) applies to `a[data-rp-open="<id>"]`; it is not restated here.
2. `close` (Invoker Command `close`, polyfilled), Escape and a press on the backdrop close the dialog. `rp-dialog` dispatches `openchange` on the root with `detail.value` `true` or `false`.
3. Focus moves into the dialog on open (first focusable element: `close`) and returns to the opener on close.
4. A link inside the drawer navigates; `rp-dialog` closes the dialog when a navigation with a source element starts (`04-elements.md` section 9.1).
5. Toggling a `group` is native; several groups MAY be open at once (no `name` attribute).

### Behaviour without JavaScript

The opener link scrolls to the footer menu (`#footer-menu`), which lists the top-level links; every menu level is reachable from there by navigation. The drawer never opens. Nothing is hidden with `data-rp-js`. The level is `full` because the primary function (reaching every destination) completes through the fallback link (`noJs.fallbackHref`: `footer menu anchor`). In a browser with Invoker Commands the `close` button works natively, which matters only if the dialog was opened.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `openchange` | `rp-dialog` root | `{ value: boolean, reason: string }` (`04-elements.md` 11.1) | `onOpenChange` |
| command | `close` | `panel` (from the `close` button) | none | none |
| method | `open`, `close` | `rp-dialog` (primitive `api`) | none | none |

`open` is NOT controllable in React (D-036 limits controlled `open` to Dialog and Drawer).

### Accessibility

- Pattern: native modal `<dialog>` (Drawer) containing a list of links with native disclosures; `checkPattern`: none. The dialog's name ("Menu") identifies the content, so no `<nav>` landmark is printed inside it.
- Accessible name: `panel` by `aria-labelledby="<id>-title"` (title text `ripple.mobile-nav.title`, "Menu"); `close` by `ripple.mobile-nav.close` ("Close").
- Focus: on open, the first focusable element in the dialog; on close, the opener link.
- Announcements: None.

| Key | Action |
|---|---|
| Escape | Close the drawer |
| Tab / Shift+Tab | Cycle within the drawer (native modal dialog) |
| Enter, Space on a `trigger` | Toggle the group (native) |

### Styling

- File: `components/mobile-nav/mobile-nav.css` (layer `rp.components`). It styles `.rp-mobile-nav` and the five own classes only. It MUST NOT contain a rule for the panel, the backdrop, the header, the title, the body or the open/close transition: `drawer.css` styles those through the Drawer classes (D-017, D-085).
- Tokens used: `--color-accent`, `--color-ring`, `--spacing`, `--spacing-control-md`, `--text-base`, `--rp-duration-base`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-mobile-nav-indent` | `calc(var(--spacing) * 4)` | Inline-start indent of each nested `list` |

A project that wants a different panel width sets Drawer's `--rp-drawer-size` (`10-components-interactive.md` `## Drawer`, Styling).

| Modifier selector | Sets |
|---|---|
| `.rp-mobile-nav-group[open] > .rp-mobile-nav-trigger` | rotates the chevron Icon by 180 degrees |

Required rules:

1. `.rp-mobile-nav`: declares `--rp-mobile-nav-indent`.
2. `list`: `margin: 0; padding: 0; list-style: none`; a `list` inside a `group` has `padding-inline-start: var(--rp-mobile-nav-indent)`.
3. `link`, `trigger`: `display: flex; align-items: center; justify-content: space-between; min-block-size: var(--spacing-control-md); font-size: var(--text-base)`; focus ring `outline: 2px solid var(--color-ring)` on `:focus-visible`; `trigger` hides the native marker (`list-style: none` and `::-webkit-details-marker { display: none }`).
4. The chevron rotation uses `--rp-duration-base` inside `@media (prefers-reduced-motion: no-preference)`.

Manifest: `root.class` is `"rp-drawer rp-mobile-nav"`; `dependencies.components` is `["drawer", "icon-button", "icon"]`; `dependencies.embeds` is `["icon-button", "icon"]` (D-070).

### Host notes

- HTML: copy the fixture.
- React: `export function MobileNav(props: MobileNavProps): JSX.Element`, hand-written after the Drawer binding (`10-components-interactive.md` `## Drawer`, Host notes; `06-bindings.md` section 6.6): `useElement(ref, { events: { openchange: onOpenChange } })`; `<dialog>` is an ordinary React element; `suppressHydrationWarning` on `<rp-dialog>` and on `<dialog>`. The binding prints the Drawer markup itself (compose by contract, D-070); it does not render `<Drawer>`. The closer is `<IconButton icon="close" ariaLabel={strings.close} commandFor={id} command="close" />`. The file starts with `"use client"` and exports the component only (D-094).
- Remix: `data-rmx-key={id}` on `<rp-dialog>`; `data-rmx-preserve-attrs="open"` on `<dialog>` and on every `<details class="rp-mobile-nav-group">`.
- Liquid: block `mobile-nav`; markup in the block file (not embedded by another file). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Schema settings: `side` (select; label `t:ripple.props.side`, option labels `t:ripple.props.start`, `t:ripple.props.end`; block name `t:ripple.mobile-nav.name`, D-038). Locale keys: `ripple.mobile-nav.name`, `ripple.mobile-nav.title` ("Menu"), `ripple.mobile-nav.close` ("Close").

```tsx
<MobileNav id="mobile-nav" menu={menu} />
```

```liquid
{% block 'mobile-nav', id: 'mobile-nav' %}{% endblock %}
```

Body of `components/mobile-nav/liquid/blocks/mobile-nav.liquid` between `{% doc %}` and `{% schema %}` (complete):

```liquid
{%- liquid
  if menu == blank
    assign menu = linklists['main-menu']
  endif
  assign allowed_side = 'start,end' | split: ','
  unless allowed_side contains side
    assign side = 'start'
  endunless
  assign title_text = 'ripple.mobile-nav.title' | t
  assign close_label = 'ripple.mobile-nav.close' | t
  assign title_id = id | append: '-title'
-%}
{%- capture chevron -%}{% render 'rp-icon', name: 'chevron-down' %}{%- endcapture -%}
<rp-dialog
  class="rp-drawer rp-mobile-nav {{ class | escape }}"
  data-slot="rp-dialog"
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  <dialog class="rp-drawer-panel" id="{{ id | escape }}" data-side="{{ side }}" aria-labelledby="{{ title_id | escape }}" closedby="any">
    <div class="rp-drawer-header">
      <h2 class="rp-drawer-title" id="{{ title_id | escape }}">{{ title_text | escape }}</h2>
      {% render 'rp-icon-button', icon: 'close', aria_label: close_label, command_for: id, command: 'close' %}
    </div>
    <div class="rp-drawer-body">
      {%- if content != blank -%}
        {{ content }}
      {%- else -%}
        <ul class="rp-mobile-nav-list">
          {%- for link in menu.links -%}
            <li class="rp-mobile-nav-item">
              {%- if link.links.size > 0 -%}
                <details class="rp-mobile-nav-group"{% if link.current == true or link.child_current == true %} open{% endif %}>
                  <summary class="rp-mobile-nav-trigger">{{ link.title | escape }}{{ chevron }}</summary>
                  <ul class="rp-mobile-nav-list">
                    {%- if link.url != blank and link.url != '#' -%}
                      <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a></li>
                    {%- endif -%}
                    {%- for child in link.links -%}
                      <li class="rp-mobile-nav-item">
                        {%- if child.links.size > 0 -%}
                          <details class="rp-mobile-nav-group"{% if child.current == true or child.child_current == true %} open{% endif %}>
                            <summary class="rp-mobile-nav-trigger">{{ child.title | escape }}{{ chevron }}</summary>
                            <ul class="rp-mobile-nav-list">
                              {%- if child.url != blank and child.url != '#' -%}
                                <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="{{ child.url | escape }}"{% if child.current == true %} aria-current="page"{% endif %}>{{ child.title | escape }}</a></li>
                              {%- endif -%}
                              {%- for grandchild in child.links -%}
                                {%- if grandchild.url != blank and grandchild.url != '#' -%}
                                  <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="{{ grandchild.url | escape }}"{% if grandchild.current == true %} aria-current="page"{% endif %}>{{ grandchild.title | escape }}</a></li>
                                {%- endif -%}
                              {%- endfor -%}
                            </ul>
                          </details>
                        {%- elsif child.url != blank and child.url != '#' -%}
                          <a class="rp-mobile-nav-link" href="{{ child.url | escape }}"{% if child.current == true %} aria-current="page"{% endif %}>{{ child.title | escape }}</a>
                        {%- endif -%}
                      </li>
                    {%- endfor -%}
                  </ul>
                </details>
              {%- elsif link.url != blank and link.url != '#' -%}
                <a class="rp-mobile-nav-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a>
              {%- endif -%}
            </li>
          {%- endfor -%}
        </ul>
      {%- endif -%}
    </div>
  </dialog>
</rp-dialog>
```

`link.child_current` is the Liquid field for "a descendant is current"; TSX bindings compute it by walking `items`.

### Commerce

None.

### Agent surface

`bridge`; `agent.component`: `rp-dialog`. Actions: `open`, `close` (the actions of the `rp-dialog` primitive, `04-elements.md` section 12). Confirm: none. Secret: none.

### Checker rules

- RP113 structure rules: `mobile-nav-once` (at most one `.rp-mobile-nav` per document); `mobile-nav-needs-opener` (a document that contains `.rp-mobile-nav dialog#X` contains `a[data-rp-open="X"][href]`); Drawer's structure rules apply to the composed parts (the `title` part is always printed).
- RP302 (opener is a link), RP303 (no `open`, `hidden`, `aria-hidden`, `aria-modal` on the dialog), RP404 (Liquid: not between `{% partial %}` and `{% endpartial %}`), RP114, RP201.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `deep`, `empty`, `invalid-enum-falls-back`, `class` conform in all four hosts.
- **AT-2** Tier 3: zero mutations inside the root when `ripple.js` loads.
- **AT-3** Tier 5: clicking the opener makes `dialog#mobile-nav` match `[open]` and `:modal`; `document.activeElement` is the close button; Escape closes it and focus returns to the opener.
- **AT-4** Tier 5: `openchange` fires once on open with `detail.value === true` and once on close with `false`.
- **AT-5** Tier 5: at `data-side="start"` in an LTR document the open panel's `getBoundingClientRect().left` is `0`; in an RTL document its `right` equals the viewport width.
- **AT-6** Tier 6: with JavaScript disabled, clicking the opener sets `location.hash` to `#footer-menu`, the dialog is not open, and the footer menu is in the viewport.
- **AT-7** Tier 6 (script failure): the same assertions with every `**/ripple*.js` request aborted.
- **AT-8** Tier 4: React hydration in both script orders reports no hydration warning; Remix morph navigation with the drawer open closes it and leaves no `open` attribute.
- **AT-9** Tier 5: every `link` and `trigger` box is at least 44 px high (the `--spacing-control-md` default).

### Evidence and UNVERIFIED

- Evidence: `04-elements.md` sections 9.1, 10.2, 10.15 (last paragraph); `10-components-interactive.md` `## Drawer` (the composed contract); ledger D-008, D-009, D-017, D-070, D-085; `ripple/theme/snippets/mobile-nav-drawer.liquid`, `ripple/theme/assets/s-mobile-nav.js` (push panels that need JavaScript, replaced by `<details>`); `ripple/docs/research/base-theme.md` 3.4.
- UNVERIFIED: `closedby` support outside Chromium (SPIKE-06; `rp-dialog` has the backdrop-click fallback); `@starting-style` and `allow-discrete` transitions below the browser floor (without them the drawer opens without animation, which is acceptable); `commandfor` printing in React 19 and Remix 3 (SPIKE-05).

### Fallback (SPIKE-05)

If SPIKE-05 shows that a host does not print `commandfor` / `command` unchanged, the `close` button additionally carries `data-rp-close="<id>"` (printed through the IconButton rest props / `attributes`), as defined in `02-html-contract.md` section 15 and `04-elements.md` section 15. Nothing else in this contract changes.

---
