# ⚯ fe-platform · root · agent-ref
CLAUDE.md→symlink→here

> Heavily influenced by and borrows concepts from the MFE architecture described at [1fe.com](https://1fe.com/).

## topology
```
/ (nx monorepo · workspaces: packages/* sandbox/*)
├─ packages/
│  ├─ core/       @fe/core     v0.1.0  shared types + interfaces (published)
│  ├─ cli/        @fe/cli      v0.1.0  build/serve/dev/admin CLI (published · bin: fe)
│  └─ runtime/    @fe/runtime  v0.1.0  browser platform loader (published)
├─ sandbox/                            example workspace (not published)
│  ├─ host-app/   name=host-app        shell using @fe/runtime · builds to host-app/dist/
│  ├─ mfe-a/      name=fe(@acme/mfe-a) standalone MFE · fe()-deps=∅
│  ├─ mfe-b/      name=fe(@acme/mfe-b) composes mfe-a · devDep→fe(@acme/mfe-a)
│  └─ configs/    fe.config.json · platform.json · routes+packages registry + CLI config
├─ toolkit/                            reusable tools and low-dependency MFEs
│  └─ devtools/   name=fe(@acme/devtools) overlay · uses Solid.js
├─ nx.json        minimal Nx config (target ordering only · no nx cloud)
└─ package.json   workspace root
```
each package/subdir has own AGENTS.md with full local detail

## toolchain
bun@latest ONLY · !node !npm !webpack !vite !rollup
lang=TypeScript strict=true target=browser module=ESNext moduleRes=bundler
tests=∅  CI=typecheck+build (packages job → sandbox job)

## ⟿ fe() convention
```
fe(@scope/name) = package-name string (NOT url-scheme) = browser bare-specifier
pkg.json  "name":"fe(@acme/mfe-a)"
src       import {x} from "fe(@acme/mfe-a)"
platform  sandbox/configs/platform.json packages section: specifier → versions → {url, deps}
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

## CLI (`@fe/cli` · `fe <cmd>` from workspace root)
```
build  <target>|shell  →dist/
serve  [port=3000]     host-app/dist/ · /uploads/→ROOT/uploads/
dev    <tgt> [port]    sandbox+SSE · watch src/→rebuild→HMR
link   <consumer> <dep> write devDep file:URI + bun-install
admin  upload <tgt>    cp dist/→uploads/slug/ver/ · register in platform.json
check  <target>|shell  typecheck + simulate build (CI use)
```
CLI config is supplied by `ctx.adapters.config` (ConfigProvider adapter).
Default impl reads `configs/fe.config.json` at workspace root. Plugins may swap this adapter.

## @fe/cli Plugin API
Organizations extend the CLI by adding plugins in `configs/fe.config.json`:
```json
{ "plugins": ["@acme/fe-plugin-s3"] }
```
Each plugin is an npm package that exports a `Plugin` object (default or named `plugin`):
```ts
import type { Plugin, CliContext } from "@fe/core";
export default {
  name: "acme-s3",
  setup(ctx: CliContext) {
    ctx.adapters.artifactStorage = new S3Storage("my-bucket");
    // can also swap ctx.adapters.config for remote/env-based config
  }
} satisfies Plugin;
```
Plugins run after builtins so they can freely swap `ctx.adapters.*`.

## CLI config schema (`@fe/core` FeConfig · read via ConfigProvider adapter)
```json
{
  "plugins":      [],                       // npm packages to load as CLI plugins
  "manifestPath": "configs/platform.json",  // path to routes+packages registry
  "uploadsDir":   "uploads",                // artifact storage dir (local adapter)
  "shellDir":     "host-app"               // host application directory
}
```
File lives at `configs/fe.config.json` (co-located with platform.json).
All fields optional; defaults apply when file is absent.
Plugins access config via `ctx.adapters.config.get()` — NOT by reading the file directly.

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

## deploy flow (sandbox example)
```
fe build <mfe> → fe admin upload <mfe>
  ↓ registers package in sandbox/configs/platform.json
edit sandbox/configs/platform.json "routes"
  ↓
fe build shell → fe serve
```

## runtime flow (browser · @fe/runtime)
```
1. HTML loads with embedded platform config · no static import map
2. host-app app.js calls loadDevtools() then load(path)
3. load() reads config, resolves route → specifier@version
4. resolves transitive fe() deps via semver (from packages registry)
5. injects <script type="importmap"> for all resolved deps
6. import(specifier) → browser resolves via injected maps
```

## CI · .github/workflows/ci.yml
trigger: push→main | PR→main
`packages` job: typecheck @fe/core @fe/cli @fe/runtime
`sandbox` job (needs: packages): typecheck+build sandbox MFEs + host-app

## docs/ workflow
plan docs in docs/ follow a strict lifecycle: proposed → implemented → ARCHIVED
pre-PR: update all affected AGENTS.md, README.md, CONTRIBUTING.md, docs/

## coding rules
- source files: max 180 lines · split immediately when exceeded
- comments: none unless logic is genuinely non-obvious · no section headers
- functions over classes: default to functional patterns
- no stubs or mocks: production-ready code only
- debugging: halt at 2 failed attempts · report state + request guidance

## ✗ invariants
- !bundle fe(*) · must stay external · importmap resolves runtime
- admin-upload writes to packages only, never routes
- routes updated manually or by CD pipeline
- !framework-deps · DOM only (exception: devtools/ bundles Solid.js internally)
- fe() devDeps → devDependencies only
- sandbox/ is !published · packages/* are published
- multiple import maps: deps injected lazily, deduped via versioned resolution
- plugins must call ctx.adapters.config.get() · never import from cli/src/config directly
