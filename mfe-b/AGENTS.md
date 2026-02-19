# ⬡ mfe-b/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    fe(@acme/mfe-b)
version: 1.0.0
module:  src/index.ts
types:   src/index.ts
devDependencies:
  "fe(@acme/mfe-a)": "file:../mfe-a"
    → node_modules/fe(@acme/mfe-a) symlink (after bun install)
    → external at build · importmap at runtime
```

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true lib=[ES2022,DOM] include=[src]

## src/index.ts — full behaviour
```ts
import {render as renderA} from "fe(@acme/mfe-a)"  // external · resolved via importmap

export function render(container:HTMLElement,props:Record<string,unknown>):()=>void
  wrapper = <div> style="padding:12px;border:2px solid #4a90d9;border-radius:6px"
  label   = <p>   style="margin:0 0 8px;font-size:12px;color:#4a90d9;font-weight:bold"
  label.textContent = "mfe-b wraps mfe-a:"
  wrapper.appendChild(label)
  container.appendChild(wrapper)
  unmountA = renderA(wrapper, props)
  return ()=>{ unmountA(); wrapper.remove() }
```
composition: mfe-b renders own chrome + delegates content to mfe-a · both unmount cleanly

## build
```
# via CLI (preferred, from repo root):
bun cli/src/index.ts build mfe-b
  → Bun.build(src/index.ts → dist/index.js, esm, browser, external=["fe(@acme/mfe-a)"])

# direct (from mfe-b/):
bun run build
  → bun build src/index.ts --outdir dist --format esm --target browser
  NOTE: direct build does NOT auto-externalize fe() deps (build.ts does that)

prereq: bun install must have run in mfe-b/ (CI does this; link cmd does it too)
output: mfe-b/dist/index.js
```

## link new dep (if adding more fe() deps)
```
bun cli/src/index.ts link mfe-b <new-dep>  (from repo root)
```

## upload (from repo root)
```
bun cli/src/index.ts admin upload mfe-b
  copies dist/ → uploads/mfe-b/1.0.0/
  prints snippet for configs/import-map.json
```

## dev (from repo root)
```
bun cli/src/index.ts dev mfe-b
  sandbox at http://localhost:3000
  importmap: {"imports":{"fe(@acme/mfe-b)":"/index.js"}}
  NOTE: mfe-a must also be in importmap for mfe-b to compose it
        dev sandbox only maps the target itself; add mfe-a entry manually if needed
```
