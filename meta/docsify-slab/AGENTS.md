# meta/docsify-slab · agent-ref

`@fe/docsify-slab` is a neo-brutalist Docsify theme. It is published to npm and consumed by the `docs/` site via jsDelivr.

## Package details

```
name:     @fe/docsify-slab
version:  0.0.1
license:  MIT
main:     theme.css
files:    [theme.css]
```

## Structure

```
meta/docsify-slab/
├─ theme.css              the theme — single file, all styles
├─ package.json
├─ AGENTS.md
└─ scripts/
   └─ copy-to-docs.ts     dev script: copies theme.css → docs/style.css
```

## Design language

Neo-brutalist: sharp corners (`border-radius: 0`), flat borders (`1px solid`), no box shadows, no gradients. Typography uses Source Serif 4 (body) and Google Sans Code (code). Primary brand color is `#FC415A`.

## CSS custom properties (tokens)

All tokens are set on `:root` and overridden under `[data-theme="dark"]`:

| Token | Light | Dark |
|---|---|---|
| `--docsify-color-primary` | `#FC415A` | `#FA4B57` |
| `--slab-bg` | `#ffffff` | `#1b1b1d` |
| `--slab-border-color` | `#e0e0e0` | `#333333` |
| `--slab-border-width` | `1px` | `1px` |
| `--slab-layout-max-width` | `1200px` | `1200px` |
| `--slab-sidebar-width` | `255px` | `255px` |

## Layout approach

Docsify adds `body.sticky` after page load, switching `.sidebar` and `.content` to `position: fixed`. The theme overrides this by targeting both `.sidebar` and `body.sticky .sidebar` (same for `.content`) with `position: absolute !important`, keeping them inside `#app`. `#app` is centered with `max-width + margin: 0 auto`.

## Loader

`#loader-overlay` is a full-screen fixed overlay outside `#app`. It uses `backdrop-filter: blur(6px)` to blur the page while Docsify boots. The animated circles use `border` (not `background-color`) so the white circle is visible on any background. Dismissed via `hook.ready` in `docs/index.html` by adding `.hidden`.

## Local dev workflow

From the repo root:

```bash
bun run docs
```

The `predocs` script in root `package.json` runs `scripts/copy-to-docs.ts` first, copying `theme.css` → `docs/style.css`. The docs server then serves `docs/style.css` as a local override after the jsDelivr CDN link.

To copy without serving:

```bash
bun run meta/docsify-slab/scripts/copy-to-docs.ts
```

## Publishing

Not yet published. Before publishing:
1. Verify theme renders correctly on the live docs site
2. Write a README.md for the npm package page
3. Confirm `files` array in `package.json` includes only `theme.css`
4. Run `npm publish --access public` (or `bun publish`) from this directory

## Invariants

- Single file package — `theme.css` only, no JS
- All keyframe animation names are prefixed `slab-` to avoid collisions with other stylesheets
- `docs/style.css` is a generated artifact — never edit it directly
- Do not add `border-radius` to any element (neo-brutalist invariant)
- Do not add `box-shadow` to any element except where explicitly required for the loader animation
