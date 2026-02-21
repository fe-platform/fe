# ⚯ devtools/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    fe(@acme/devtools)
version: 1.0.0
module:  src/index.tsx
types:   src/index.tsx
fe()-deps: ∅  (no cross-MFE imports)
dependencies:
  "solid-js": "^1.9.0"  (bundled into output, NOT external)
```

## purpose
Developer overlay MFE. Renders a floating panel for managing per-tab import map overrides.
Loaded by shell via `loadDevtools()` when `config.devtools` is set in platform.json.
Not in routes; not uploaded via admin — loaded on-demand from whatever URL `config.devtools` resolves to.

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true lib=[ES2022,DOM] include=[src]

## files
```
src/index.tsx   DevTools Solid.js component + render() MFE export
src/styles.ts   static CSS-in-JS style objects (panelStyle, headerStyle, etc.)
dist/           build output (gitignored)
  index.js      bundled devtools (includes solid-js)
```

## src/index.tsx — full behaviour
```ts
export function render(container: HTMLElement, _props): () => void
  mounts <DevTools /> via solid-js · returns unmount fn

DevTools:
  toggle button (fixed, bottom-right)
  panel with:
    - list of active sessionStorage overrides (spec → url)
    - remove individual override · clear all
    - add override form (spec + url inputs)
    - share URL (encodes overrides as ?platform:overrides= param)
```

## override mechanism
```
sessionStorage key: "platform:overrides"
format: Record<specifier, url>

overrides are applied by packages/runtime/src/platform.ts:applyOverridesAndInject()
  → replaces resolved URL for a specifier before import map injection
  → active on next page load (reload triggered by devtools after write)

share URL: ?platform:overrides=<JSON>
  → processed by packages/runtime/src/overrides.ts:processUrlParams() on load
  → merged into sessionStorage overrides · URL param stripped
```

## build (from repo root)
```
fe build devtools
  → Bun.build(src/index.tsx → dist/index.js, esm, browser, external=[])
  solid-js is bundled (not external)

# direct (from sandbox/devtools/):
bun run build
  → bun build src/index.tsx --outdir dist --format esm --target browser
```

## upload + activation
```
fe admin upload devtools
  copies dist/ → uploads/devtools/1.0.0/
  registers in platform.json packages section

# activate: add to platform.json manually:
{
  "devtools": "fe(@acme/devtools)@1.0.0",
  "routes": { ... },
  "packages": { ... }
}

# then rebuild shell to embed updated config:
fe build shell
```
