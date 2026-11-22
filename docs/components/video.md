# Video

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `video` |
| Kind | `static` |
| Category | `media` |
| Custom elements | none |
| Root element and class | `video` `.rp-video` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native `<video>` with controls. With `autoplay` it is a muted, looping background video that still shows controls so that the shopper can pause it.

- Use when: showing a hosted video file (a Shopify video's sources, or one file URL).
- Do not use when: embedding YouTube or Vimeo (write the provider's `<iframe>`), or showing a still (use Image).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Video` | `blocks/video.liquid` | `video` | `rp-video` | none | yes | none |

Nesting rules: children MUST be `<source>` and `<track>` elements only. Either `src` or at least one `<source>` child MUST be present.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `src` | `src` | url | URL of one video file | none (omitted) | no | no | `src` |
| `poster` | `poster` | url | URL of a still image | none (omitted) | no | no | `poster` |
| `autoplay` | `autoplay` | boolean | `true false` | `false` | no | no | when true, the three attributes `autoplay`, `muted`, `loop` |
| `width` | `width` | number | intrinsic width in px | none (omitted) | no | no | `width` |
| `height` | `height` | number | intrinsic height in px | none (omitted) | no | no | `height` |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `auto` | no | no | `data-ratio` |
| `fit` | `fit` | enum | `cover contain` | `cover` | no | no | `data-fit` |
| `radius` | `radius` | enum | `none sm md lg xl full` | `none` | no | no | `data-radius` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |

Always printed, with no prop: `controls`, `playsinline`, `preload="metadata"`.

### Content model

`flow` - restricted to `<source src type>` and `<track>` elements written by the caller. This is how a Shopify video's several sources are passed (the caller loops over them).

### HTML contract

Fixture `default` (`src="https://cdn.shopify.com/videos/c/o/v/lookbook.mp4"`):

```html
<video class="rp-video" src="https://cdn.shopify.com/videos/c/o/v/lookbook.mp4" controls playsinline preload="metadata" data-ratio="auto" data-fit="cover" data-radius="none"></video>
```

Fixture `background` (`poster="https://cdn.shopify.com/s/files/1/0000/0001/files/lookbook.jpg"`, `autoplay`, `width=1920`, `height=1080`, `ratio="16/9"`, `radius="lg"`, `ariaLabel="Lookbook film"`; children two `<source>` elements):

```html
<video class="rp-video" poster="https://cdn.shopify.com/s/files/1/0000/0001/files/lookbook.jpg" width="1920" height="1080" autoplay muted loop controls playsinline preload="metadata" data-ratio="16/9" data-fit="cover" data-radius="lg" aria-label="Lookbook film"><source src="https://cdn.shopify.com/videos/c/o/v/lookbook.webm" type="video/webm"><source src="https://cdn.shopify.com/videos/c/o/v/lookbook.mp4" type="video/mp4"></video>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "src": "https://cdn.shopify.com/videos/c/o/v/lookbook.mp4" }` | absent |
| `background` | `{ "poster": "https://cdn.shopify.com/s/files/1/0000/0001/files/lookbook.jpg", "autoplay": true, "width": 1920, "height": 1080, "ratio": "16/9", "radius": "lg", "ariaLabel": "Lookbook film" }` | `<source src="https://cdn.shopify.com/videos/c/o/v/lookbook.webm" type="video/webm"><source src="https://cdn.shopify.com/videos/c/o/v/lookbook.mp4" type="video/mp4">` |
| `contain` | `{ "src": "https://cdn.shopify.com/videos/c/o/v/lookbook.mp4", "fit": "contain" }` | absent |
| `class` | `{ "src": "https://cdn.shopify.com/videos/c/o/v/lookbook.mp4", "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "src": "https://cdn.shopify.com/videos/c/o/v/lookbook.mp4", "ratio": "bogus" }` (output `data-ratio="auto"`) | absent |
| `escaping` | `{ "src": "https://cdn.shopify.com/videos/c/o/v/lookbook.mp4", "ariaLabel": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None. (URLs are literal props and are printed unchanged by every host.)

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `autoplay`, `muted`, `loop` | root | server | `autoplay` is true | present, or absent |
| `controls`, `playsinline` | root | server | always | present |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: native controls play, pause, seek and mute. `autoplay` works natively because the video is muted.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<video controls>`; `checkPattern`: none.
- Accessible name: `ariaLabel`; SHOULD be passed. A video with speech MUST have a `<track kind="captions">` child.
- Focus: the native controls are focusable.
- Announcements: None.
- An autoplaying video always has `controls`, which is the pause mechanism required by WCAG 2.2.2. It is always `muted`.

| Key | Action |
|---|---|
| Space | play or pause (native, when the video has focus) |

### Styling

- File: `components/video/video.css` (layer `rp.components`).
- Tokens used: `--color-muted`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-video-radius` | `0` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-video[data-ratio="<value>"]`, one rule for each of `1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `--_ratio: <a> / <b>` (the same eight values as Image) |
| `.rp-video[data-fit="contain"]` | `--_fit: contain` |
| `.rp-video[data-radius="sm"]` / `"md"` / `"lg"` / `"xl"` / `"full"` (five rules) | `--rp-video-radius: var(--radius-sm)` / `var(--radius-md)` / `var(--radius-lg)` / `var(--radius-xl)` / `9999px` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-video` | custom properties: `--rp-video-radius` as above; `--_ratio: auto; --_fit: cover`. Declarations: `display: block; inline-size: 100%; max-inline-size: 100%; block-size: auto; aspect-ratio: var(--_ratio); object-fit: var(--_fit); border-radius: var(--rp-video-radius); background-color: var(--color-muted)` |

### Host notes

- HTML: None.
- React: `export function Video(props: VideoProps)`; generated; JSX props `autoPlay`, `muted`, `loop`, `controls`, `playsInline`, `preload`.
- Remix: None.
- Liquid: the caller loops over a video drop's sources inside the block body. Schema settings: `ratio`, `fit`, `radius`. Locale keys: `ripple.video.name`.

```tsx
<Video poster={video.previewImage.url} autoplay ratio="16/9" ariaLabel="Lookbook film">
  {video.sources.map((source) => (
    <source key={source.url} src={source.url} type={source.mimeType} />
  ))}
</Video>
```

```liquid
{% block 'video', poster: poster_url, autoplay: true, ratio: '16/9', aria_label: 'Lookbook film' %}
  {% for source in video.sources %}
    <source src="{{ source.url }}" type="{{ source.mime_type }}">
  {% endfor %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: `video-needs-source` (RP113, error): a `.rp-video` element has a `src` attribute or at least one `source` child; `video-children`: kind `max-count`, selector `:scope > *:not(source):not(track)`, count `0`. Message: "A Video has a child that is not source or track." Fix: "Keep only source and track elements inside Video."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixture `background` has the attributes `autoplay`, `muted`, `loop`, `controls`, `playsinline` in all four hosts; fixture `default` has `controls` and `playsinline` and none of `autoplay`, `muted`, `loop`.
3. Tier 5: fixture `background` in a 640 px parent has a bounding box of 640 by 360 px; the element's `muted` property is `true`.
4. Tier 6: with JavaScript disabled, fixture `default` shows native controls (the element's `controls` property is `true`).

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/video.liquid`; `ripple/docs/00-decisions.md` section 6.3 (`ratio`, `fit`, `radius`).
- UNVERIFIED: that React 19 server rendering prints the `muted` attribute (React sets `muted` as a property on the client). CA-4 on fixture `background` decides it; if React omits it, add the mask `{ "select": "video", "op": "drop-attr", "name": "muted" }` to fixture `background` for the `react` and `remix` hosts and rely on a tier 5 test that the element's `muted` property is `true` after load. Not attached to a spike (local test).

### Fallback (SPIKE-nn)

None.

---
