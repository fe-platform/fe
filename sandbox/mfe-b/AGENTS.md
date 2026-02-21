# ⚯ mfe-b/ · agent-ref
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
fe build mfe-b
  → Bun.build(src/index.ts → dist/index.js, esm, browser, external=["fe(@acme/mfe-a)"])

# direct (from sandbox/mfe-b/):
bun run build
  → bun build src/index.ts --outdir dist --format esm --target browser
  NOTE: direct build does NOT auto-externalize fe() deps (build.ts does that)

prereq: bun install must have run in mfe-b/ (CI does this; link cmd does it too)
output: sandbox/mfe-b/dist/index.js
```

## link new dep (if adding more fe() deps)
```
fe link mfe-b <new-dep>  (from repo root)
```

## upload (from repo root)
```
fe admin upload mfe-b
  copies dist/ → uploads/mfe-b/1.0.0/
  registers package version in sandbox/configs/platform.json (URL + deps)
```

## dev (from repo root)
```
fe dev mfe-b
  sandbox at http://localhost:3000
  importmap: {"imports":{"fe(@acme/mfe-b)":"/index.js"}}
  initial render: render(#sandbox,{})
  on src/ change: rebuild → SSE {t:timestamp} → unmount + import("/index.js?t="+t) + re-render
  no page reload · module-swap HMR · reconnecting tabs receive latest pending rebuild

  NOTE: dev sandbox only maps the target MFE itself ("fe(@acme/mfe-b)" → "/index.js")
        mfe-a is NOT in this import map → composing mfe-a will fail at runtime in dev mode
        workaround: build+upload mfe-a first, then run full shell serve instead of dev
```
