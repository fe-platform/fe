# ⚯ mfe-b/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    fe(acme/mfe-b)
version: 1.0.0
module:  src/index.tsx
framework: SolidJS (solid-js/web)
devDependencies:
  "fe(acme/mfe-a)": "file:../mfe-a"
    → node_modules/fe(acme/mfe-a) symlink (after bun install)
    → external at build · importmap at runtime
```

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true skipLibCheck=true
jsx=preserve jsxImportSource=solid-js lib=[ES2022,DOM] include=[src]

## src/index.tsx: full behaviour
```tsx
import { render as renderA } from "fe(acme/mfe-a)"  // external · resolved via importmap
import { render as solidRender } from "solid-js/web"

function Wrapper(props:{name?:string;container:HTMLElement})
  // Solid component: renders styled wrapper, mounts mfe-a (React) inside via setTimeout(0)
  return <div ref={wrapperRef} style={{...}}><p style={{...}}>mfe-b (SolidJS) wraps mfe-a:</p></div>

export function render(container:HTMLElement,props:Record<string,unknown>):()=>void
  dispose = solidRender(()=><Wrapper name={props.name} container={container}/>, container)
  return ()=>dispose()
```
composition: mfe-b (Solid) renders chrome, mfe-a (React) renders inside, so frameworks coexist

## index.d.ts: public type contract
```ts
export declare function render(container:HTMLElement,props:Record<string,unknown>):()=>void
```
Consumers resolve types from `index.d.ts`, not `src/index.tsx`, avoiding Solid JSX type leakage.

## build
```
# via CLI (preferred, from repo root):
fe build sandbox/mfe-b
  → @fe/compiler detects SolidJS (solid-js in package.json)
  → applies bun-plugin-solid (Babel-based JSX transform)
  → Bun.build(src/index.tsx → dist/index.js, esm, browser, external=["fe(acme/mfe-a)"])

# direct (from sandbox/mfe-b/):
bun run build  (calls fe build sandbox/mfe-b via CLI)

output: sandbox/mfe-b/dist/index.js
prereq: bun install must have run in mfe-b/ (CI does this; link cmd does it too)
```

## link new dep (if adding more fe() deps)
```
fe link sandbox/mfe-b <new-dep>  (from repo root)
```

## publish (from repo root)
```
fe publish sandbox/mfe-b
  copies src/ + package.json → sources/mfe-b/1.0.0/ (via SourceStorage)
  registers package version in sandbox/configs/platform.json (URL points to JIT + deps)
```
Note: `fe publish` now supports `.tsx` fallback. However, the sandbox `platform.json` currently uses the legacy `./uploads/` path because the server does not have `jitPlugins` configured for SolidJS JIT translation.

## dev (from repo root)
```
fe dev sandbox/mfe-b
  sandbox at http://localhost:3000
  importmap: {"imports":{"fe(acme/mfe-b)":"/index.js"}}
  initial render: render(#sandbox,{})
  on src/ change: rebuild → SSE {t:timestamp} → unmount + import("/index.js?t="+t) + re-render
  no page reload · module-swap HMR · reconnecting tabs receive latest pending rebuild

  NOTE: dev sandbox only maps fe(acme/mfe-b) → /index.js
        mfe-a is NOT in this import map → composing mfe-a will fail at runtime in dev mode
        workaround: publish mfe-a first, then run full shell serve instead of dev
```
