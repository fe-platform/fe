# ⚯ mfe-a/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    fe(@acme/mfe-a)
version: 1.0.0
module:  src/index.ts
types:   src/index.ts
fe()-deps: ∅  (no cross-MFE imports)
```

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true lib=[ES2022,DOM] include=[src]

## src/index.ts — full behaviour
```ts
export function render(container:HTMLElement,props:Record<string,unknown>):()=>void
  el = <div> style="padding:8px;border:1px solid #aaa;border-radius:4px"
  el.textContent = `mfe-a says: Hello, ${props.name ?? "world"}!`
  container.appendChild(el)
  return ()=>el.remove()
```

## build
```
# via CLI (preferred, from repo root):
fe build mfe-a
  → Bun.build(src/index.ts → dist/index.js, esm, browser, external=[])

# direct (from sandbox/mfe-a/):
bun run build
  → bun build src/index.ts --outdir dist --format esm --target browser

output: sandbox/mfe-a/dist/index.js
```

## publish (from repo root)
```
fe publish mfe-a
  copies src/ → sources/mfe-a/1.0.0/ (via SourceStorage)
  registers package version in sandbox/configs/platform.json (URL points to JIT bundler + deps)
```

## dev (from repo root)
```
fe dev mfe-a
  sandbox at http://localhost:3000
  importmap: {"imports":{"fe(@acme/mfe-a)":"/index.js"}}
  initial render: render(#sandbox,{})
  on src/ change: rebuild → SSE {t:timestamp} → unmount + import("/index.js?t="+t) + re-render
  no page reload · module-swap HMR · reconnecting tabs receive latest pending rebuild
```
