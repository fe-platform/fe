# ⚯ devtools/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    fe(acme/devtools)
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

## build
```
# from toolkit/devtools/:
bun run build
  → bun build.ts
  → Bun.build(src/index.tsx → dist/index.js, esm, browser, external=[fe(*)])
  → uses @dschz/bun-plugin-solid for correct Solid.js JSX compilation
  solid-js is bundled (not external)
```

### Bun JSX + Solid.js — known constraints
Bun v1.x (tested on 1.3.9) has partial JSX flag support:
- `--jsx-factory <fn>` works — replaces the element-creation call
- `--jsx-fragment <fn>` is SILENTLY IGNORED — bun always emits `Fragment` as a bare identifier
- `--jsx-import-source`, `--jsx-runtime`, and tsconfig `jsxImportSource` are all ignored
- The correct solution for Solid.js TSX is `@dschz/bun-plugin-solid` (wraps Babel+babel-preset-solid)
  via a `build.ts` script using the `Bun.build()` API; `@babel/core`, `@babel/preset-typescript`,
  and `babel-preset-solid` are required peer deps
- In offline/sandboxed environments where `bun add` cannot reach the network, install these packages
  manually; bun cache entries at `/root/.bun/install/cache/` may fail to resolve transitive deps
  because the cache layout lacks nested node_modules — ensure @babel/* packages are present in the
  workspace or package-local node_modules before running build.ts

### build.ts (Bun.build API)
```ts
import { SolidPlugin } from "@dschz/bun-plugin-solid";
await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  format: "esm",
  target: "browser",
  external: ["fe(*)", /^fe\(/],
  plugins: [SolidPlugin({ generate: "dom", hydratable: false, sourceMaps: false })],
});
```

## upload + activation
```
fe admin upload devtools
  copies dist/ → uploads/devtools/1.0.0/
  registers in platform.json packages section

# activate: add to platform.json manually:
{
  "devtools": "fe(acme/devtools)@1.0.0",
  "routes": { ... },
  "packages": { ... }
}

# then rebuild shell to embed updated config:
fe build shell
```
