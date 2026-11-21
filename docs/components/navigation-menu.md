# NavigationMenu

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `navigation-menu` |
| Kind | `native` |
| Category | `chrome` |
| Custom elements | `rp-navigation-menu` |
| Root element and class | `rp-navigation-menu` `.rp-navigation-menu` |
| Liquid tier | `resource` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `icon` |
| Milestone | M4 |

### Purpose

The desktop primary navigation: a row of top-level links; an item with children also has a disclosure button that opens a native `popover` panel listing the children (and grandchildren).

- Use when: rendering the store's main menu in the Header at widths of `lg` and above.
- Do not use when: rendering a simple list of links (use LinkList) or the small-screen menu (use MobileNav).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `NavigationMenu` | `blocks/navigation-menu.liquid` | `rp-navigation-menu` | `rp-navigation-menu` | `data-slot="rp-navigation-menu"` | yes | `<id>` |
| nav | none (printed by root) | same file | `nav` | none | none | yes | none |
| list | none (printed by root) | same file | `ul` | `rp-navigation-menu-list` | none | yes | none |
| item | none (default body) | same file | `li` | `rp-navigation-menu-item` | `data-rp-part="item"` | one per top-level menu item | none |
| link | none (default body) | same file | `a` | `rp-navigation-menu-link` | none | when the item has a URL | none |
| trigger | none (default body) | same file | `button` | `rp-navigation-menu-trigger` | none | when the item has children | none |
| content | none (default body) | same file | `div` | `rp-navigation-menu-content` | none | when the item has children | `<id>-item-<n>` |
| sublist | none (default body) | same file | `ul` | `rp-navigation-menu-sublist` | none | inside `content`; nested once for grandchildren | none |
| subitem | none (default body) | same file | `li` | `rp-navigation-menu-subitem` | none | one per child and per grandchild | none |
| sublink | none (default body) | same file | `a` or `span` | `rp-navigation-menu-sublink` | none | one per subitem | none |

Nesting rules: root contains exactly one `nav`, which contains exactly one `list`. Each `item` is a direct child of `list`. Inside an `item` the order is: `link` (if any), `trigger` (if any), `content` (if any). `content` MUST be inside its `item` (hover intent depends on it, `04-elements.md` 9.3). `<n>` is the 1-based position of the item among the top-level items (it satisfies rule N-10 of `02-html-contract.md`). The `item` part is `multiple`. A `subitem` whose menu item has no URL prints `<span class="rp-navigation-menu-sublink">` instead of `<a>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on root; prefix of panel ids |
| `menu` | `menu` | object | `RippleMenu` (1.2); Liquid: a linklist drop | none | yes (unless children are supplied) | no | default body |
| `ariaLabel` | `aria_label` | string | any text | `{ "t": "ripple.navigation-menu.label" }` ("Main") | no | no | `aria-label` on `nav` |
| `strings` | none | object | key `submenu` | `"{{ title }} submenu"` | no | no | TSX hosts only |

### Content model

`flow`, restricted - the default body is one `item` per top-level entry of `menu`. Children, when supplied, replace the default body and MUST be `<li class="rp-navigation-menu-item" data-rp-part="item">` elements written to this contract (escape hatch; plain HTML). With an empty `menu` and no children the component prints the root, `nav` and an empty `list`.

### HTML contract

Fixture `default` (`id: "main-nav"`, `menu: menu.main`):

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
  <nav aria-label="Main">
    <ul class="rp-navigation-menu-list">
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
        <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <div id="main-nav-item-1" popover="" class="rp-navigation-menu-content">
          <ul class="rp-navigation-menu-sublist">
            <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts">Shirts</a></li>
            <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/socks">Socks</a></li>
          </ul>
        </div>
      </li>
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <a class="rp-navigation-menu-link" href="/pages/about">About</a>
      </li>
    </ul>
  </nav>
</rp-navigation-menu>
```

