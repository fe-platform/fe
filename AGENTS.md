# ⚯ fe-platform · root · agent-ref
CLAUDE.md→symlink→here

## topology
```
/ (!npm-workspace !monorepo-config plain-dir)
├─ mfe-a/      name=fe(@acme/mfe-a) v1.0.0  standalone-MFE  fe()-deps=∅
├─ mfe-b/      name=fe(@acme/mfe-b) v1.0.0  composes-mfe-a  devDep→fe(@acme/mfe-a)
├─ shell/      name=shell           v1.0.0  host-app        dynamic MFE loading via platform runtime
├─ cli/        name=cli             v1.0.0  tooling · entry=src/index.ts
├─ devtools/   name=fe(@acme/devtools) v1.0.0  developer overlay MFE · uses Solid.js · loaded via loadDevtools()
├─ configs/platform.json            routes+packages registry · consumed by buildShell+browser runtime
├─ docs/                            architecture docs
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
platform  configs/platform.json packages section: specifier → versions → {url, deps}
```
build: build.ts reads pkg.devDeps → filter keys startsWith("fe(") → Bun.build external[]
ts: bun-install creates node_modules/fe(@acme/mfe-a) symlink → resolves without tsconfig.paths
runtime: browser import maps resolve bare-specifier → JS url (multiple maps, injected lazily)

## MFE interface (∀ MFE must export)
```ts
export function render(container:HTMLElement,props:Record<string,unknown>):()=>void
//                                                                         ↑ unmount/cleanup
```
!framework · DOM-only · return removes own DOM nodes (devtools/ exception: uses Solid.js)

## CLI (cwd=root · `bun cli/src/index.ts <cmd>`)
```
build  mfe-a|mfe-b|shell   →dist/ · shell: +inject config→HTML (import maps injected at runtime)
serve  [port=3000]          shell/dist/ · /uploads/→ROOT/uploads/
dev    <tgt> [port=3000]    sandbox+SSE · watch src/→rebuild→HMR module-swap (no page reload)
link   <consumer> <dep>     write devDep file:URI + bun-install in consumer
admin upload <tgt>          cp dist/→uploads/slug/ver/ · register in platform.json
```

## platform.json config
```json
{
  "routes": { "/": "fe(@acme/mfe-b)@1.0.0" },
  "packages": {
    "fe(@acme/mfe-a)": { "versions": { "1.0.0": { "url": "...", "deps": {} } } },
    "fe(@acme/mfe-b)": { "versions": { "1.0.0": { "url": "...", "deps": { "fe(@acme/mfe-a)": "^1.0.0" } } } }
  }
}
```
routes: path → specifier@version (top-level MFEs, go in default import map)
packages: specifier → versions → {url, deps} (registry of all published MFE versions)

## deploy flow
```
build <mfe> → admin upload <mfe>
  ↓ registers package in platform.json (URL + deps)
edit configs/platform.json "routes" (manual|CD)
  ↓
build shell  (injects config → shell/dist/index.html · import maps injected at runtime)
  ↓
serve
```

## runtime flow (browser)
```
1. HTML loads with embedded platform config · no static import map
2. shell app.js calls loadDevtools() then platform.load(path)
3. load() reads config, resolves route → specifier@version
4. resolves transitive fe() deps via semver (from packages registry in config)
5. injects <script type="importmap"> for all resolved deps (including route MFE)
6. import(specifier) → browser resolves via injected maps
```

## CI · .github/workflows/ci.yml
trigger: push→main | PR→main
ubuntu-latest · setup-bun@latest · cache ~/.bun/install/cache
install: (cd mfe-b && bun install) (cd shell && bun install) (cd devtools && bun install)
typecheck: bunx tsc --noEmit -p {mfe-a,mfe-b,shell,devtools}/tsconfig.json
build: mfe-a(bun run build) mfe-b(bun run build) devtools(bun run build) shell(bun run build)

## docs/ workflow
plan docs in docs/ follow a strict lifecycle: proposed → implemented → ARCHIVED
when a PR merges that implements a plan:
  1. add `> **Status:** COMPLETED / ARCHIVED` header to the plan doc
  2. update any "proposed" label in the doc title to reflect it is now historical
  invariant: no unarchived plan doc exists after its implementing PR lands
  !delete archived docs — they explain why the system is the way it is
  example: externalization-strategy.md, cli-architecture-proposed.md
pre-PR: update all affected AGENTS.md files, docs/, and README.md to reflect current state before opening any PR

## coding rules
- source files: max 180 lines · split immediately when exceeded
- comments: none unless logic is genuinely non-obvious · no section headers · no doc comments
- functions over classes: default to functional patterns · classes only with explicit high-impact justification
- no stubs or mocks: production-ready code only · no temp workarounds unless explicitly asked
- debugging: halt at 2 failed attempts · report state + request guidance
- communication: concise · no verbose post-edit summaries · don't restate edits already visible in IDE

## ✗ invariants
- !bundle fe(*) · must stay external · importmap resolves runtime
- admin-upload writes to packages only, never routes (separation preserved)
- routes updated manually or by CD pipeline
- !framework-deps · DOM only (exception: devtools/ bundles Solid.js internally)
- !workspace-config (not a monorepo workspace)
- fe() devDeps → devDependencies only (build.ts reads devDeps, not deps)
- shell-build output: shell/dist/{index.html(config injected) app.js} · import maps runtime-only
- uploads/ !git-tracked
- multiple import maps: deps injected lazily, deduped via versioned resolution
- cross-ecosystem: packages can use remote URLs (https://cdn.other-org.com/...)
