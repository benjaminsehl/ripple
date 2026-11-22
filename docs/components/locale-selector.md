# LocaleSelector

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `locale-selector` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `div` `.rp-locale-selector` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `button`, `popover`, `icon` |
| Milestone | M4 |

### Purpose

Lets the shopper change country (and with it currency) and language. A Button opens a native Popover that contains one native form; every option is a submit button, so a choice is one press and works without JavaScript.

- Use when: the store sells in more than one country or language.
- Do not use when: there is exactly one country and one language (the component prints nothing in that case).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `LocaleSelector` | `blocks/locale-selector.liquid` | `div` | `rp-locale-selector` | none | yes | none |
| opener | none (printed by root) | same file | `button` (Button) | `rp-button` | none | yes | none |
| panel | none (printed by root) | same file | `div` (Popover panel) | `rp-popover` | none | yes | `<id>` |
| form | none (printed by root) | same file | `form` | `rp-locale-selector-form` | none | yes | `<id>-content` |
| heading | none (printed by root) | same file | `p` | `rp-locale-selector-heading` | none | one per printed group | none |
| list | none (printed by root) | same file | `ul` | `rp-locale-selector-list` | none | one per printed group | none |
| item | none (printed by root) | same file | `li` | `rp-locale-selector-item` | none | one per option | none |
| option | none (printed by root) | same file | `button` | `rp-locale-selector-option` | none | one per `item` | none |

Nesting rules: root contains `opener` then `panel`. `panel` contains exactly one `form`. `form` contains, for each printed group, `heading` then `list`. The country group is printed when there are at least two countries; the language group when there are at least two languages; countries first. When neither group would be printed, the component prints NOTHING (empty output). LocaleSelector MUST NOT be inside a `<form>`, an `<a>` or a `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on `panel`; `popovertarget` on `opener`; `<id>-content` on `form` |
| `countries` | none (reads `localization`) | object | `Array<{ code: string; name: string; currency: string; current: boolean }>` | `[]` | no | no | country group |
| `languages` | none (reads `localization`) | object | `Array<{ code: string; name: string; current: boolean }>` | `[]` | no | no | language group |
| `action` | none (`{% form 'localization' %}`) | url | any URL | `/api/locale` | no | no | `action` on `form` |
| `returnTo` | none (the form tag prints it) | url | site-relative path | none | yes in TSX | no | hidden input `return_to` |
| `side` | `side` | enum | `top`, `bottom`, `start`, `end` | `bottom` | no | no | `data-side` on `panel` |
| `align` | `align` | enum | `start`, `center`, `end` | `start` | no | no | `data-align` on `panel` |
| `strings` | none | object | keys `country`, `language` | `"Country/region"`, `"Language"` | no | no | TSX hosts only |

`countries`, `languages`, `action`, `returnTo` have `hosts: ["html", "react", "remix"]`. `currency` is display text such as `CAD $` (ISO code, a space, the symbol).

### Content model

`none` - no children. Ledger D-037 lists LocaleSelector as tier `resource`; its body is fully determined by the data, so the Liquid block ignores `content` (D-085).

### HTML contract

Fixture `default` (`id: "footer-locale"`, `locale.multi`, `returnTo: "/"`):

```html
<div class="rp-locale-selector">
  <button class="rp-button" type="button" popovertarget="footer-locale" data-variant="ghost" data-size="sm"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>Canada (CAD $) / English</button>
  <div id="footer-locale" popover="" class="rp-popover" data-side="bottom" data-align="start">
    <form class="rp-locale-selector-form" id="footer-locale-content" method="post" action="/api/locale">
      <input type="hidden" name="return_to" value="/">
      <p class="rp-locale-selector-heading">Country/region</p>
      <ul class="rp-locale-selector-list" aria-label="Country/region">
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="country_code" value="CA" aria-current="true">Canada (CAD $)</button></li>
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="country_code" value="US">United States (USD $)</button></li>
      </ul>
      <p class="rp-locale-selector-heading">Language</p>
      <ul class="rp-locale-selector-list" aria-label="Language">
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="locale_code" value="EN" aria-current="true">English</button></li>
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="locale_code" value="FR">français</button></li>
      </ul>
    </form>
  </div>