Fixture `deep` (`id: "main-nav"`, `menu: menu.deep`): a group item without URL (the trigger carries the visible title and no `aria-label`) and a nested `sublist` for grandchildren:

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
  <nav aria-label="Main">
    <ul class="rp-navigation-menu-list">
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1">Clothing<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <div id="main-nav-item-1" popover="" class="rp-navigation-menu-content">
          <ul class="rp-navigation-menu-sublist">
            <li class="rp-navigation-menu-subitem">
              <a class="rp-navigation-menu-sublink" href="/collections/tops">Tops</a>
              <ul class="rp-navigation-menu-sublist">
                <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts" aria-current="page">Shirts</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </nav>
</rp-navigation-menu>
```

Fixture `empty` (`id: "main-nav"`, `menu: menu.empty`):

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav"><nav aria-label="Main"><ul class="rp-navigation-menu-list"></ul></nav></rp-navigation-menu>
```

Fixture `escaping` (`ariaLabel: "Say \"hi\" & <go>"`, `menu: menu.empty`): `nav` has `aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;"`.

Fixture `class` (`class: "custom-a custom-b"`, `menu: menu.empty`): root class is `rp-navigation-menu custom-a custom-b`.

Host-owned regions and masks: None.

Panel ids are `<id>-item-<n>`, `<n>` being the 1-based position of the top-level item (D-017, D-085). The panel's list uses NavigationMenu's own part classes (not `rp-link-list` / `rp-link`). This document is normative for the markup; `04-elements.md` section 10.15 follows it, and the element code of `04-elements.md` 9.3 depends on neither point.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current="page"` | `link`, `sublink` | server | the item's `current` is true | `page` or absent |
| popover open state (no attribute; `:popover-open`) | `content` | browser | the trigger is pressed, or `rp-navigation-menu` calls `showPopover()` / `hidePopover()` | closed |

The element writes no attribute (`04-elements.md` 9.3 item 4). The server MUST NOT print `aria-expanded`, `hidden` or `popover="manual"`.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

Owned by `04-elements.md` section 9.3; summary of the testable statements:

1. Pressing a `trigger` toggles its `content` panel (native). Opening one panel closes any other open panel of the page's auto popovers (native).
2. A mouse pointer resting on an `item` that has a `content` opens it after 120 ms; leaving every item closes all panels of this menu after 250 ms. Touch and pen pointers do not open on hover.
3. With focus on a top-level `link` or `trigger`: ArrowRight (ArrowLeft in RTL) focuses the next item's first link or button, wrapping; ArrowLeft (ArrowRight in RTL) the previous; Home the first; End the last; each closes open panels first. ArrowDown on an item with a panel opens it and focuses its first link.
4. Escape closes the open panel and returns focus to its trigger (native).
5. The element dispatches no event and exposes `api.close()` only (D-017).

### Behaviour without JavaScript

Every top-level link navigates. Every `trigger` opens its panel natively; Escape and an outside press close it. Missing without JavaScript: hover intent and arrow-key movement between top-level items. That is why the level is `degraded` (D-005 lists NavigationMenu under allowed `degraded`). No control is hidden; the triggers carry no `data-rp-js`. In a browser without the popover API the panels are in-flow content and the triggers do nothing (D-081, D-010 amendment c); all links stay reachable.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| method | `close` | `rp-navigation-menu` (primitive `api`) | none; closes every open panel of this menu | none |

This is the complete surface (D-017): no event, no command, no other method.

### Accessibility

- Pattern: APG "Disclosure Navigation Menu" (links plus disclosure buttons; NOT `role="menubar"`); `checkPattern`: none.
- Accessible name: `nav` is named by `ariaLabel`. A `trigger` next to a `link` is named by `ripple.navigation-menu.submenu` with `{{ title }}` replaced by the item title ("Shop submenu"). A `trigger` of an item without URL is named by its text.
- Focus: opening by button keeps focus on the button (native); the panel's links follow the button in tab order because `content` follows `trigger` in the DOM. Closing by Escape returns focus to the trigger (native).
- Announcements: None.

| Key | Action |
|---|---|
| Tab / Shift+Tab | Next / previous link or button; all stay in the tab sequence |
| Enter, Space on a trigger | Toggle its panel (native) |
| Escape | Close the open panel (native) |
| ArrowRight / ArrowLeft | Next / previous top-level item (reversed in RTL); with JavaScript |
| Home / End | First / last top-level item; with JavaScript |
| ArrowDown | Open the panel and focus its first link; with JavaScript |

### Styling

- File: `components/navigation-menu/navigation-menu.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--color-accent`, `--color-ring`, `--radius-surface`, `--radius-control`, `--shadow-md`, `--spacing`, `--spacing-control-md`, `--text-sm`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-navigation-menu-gap` | `calc(var(--spacing) * 6)` | Gap between top-level items |
| `--rp-navigation-menu-content-padding` | `calc(var(--spacing) * 4)` | Padding of a panel |
| `--rp-navigation-menu-content-min-width` | `14rem` | Minimum inline size of a panel |
| `--rp-navigation-menu-columns` | `1` | Number of columns of the first-level `sublist` in a panel |

