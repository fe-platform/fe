# @fe/docsify-slab

A neo-brutalist Docsify theme. Sharp corners, flat borders, serif typography, and a centered layout.

## Usage

Add to your Docsify `index.html` after the base theme:

```html
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify@4/themes/vue.css" />
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@fe/docsify-slab/theme.css" />
```

## Design

- No border radius, no box shadows, no gradients
- Typography: Source Serif 4 (body), Google Sans Code (code)
- Primary color: `#FC415A`
- Light and dark themes via `[data-theme="dark"]` on the root element

## CSS tokens

| Token | Light | Dark |
|---|---|---|
| `--docsify-color-primary` | `#FC415A` | `#FA4B57` |
| `--slab-bg` | `#ffffff` | `#1b1b1d` |
| `--slab-border-color` | `#e0e0e0` | `#333333` |
| `--slab-layout-max-width` | `1200px` | `1200px` |
| `--slab-sidebar-width` | `255px` | `255px` |

## License

MIT