</div>
```

Opener text rule: the current country's option text when the country group is printed; the current language's name when the language group is printed; joined by ` / ` (space, slash, space) when both are printed.

Fixture `countries-only` (`languages` has one entry; `side: "top"`, `align: "end"`): `panel` has `data-side="top" data-align="end"`; the opener text is `Canada (CAD $)`; the form contains only the country heading and list.

Fixture `single-locale` (one country, one language): the reference HTML is the empty string.

Fixture `invalid-enum-falls-back` (`side: "left"`): `data-side="bottom"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-locale-selector custom-a custom-b`.

Host-owned regions and masks (the form internals differ by backend, following the precedent of D-043):

```json
[
  { "select": "form.rp-locale-selector-form", "op": "attr", "name": "action" },
  { "select": "form.rp-locale-selector-form", "op": "drop-attr", "name": "accept-charset" },
  { "select": "form.rp-locale-selector-form", "op": "drop-attr", "name": "enctype" },
  { "select": "form.rp-locale-selector-form > input[type=\"hidden\"]", "op": "remove" },
  { "select": "button.rp-locale-selector-option", "op": "attr", "name": "value" }
]
```

| | hydrogen backend (`html`, `react`, `remix`) | liquid backend |
|---|---|---|
| Form | `<form method="post" action="<action>">` | `{% form 'localization', id: <id>-content, class: 'rp-locale-selector-form' %}`; the platform prints `method="post" action="/localization"` and hidden inputs `form_type`, `utf8`, `_method`, `return_to` |
| Country field | `country_code` = `countries[].code` (`CA`) | `country_code` = `country.iso_code` |
| Language field | `locale_code` = `languages[].code` (Hydrogen language code, `FR`, `PT_BR`) | `locale_code` = `language.iso_code` (`fr`, `pt-BR`) |
| Return path | hidden `return_to` = `returnTo` | hidden `return_to`, printed by the form tag |
| Handler | the app route of the `layout` blueprint (section 2.6) | the platform |

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current="true"` | `option` | server | the option is the current country or language | `true` or absent |
| popover open state (`:popover-open`) | `panel` | browser | the opener is pressed | closed |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of Ripple's. The popover and the form are native. Pressing an `option` submits the form; the server answers with a redirect; the page loads in the new country or language.

### Behaviour without JavaScript

Identical. In a browser without the popover API the panel is in-flow content below the opener and the opener does nothing; the options still work.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: disclosure (native `popover`) containing a native form of submit buttons; `checkPattern`: none.
- Accessible name: the opener by its text (the current selection); each `list` by `aria-label` (`ripple.locale-selector.country`, `ripple.locale-selector.language`); each option by its text.
- Focus: native popover behaviour; after the form post the page reloads.
- Announcements: None.

| Key | Action |
|---|---|
| Enter, Space on the opener | Toggle the panel (native) |
| Escape | Close the panel (native) |
| Tab | Through the options in DOM order |
| Enter, Space on an option | Submit that choice |

### Styling

- File: `components/locale-selector/locale-selector.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-accent`, `--color-accent-foreground`, `--color-ring`, `--radius-control`, `--spacing`, `--spacing-control-sm`, `--text-sm`, `--text-xs`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-locale-selector-max-height` | `20rem` | Maximum block size of each `list` (it scrolls) |
| `--rp-locale-selector-min-width` | `16rem` | Minimum inline size of `form` |

| Modifier selector | Sets |
|---|---|
| `.rp-locale-selector-option[aria-current="true"]` | `--_bg: var(--color-accent); --_fg: var(--color-accent-foreground)`; `font-weight: 600` through `--_weight` |

Required rules: root `display: inline-block`; `form` `display: flex; flex-direction: column; gap: calc(var(--spacing) * 2); min-inline-size: var(--rp-locale-selector-min-width)`; `heading` `margin: 0; font-size: var(--text-xs); color: var(--color-muted-foreground)`; `list` `margin: 0; padding: 0; list-style: none; max-block-size: var(--rp-locale-selector-max-height); overflow-y: auto`; `option` `display: flex; inline-size: 100%; align-items: center; min-block-size: var(--spacing-control-sm); padding-inline: calc(var(--spacing) * 2); border: 0; border-radius: var(--radius-control); background: var(--_bg, transparent); color: var(--_fg, inherit); font: inherit; font-size: var(--text-sm); text-align: start; cursor: pointer`. The panel's own look comes from `popover.css`.

### Host notes

- Binding paths (D-139): `static` that the template language of `07-manifest-registry-cli.md` 2.3 cannot express (D-072 row 2): no `template`; every fixture is `generated: "hand"`; `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: copy the fixture; the server needs the route of section 2.6.
- React: `export function LocaleSelector(props: LocaleSelectorProps): JSX.Element | null`. Returns `null` when no group would be printed. No hook.
- Remix: the `form` prints `data-rmx-document` (a locale change MUST be a full document load: `hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`, "One locale per page load").
- Liquid: block `locale-selector`. Schema settings: `side`, `align` (select). Locale keys: `ripple.locale-selector.name`, `ripple.locale-selector.country` ("Country/region"), `ripple.locale-selector.language` ("Language"). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Block name `t:ripple.locale-selector.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<LocaleSelector id="footer-locale" countries={locale.countries} languages={locale.languages} returnTo={pathname} side="top" />
```

```liquid
{% block 'locale-selector', id: 'footer-locale', side: 'top' %}{% endblock %}
```

Body of `components/locale-selector/liquid/blocks/locale-selector.liquid` between `{% doc %}` and `{% schema %}` (complete):

