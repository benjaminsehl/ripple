# Dialog

A modal window over the page, opened by a trigger button.

- Kind: ui. Without JavaScript: none. The trigger does nothing and the content stays hidden. Do not put required content only in a Dialog. For an opener with a page equivalent, use a plain link (see drawer / cart-drawer).
- Accessibility: dialog (modal). Name required: always.
- Agents: bridge (setOpen, press).

## Use when
- Short, self-contained content that must interrupt: size guide, confirm, quick view

## Use something else when
- Panel sliding from a screen edge (cart, mobile menu): use `drawer`.
- Content that must be reachable when JavaScript never loads: use `a link to a page, or accordion`.

## Props

| Prop | Values | Default | Responsive | Hosts | Description |
|---|---|---|---|---|---|
| `id` | id |  |  | all | Unique, stable id. Part ids derive from it: <id>-trigger, <id>-title, <id>-description. |
| `defaultOpen` | boolean | false |  | html, react, remix | Open on first render. Not available in Liquid V1: the server cannot print open-state markup. |
| `open` | boolean |  |  | react | Controlled open state (React only). Use with onOpenChange. |

## HTML contract

`closed`

```html
<ui-dialog id="size-guide" class="rp-dialog"><ui-dialog-trigger class="rp-dialog-trigger"><button type="button" id="size-guide-trigger" class="rp-button" data-variant="link" data-size="md" aria-haspopup="dialog" data-closed data-slot="dialog-trigger">Size guide</button></ui-dialog-trigger><ui-dialog-backdrop class="rp-dialog-backdrop" hidden data-slot="dialog-backdrop"></ui-dialog-backdrop><ui-dialog-content class="rp-dialog-content" hidden data-slot="dialog-content"><ui-dialog-title id="size-guide-title" class="rp-dialog-title" role="heading" aria-level="2" data-slot="dialog-title">Size guide</ui-dialog-title><p>Measure your foot.</p><ui-dialog-close class="rp-dialog-close"><button type="button" class="rp-icon-button" aria-label="Close" data-slot="dialog-close"></button></ui-dialog-close></ui-dialog-content></ui-dialog>
```
