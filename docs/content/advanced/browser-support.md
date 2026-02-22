---
sidebar_position: 2
---

# Browser Support

Which browsers support the native features fe depends on, and how to polyfill for those that don't.

## Required Browser Features

The fe platform requires two browser capabilities:

| Feature | Minimum version |
|---------|----------------|
| ES modules (`import`/`export`, dynamic `import()`) | Chrome 63, Firefox 60, Safari 11 |
| `<script type="importmap">` (single map) | Chrome 89, Firefox 108, Safari 16.4 |
| **Multiple import maps** | Chrome 133, Safari 18.4 |

Multiple import map support is the binding constraint. Every other feature predates it by years.

## Native Support Matrix

| Browser | Multiple Import Maps | Ships since |
|---------|---------------------|-------------|
| Chrome | Native | 133 (Feb 2025) |
| Edge | Native | 133 (Feb 2025) |
| Safari | Native | 18.4 (Mar 2025) |
| Firefox | Polyfill required | — |
| Samsung Internet | Unknown | — |

Firefox has not shipped multiple import map support as of early 2026. Track progress at [caniuse.com/import-maps](https://caniuse.com/import-maps).

## Polyfill: `es-module-shims`

[es-module-shims](https://github.com/guybedford/es-module-shims) v2.4+ provides multiple import map support for browsers that lack it natively. Add it to your shell's `index.html` before the platform config script:

```html
<head>
  <script async src="https://ga.jspm.io/npm:es-module-shims@2.4.0/dist/es-module-shims.js"></script>
  <!-- __PLATFORM_CONFIG__ -->
</head>
```

`es-module-shims` uses a shim mode when multiple maps are present. In modern browsers that already support the feature natively, it activates a pass-through mode with negligible overhead.

## Feature Detection

The platform does not include built-in feature detection. Applications targeting Firefox should add the polyfill unconditionally. The overhead in Chrome and Safari is minimal; the polyfill's pass-through mode for natively supported features adds no meaningful latency.

## `sessionStorage` and `history.replaceState`

`@fe/runtime` also uses `sessionStorage` (for devtools overrides) and `history.replaceState` (to strip query parameters). Both are universally supported in all browsers that support ES modules.

## Dynamic Import

The `import()` expression used by `load()` and `loadDevtools()` is supported in all modern browsers. The platform does not use static `import` declarations in the shell's entry point — the shell is bundled by `fe build shell`, so Bun handles any static imports at build time.
