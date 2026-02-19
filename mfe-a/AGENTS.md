# ⬡ mfe-a/ · agent-ref
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
bun cli/src/index.ts build mfe-a
  → Bun.build(src/index.ts → dist/index.js, esm, browser, external=[])

# direct (from mfe-a/):
bun run build
  → bun build src/index.ts --outdir dist --format esm --target browser

output: mfe-a/dist/index.js
```

## upload (from repo root)
```
bun cli/src/index.ts admin upload mfe-a
  prereq: dist/index.js must exist
  copies dist/ → uploads/mfe-a/1.0.0/
  registers package version in configs/platform.json (URL + deps)
```

## dev (from repo root)
```
bun cli/src/index.ts dev mfe-a
  sandbox at http://localhost:3000
  importmap: {"imports":{"fe(@acme/mfe-a)":"/index.js"}}
  renders render(#sandbox,{}) · SSE hotreload on src/ changes
```