| Modifier selector | Sets |
|---|---|
| `.rp-navigation-menu-link[aria-current="page"]`, `.rp-navigation-menu-sublink[aria-current="page"]` | `--_fg: var(--color-foreground)`; adds an underline through `text-decoration-line` driven by `--_decoration` |

Required rules:

1. `list`: `display: flex; align-items: center; gap: var(--rp-navigation-menu-gap); margin: 0; padding: 0; list-style: none`.
2. `item`: `display: flex; align-items: center; gap: calc(var(--spacing) * 1); position: relative`.
3. `link`, `trigger`: `min-block-size: var(--spacing-control-md)`; `trigger` with only an icon has `min-inline-size: 1.5rem` (target size 24 px, D-066). Focus ring `outline: 2px solid var(--color-ring)` on `:focus-visible`.
4. `content`: MUST NOT set `display` except under `:popover-open` (`04-elements.md` requirement C-5). Under `:popover-open`: `display: block`. Always: `margin: 0; inset: auto; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-popover); color: var(--color-popover-foreground); box-shadow: var(--shadow-md); padding: var(--rp-navigation-menu-content-padding); min-inline-size: var(--rp-navigation-menu-content-min-width)`.
5. Position, inside `@supports (inset-block-start: anchor(end))`: `position: fixed; inset-block-start: anchor(end); inset-inline-start: anchor(start); position-try-fallbacks: flip-inline`. The implicit anchor of a popover opened by `popovertarget` is its invoker button. Outside `@supports`: `position: fixed; inset-block-start: var(--rp-header-block-size, 4rem); inset-inline: var(--spacing-gutter); ` (a panel spanning the page width under the header).
6. First-level `sublist` inside `content`: `display: grid; grid-template-columns: repeat(var(--rp-navigation-menu-columns), minmax(0, 1fr)); gap: calc(var(--spacing) * 2) calc(var(--spacing) * 6); margin: 0; padding: 0; list-style: none`. Nested `sublist`: `display: block; padding-inline-start: 0; margin-block-start: calc(var(--spacing) * 1)`; its `sublink`s use `--color-muted-foreground` and `--text-sm`.
7. Hover styles inside `@media (hover: hover)`; the open and close transition inside `@media (prefers-reduced-motion: no-preference)` using `--rp-duration-fast`.

### Host notes

- HTML: copy the fixture; one `<li>` per item.
- React: `export function NavigationMenu(props: NavigationMenuProps): JSX.Element`. No hook (the element has no event and no property). `suppressHydrationWarning` on `<rp-navigation-menu>` (D-033). Attributes on the custom element are lowercase (`class`).
- Remix: prints `data-rmx-key={id}` on the root. No `data-rmx-preserve-attrs` (the element writes no attribute; popover open state is preserved by the Remix diff natively, `ripple/docs/research/remix-3.md`).
- Liquid: block `navigation-menu`; markup in `snippets/rp-navigation-menu.liquid` (embedded by Header). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). No schema settings; block name `t:ripple.navigation-menu.name` (D-038). Locale keys: `ripple.navigation-menu.name`, `ripple.navigation-menu.label` ("Main"), `ripple.navigation-menu.submenu` ("{{ title }} submenu").

```tsx
<NavigationMenu id="main-nav" menu={menu} />
```

```liquid
{% block 'navigation-menu', id: 'main-nav', menu: linklists['main-menu'] %}{% endblock %}
```

`components/navigation-menu/liquid/snippets/rp-navigation-menu.liquid` (complete body after the `{% doc %}` header):