```liquid
{%- liquid
  assign allowed_side = 'top,bottom,start,end' | split: ','
  unless allowed_side contains side
    assign side = 'bottom'
  endunless
  assign allowed_align = 'start,center,end' | split: ','
  unless allowed_align contains align
    assign align = 'start'
  endunless
  assign show_countries = false
  if localization.available_countries.size > 1
    assign show_countries = true
  endif
  assign show_languages = false
  if localization.available_languages.size > 1
    assign show_languages = true
  endif
  assign country_label = 'ripple.locale-selector.country' | t
  assign language_label = 'ripple.locale-selector.language' | t
  assign form_id = id | append: '-content'
-%}
{%- if show_countries == true or show_languages == true -%}
  {%- capture opener_content -%}
    {%- render 'rp-icon', name: 'globe' -%}
    {%- if show_countries == true -%}{{ localization.country.name | escape }} ({{ localization.country.currency.iso_code | escape }} {{ localization.country.currency.symbol | escape }}){%- endif -%}
    {%- if show_countries == true and show_languages == true %} / {% endif -%}
    {%- if show_languages == true -%}{{ localization.language.endonym_name | escape }}{%- endif -%}
  {%- endcapture -%}
  <div
    class="rp-locale-selector {{ class | escape }}"
    {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
    {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
    {{ attributes }}
  >
    {% render 'rp-button', variant: 'ghost', size: 'sm', popover_target: id, content: opener_content %}
    <div id="{{ id | escape }}" popover="" class="rp-popover" data-side="{{ side }}" data-align="{{ align }}">
      {%- form 'localization', id: form_id, class: 'rp-locale-selector-form' -%}
        {%- if show_countries == true -%}
          <p class="rp-locale-selector-heading">{{ country_label | escape }}</p>
          <ul class="rp-locale-selector-list" aria-label="{{ country_label | escape }}">
            {%- for country in localization.available_countries -%}
              <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="country_code" value="{{ country.iso_code | escape }}"{% if country.iso_code == localization.country.iso_code %} aria-current="true"{% endif %}>{{ country.name | escape }} ({{ country.currency.iso_code | escape }} {{ country.currency.symbol | escape }})</button></li>
            {%- endfor -%}
          </ul>
        {%- endif -%}
        {%- if show_languages == true -%}
          <p class="rp-locale-selector-heading">{{ language_label | escape }}</p>
          <ul class="rp-locale-selector-list" aria-label="{{ language_label | escape }}">
            {%- for language in localization.available_languages -%}
              <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="locale_code" value="{{ language.iso_code | escape }}"{% if language.iso_code == localization.language.iso_code %} aria-current="true"{% endif %}>{{ language.endonym_name | escape }}</button></li>
            {%- endfor -%}
          </ul>
        {%- endif -%}
      {%- endform -%}
    </div>
  </div>
{%- endif -%}
```

The panel markup is printed inline, following the Popover contract of `10-components-interactive.md` `## Popover` exactly (compose by contract, D-070), because the Popover panel is a part block on Liquid and a block cannot be called from a block file (rule L-12). The root is a `<div>` and prints `{{ attributes }}` LAST (D-035). The `<form>` is printed by `{% form %}` and therefore takes only `id` and `class` (D-091 item 6).

### Commerce

None. (Country and language are not cart state. After the redirect the page is rendered in the new market and the cart is priced by the backend for that market.)

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `locale-selector-not-in-form`: `.rp-locale-selector` MUST NOT have a `form` ancestor.
- RP301 / lint `pe-2`: every `option` is a submit button inside a form with `action` and `method`. RP114: `popovertarget` resolves. RP204: the popover is not inside a link or button.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `countries-only`, `single-locale`, `invalid-enum-falls-back`, `class` conform in all four hosts with the masks above.
- **AT-2** Tier 3: zero mutations when `ripple.js` loads.
- **AT-3** Tier 6 (hydrogen backend, JavaScript disabled): open the panel, press `United States (USD $)`; the browser POSTs `country_code=US` and `return_to` to the action and lands, after a 303, on a URL whose locale is the US locale (route of section 2.6).
- **AT-4** Tier 8 (Liquid live): the same flow against `/localization`; the page reloads with `localization.country.iso_code == 'US'`.
- **AT-5** Tier 5: the opener's accessible name equals the opener text rule; the current option has `aria-current="true"`.
- **AT-6** Tier 5: every option box is at least 24 CSS px high.

### Evidence and UNVERIFIED

- Evidence: Shopify docs (`https://shopify.dev/docs/api/liquid/tags/form`, form `localization`: output `method="post" action="/localization"` with hidden `form_type`, `utf8`, `_method`, `return_to`; `https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages`: `localization.available_countries`, `country.iso_code`, `country.name`, `country.currency.iso_code`, `country.currency.symbol`, field `country_code`); `ripple/theme/snippets/localization-form.liquid` (submit buttons `name="country_code"`; `localization.available_languages`, `localization.language.iso_code`); `ripple/theme/assets/s-localization-dropdown.js` (the script this component removes); `hydrogen/packages/hydrogen/src/core/i18n/href.ts` (`getLocalizedHref`).
- UNVERIFIED: the field name `locale_code` and `language.endonym_name` were not re-read in source in this session (they are the documented localization form fields by general knowledge; the base theme file was read only to line 80); that passing `class:` to `{% form 'localization' %}` replaces the default class; the shim's `form 'localization'` output (section 3, X-5). Tier 8 confirms all three.

### Fallback (SPIKE-nn)

None. (SPIKE-06 covers Popover positioning in `10-components-interactive.md`.)

---
