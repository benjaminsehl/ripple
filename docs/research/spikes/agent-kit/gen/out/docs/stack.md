# Stack

Vertical flex layout with a gap. Zero JavaScript.

- Kind: static. Without JavaScript: full. CSS only.
- Accessibility: none. Name required: never.
- Agents: accessibility-tree.

## Use when
- Stacking children vertically with consistent spacing

## Use something else when
- Children flow horizontally and wrap: use `inline`.
- Columns: use `grid`.

## Props

| Prop | Values | Default | Responsive | Hosts | Description |
|---|---|---|---|---|---|
| `tag` | `div` `section` `article` `aside` `header` `footer` `nav` `main` `ul` `ol` | div |  | all | Root element. |
| `gap` | scale `space` |  | yes | all | Space between children. |
| `align` | `start` `center` `end` `stretch` `baseline` |  | yes | all | Cross-axis alignment. |
| `justify` | `start` `center` `end` `between` |  | yes | all | Main-axis distribution. |
| `p` | scale `space` |  | yes | all | Padding on all sides. |
| `id` | id |  |  | all | Root element id. |

## HTML contract

`default`

```html
<div class="rp-stack"><p>One</p><p>Two</p></div>
```

`responsive-gap`

```html
<div class="rp-stack" data-gap="2 md:6" data-align="start"><p>One</p><p>Two</p></div>
```

`list`

```html
<ul class="rp-stack" data-gap="4"><li>One</li></ul>
```