```liquid
{%- liquid
  if aria_label == blank
    assign aria_label = 'ripple.navigation-menu.label' | t
  endif
-%}
<rp-navigation-menu
  class="rp-navigation-menu {{ class | escape }}"
  data-slot="rp-navigation-menu"
  id="{{ id | escape }}"
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  <nav aria-label="{{ aria_label | escape }}">
    <ul class="rp-navigation-menu-list">
      {%- if content != blank -%}
        {{ content }}
      {%- else -%}
        {%- for link in menu.links -%}
          {%- liquid
            assign panel_id = id | append: '-item-' | append: forloop.index
            assign has_url = true
            if link.url == blank or link.url == '#'
              assign has_url = false
            endif
          -%}
          <li class="rp-navigation-menu-item" data-rp-part="item">
            {%- if has_url == true -%}
              <a class="rp-navigation-menu-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a>
            {%- endif -%}
            {%- if link.links.size > 0 -%}
              {%- if has_url == true -%}
                {%- assign submenu_label = 'ripple.navigation-menu.submenu' | t: title: link.title -%}
                <button type="button" class="rp-navigation-menu-trigger" popovertarget="{{ panel_id | escape }}" aria-label="{{ submenu_label | escape }}">{% render 'rp-icon', name: 'chevron-down' %}</button>
              {%- else -%}
                <button type="button" class="rp-navigation-menu-trigger" popovertarget="{{ panel_id | escape }}">{{ link.title | escape }}{% render 'rp-icon', name: 'chevron-down' %}</button>
              {%- endif -%}
              <div id="{{ panel_id | escape }}" popover="" class="rp-navigation-menu-content">
                <ul class="rp-navigation-menu-sublist">
                  {%- for child in link.links -%}
                    <li class="rp-navigation-menu-subitem">
                      {%- if child.url == blank or child.url == '#' -%}
                        <span class="rp-navigation-menu-sublink">{{ child.title | escape }}</span>
                      {%- else -%}
                        <a class="rp-navigation-menu-sublink" href="{{ child.url | escape }}"{% if child.current == true %} aria-current="page"{% endif %}>{{ child.title | escape }}</a>
                      {%- endif -%}
                      {%- if child.links.size > 0 -%}
                        <ul class="rp-navigation-menu-sublist">
                          {%- for grandchild in child.links -%}
                            <li class="rp-navigation-menu-subitem">
                              {%- if grandchild.url == blank or grandchild.url == '#' -%}
                                <span class="rp-navigation-menu-sublink">{{ grandchild.title | escape }}</span>
                              {%- else -%}
                                <a class="rp-navigation-menu-sublink" href="{{ grandchild.url | escape }}"{% if grandchild.current == true %} aria-current="page"{% endif %}>{{ grandchild.title | escape }}</a>
                              {%- endif -%}
                            </li>
                          {%- endfor -%}
                        </ul>
                      {%- endif -%}
                    </li>
                  {%- endfor -%}
                </ul>
              </div>
            {%- endif -%}
          </li>
        {%- endfor -%}
      {%- endif -%}
    </ul>
  </nav>
</rp-navigation-menu>
```

