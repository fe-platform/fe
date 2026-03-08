# ⚯ mfe-a/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    @conqueso/fe-mfe-a
version: 1.0.0
module:  src/index.tsx
framework: React 19 (react-dom/client)
MFE-deps: ∅  (no cross-MFE imports)
```

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true skipLibCheck=true
jsx=react-jsx lib=[ES2022,DOM] include=[src]

## src/index.tsx: full behaviour
```tsx
import React from "react"
import { createRoot } from "react-dom/client"

export function render(container:HTMLElement,props:Record<string,unknown>):()=>void
  el = <div> (DOM wrapper, appended to container)
  root = createRoot(el)
  root.render(<div style={{...}}>mfe-a says: Hello, {props.name ?? "world"}!</div>)
  return ()=>{ root.unmount(); el.remove() }
```

## index.d.ts: public type contract
```ts
export declare function render(container:HTMLElement,props:Record<string,unknown>):()=>void
```
Consumers import types from `index.d.ts` (via `package.json#types`), not from `src/index.tsx`,
so they don't need React's JSX types in scope.

## build
```
# via CLI (preferred, from repo root):
fe build sandbox/mfe-a
  → @fe/compiler detects React (react-dom in package.json)
  → Bun.build(src/index.tsx → dist/index.js, esm, browser, external=[])

# direct (from sandbox/mfe-a/):
bun run build  (calls fe build sandbox/mfe-a via CLI)

output: sandbox/mfe-a/dist/index.js
```

## publish (from repo root)
```
fe publish sandbox/mfe-a
  copies src/ + package.json → sources/mfe-a/1.0.0/ (via SourceStorage)
  registers package version in sandbox/configs/platform.json (URL points to JIT bundler + deps)
```
Note: `fe publish` now supports `.tsx` fallback. However, the sandbox `platform.json` currently uses the legacy `./uploads/` path because the server does not have `jitPlugins` configured.

## dev (from repo root)
```
fe dev sandbox/mfe-a
  sandbox at http://localhost:3000
  importmap: {"imports":{"@conqueso/fe-mfe-a":"/index.js"}}
  initial render: render(#sandbox,{})
  on src/ change: rebuild → SSE {t:timestamp} → unmount + import("/index.js?t="+t) + re-render
  no page reload · module-swap HMR · reconnecting tabs receive latest pending rebuild
```
