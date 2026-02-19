# ⬡ fe-platform · root · agent-ref
CLAUDE.md→symlink→here

## topology
```
/ (!npm-workspace !monorepo-config plain-dir)
├─ mfe-a/      name=fe(@acme/mfe-a) v1.0.0  standalone-MFE  fe()-deps=∅
├─ mfe-b/      name=fe(@acme/mfe-b) v1.0.0  composes-mfe-a  devDep→fe(@acme/mfe-a)
├─ shell/      name=shell           v1.0.0  host-app        devDep→fe(@acme/mfe-b)
├─ cli/        name=cli             v1.0.0  tooling · entry=src/index.ts
├─ configs/import-map.json          specifier→URL · consumed by buildShell+browser
└─ uploads/    gitignored · local-registry · path: slug/version/index.js
```
each subdir has own AGENTS.md with full local detail

## toolchain
bun@latest ONLY · !node !npm !webpack !vite !rollup
lang=TypeScript strict=true target=browser module=ESNext moduleRes=bundler
tests=∅  CI=typecheck+build

## ⟿ fe() convention
```
fe(@scope/name) = package-name string (NOT url-scheme) = browser bare-specifier
pkg.json  "name":"fe(@acme/mfe-a)"
src       import {x} from "fe(@acme/mfe-a)"
importmap "fe(@acme/mfe-a)":"./uploads/mfe-a/1.0.0/index.js"
```
build: build.ts reads pkg.devDeps → filter keys startsWith("fe(") → Bun.build external[]
ts: bun-install creates node_modules/fe(@acme/mfe-a) symlink → resolves without tsconfig.paths
runtime: browser importmap resolves bare-specifier → JS url

## MFE interface (∀ MFE must export)
```ts
export function render(container:HTMLElement,props:Record<string,unknown>):()=>void
//                                                                         ↑ unmount/cleanup
```
!framework · DOM-only · return removes own DOM nodes

## CLI (cwd=root · `bun cli/src/index.ts <cmd>`)
```
build  mfe-a|mfe-b|shell   →dist/ · shell: +inject importmap→HTML
serve  [port=3000]          shell/dist/ · /uploads/→ROOT/uploads/
dev    <tgt> [port=3000]    sandbox+SSE · watch src/→rebuild→reload
link   <consumer> <dep>     write devDep file:URI + bun-install in consumer
admin upload <tgt>          cp dist/→uploads/slug/ver/ · print URL+snippet · !edit importmap
```

## deploy flow
```
build <mfe> → admin upload <mfe>
  ↓ prints: "fe(@acme/mfe-a)":"./uploads/mfe-a/1.0.0/index.js"
edit configs/import-map.json (manual|CD)
  ↓
build shell  (re-injects map → shell/dist/index.html)
  ↓
serve
```

## CI · .github/workflows/ci.yml
trigger: push→main | PR→main
ubuntu-latest · setup-bun@latest · cache ~/.bun/install/cache
install: (cd mfe-b && bun install) (cd shell && bun install)
typecheck: bunx tsc --noEmit -p {mfe-a,mfe-b,shell}/tsconfig.json
build: mfe-a(bun run build) mfe-b(bun run build) shell(bun run build)

## ✗ invariants
- !bundle fe(*) · must stay external · importmap resolves runtime
- admin-upload !touches configs/import-map.json (separation intentional: upload=artifact config=separate)
- !framework-deps · DOM only
- !workspace-config (not a monorepo workspace)
- fe() devDeps → devDependencies only (build.ts reads devDeps, not deps)
- shell-build output: shell/dist/{index.html(importmap-injected) app.js}
- uploads/ !git-tracked