An item with no URL and no children prints an empty `<li>`; menus SHOULD NOT contain such items, and TSX bindings MUST skip them (the Liquid snippet prints them to keep `<n>` equal to `forloop.index`; TSX bindings compute `<n>` from the item's index in `menu.items`, counting skipped items, so both hosts derive the same ids).

### Commerce

None.

### Agent surface

`bridge`; `agent.component`: `rp-navigation-menu`. Actions: `close`. Confirm: none. Secret: none. Links and triggers are also in the accessibility tree.

### Checker rules

- RP113 structure rules: `navigation-menu-item-in-list` (every `[data-rp-part="item"]` inside the root is a child of `.rp-navigation-menu-list`); `navigation-menu-content-in-item` (every `.rp-navigation-menu-content` has an ancestor `.rp-navigation-menu-item`); `navigation-menu-trigger-targets-content` (every `.rp-navigation-menu-trigger[popovertarget]` names the id of a `.rp-navigation-menu-content` in the same item).
- RP114 (ids unique and resolving), RP118 (no `aria-expanded` stand-ins such as `data-state`), RP201 (trigger names), RP204 (no popover inside a link or button).

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `deep`, `empty`, `escaping`, `class` conform in all four hosts.
- **AT-2** Tier 3: zero mutations inside the root when `ripple.js` loads.
- **AT-3** Tier 5: hovering the first item with a mouse for 200 ms makes `#main-nav-item-1` match `:popover-open`; moving the pointer out of the menu for 400 ms closes it.
- **AT-4** Tier 5: with focus on the first top-level link, ArrowRight moves focus to the second item's link; End moves to the last; Home to the first; in a `dir="rtl"` document ArrowLeft moves forward.
- **AT-5** Tier 5: ArrowDown on the first item opens its panel and focuses `a[href="/collections/shirts"]`; Escape closes the panel and focus is on the trigger.
- **AT-6** Tier 6: with JavaScript disabled, pressing the trigger opens the panel (Chromium), and clicking `Shop` navigates to `/collections/all`.
- **AT-7** Tier 4: Remix morph navigation between two pages that both render the menu keeps an open panel open and reports no console error.
- **AT-8** Tier 5: every `trigger` and `link` box is at least 24 by 24 CSS px.
- **AT-9** Tier 9: AT-3 to AT-6 pass in WebKit and Gecko, or the SPIKE-07 fallback is activated.

### Evidence and UNVERIFIED

- Evidence: `04-elements.md` sections 9.3 and 10.15 (element code and markup rules); ledger D-017; `ripple/theme/blocks/main-menu.liquid`, `ripple/theme/assets/s-nav-dropdown.js` (the behaviour being replaced); `uisdk/packages/web/src/define-element.ts` (root-only parts, SPIKE-04).
- UNVERIFIED: usability of `popover` panels with hover intent for a mega menu, nested focus order, hover gaps, Remix morph (SPIKE-07); CSS anchor positioning with the implicit invoker anchor outside Chromium (SPIKE-06); the `popover` attribute below Chrome 114 and Safari 17 (D-010 amendment c; behaviour there is D-081).

### Fallback (SPIKE-07)

Activated only if SPIKE-07 rejects the popover design. The complete alternative:

Contract changes (everything not listed is unchanged): `content` loses the `popover` attribute; `trigger` loses `popovertarget` and gains `aria-expanded="false"`, `aria-controls="<id>-item-<n>"` and `data-rp-part="trigger"`.

```html
<li class="rp-navigation-menu-item" data-rp-part="item">
  <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
  <button type="button" class="rp-navigation-menu-trigger" data-rp-part="trigger" data-rp-js="inflow" aria-expanded="false" aria-controls="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
  <div id="main-nav-item-1" class="rp-navigation-menu-content">
    <ul class="rp-navigation-menu-sublist">
      <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts">Shirts</a></li>
    </ul>
  </div>
</li>
```

CSS: `.rp-navigation-menu-content { display: none; position: absolute; inset-block-start: 100%; inset-inline-start: 0; z-index: var(--rp-z-overlay); }` and it is `display: block` when any of these match: `.rp-navigation-menu-item:hover > .rp-navigation-menu-content` (inside `@media (hover: hover)`), `.rp-navigation-menu-item:focus-within > .rp-navigation-menu-content`, `.rp-navigation-menu-trigger[aria-expanded="true"] + .rp-navigation-menu-content`.

Behaviour: `rp-navigation-menu` toggles `aria-expanded` between `"true"` and `"false"` on a `click` of a `[data-rp-part="trigger"]`, sets every other trigger of the menu to `"false"`, sets all to `"false"` on Escape (and focuses the trigger that was expanded) and on `focusout` leaving the root. Arrow keys as in the default path. `state[]` gains `{ on: "trigger", reflects: ["aria-expanded"] }`; Remix prints `data-rmx-preserve-attrs="aria-expanded"` on triggers; React prints `aria-expanded="false"` once and `suppressHydrationWarning`. The pe-2 lint is satisfied by adding `data-rp-js="inflow"` to the trigger (it is JS-only in this variant); without JavaScript the panel still opens on hover and on focus inside the item. Fixture lint `a-4` does not apply (the button has no `popovertarget`).

---
