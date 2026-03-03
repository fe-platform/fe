# ⚯ fe-platform · root · agent-ref
CLAUDE.md→symlink→here

> Heavily influenced by and borrows concepts from the MFE architecture described at [1fe.com](https://1fe.com/).

## topology
```
/ (nx monorepo · workspaces: packages/* sandbox/* toolkit/*)
├─ packages/
│  ├─ core/             @fe/core              v0.1.0  shared types + interfaces (published)
│  ├─ cli/              @fe/cli               v0.1.0  build/serve/dev/admin CLI (published · bin: fe)
│  ├─ runtime/          @fe/runtime           v0.1.0  browser platform loader (published)
│  ├─ compiler/         @fe/compiler          v1.0.0  MFE bundler + JIT bundler (published)
│  ├─ jit-plugin-react/ @fe/jit-plugin-react  v0.1.0  JIT plugin: React JSX (published)
│  └─ jit-plugin-solid/ @fe/jit-plugin-solid  v0.1.0  JIT plugin: Solid.js JSX (published)
├─ sandbox/                                           example workspace (not published)
│  ├─ host-app/         name=host-app                 shell using @fe/runtime · builds to host-app/dist/
│  ├─ mfe-a/            name=fe(acme/mfe-a)           standalone MFE · fe()-deps=∅
│  ├─ mfe-b/            name=fe(acme/mfe-b)           composes mfe-a · devDep→fe(acme/mfe-a)
│  └─ configs/          fe.config.json · platform.json · routes+packages registry + CLI config
├─ toolkit/                                           reusable tools and low-dependency MFEs
│  ├─ devtools/         name=fe(acme/devtools)        overlay · uses Solid.js
│  └─ store/            name=fe(acme/store)           global state primitive · zero deps
├─ nx.json              minimal Nx config (target ordering only · no nx cloud)
└─ package.json         workspace root
```
each package/subdir has own AGENTS.md with full local detail

## toolchain
bun@latest ONLY · !node !npm !webpack !vite !rollup
lang=TypeScript strict=true target=browser module=ESNext moduleRes=bundler
tests=∅  CI=typecheck+build (packages job → sandbox job)

## ⟿ fe() convention
```
fe(scope/name) = package-name string (NOT url-scheme) = browser bare-specifier
pkg.json  "name":"fe(acme/mfe-a)"
src       import {x} from "fe(acme/mfe-a)"
platform  sandbox/configs/platform.json packages section: specifier → versions → {url, deps}
```
build: build.ts reads pkg.devDeps → filter keys startsWith("fe(") → Bun.build external[]
ts: bun-install creates node_modules/fe(acme/mfe-a) symlink → resolves without tsconfig.paths
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
  "jitPlugins":   [],                       // npm packages to load as JIT compiler plugins
  "manifestPath": "configs/platform.json",  // path to routes+packages registry
  "uploadsDir":   "uploads",                // artifact storage dir (local adapter)
  "sourcesDir":   "sources",               // raw source upload dir (fe publish)
  "shellDir":     "shell"                  // host application directory
}
```
File lives at `configs/fe.config.json` (co-located with platform.json).
All fields optional; defaults apply when file is absent.
Plugins access config via `ctx.adapters.config.get()` — NOT by reading the file directly.

## platform.json config
```json
{
  "routes": { "/": "fe(acme/mfe-b)@1.0.0" },
  "packages": {
    "fe(acme/mfe-a)": { "versions": { "1.0.0": { "url": "...", "deps": {} } } },
    "fe(acme/mfe-b)": { "versions": { "1.0.0": { "url": "...", "deps": { "fe(acme/mfe-a)": "^1.0.0" } } } }
  }
}
```

## deployment model — source-first, JIT on server

MFEs are deployed as **source files**, not bundles.

```
fe publish → uploads raw TypeScript source to SourceStorage
fe serve   → JIT bundler compiles source on first request, per MFE
```

The JIT bundler (`createJITBundler` in `@fe/compiler`) runs server-side.
The platform team operates it. MFE teams never produce or ship a bundle
to production — the server does that on demand, using whatever `jitPlugins`
are configured on the server. Those plugin versions are authoritative.

`fe build` and `fe check` exist for local development feedback only. A
failed local build does not block deployment. Agents: do not treat a local
build failure as a production incident or a reason to change deployment steps.

## deploy flow (sandbox example)
```
fe publish <mfe>
  ↓ uploads raw source · registers /bundle/<slug>/<ver>/index.ts URL in platform.json
edit sandbox/configs/platform.json "routes"
  ↓
fe build shell → fe serve
```
`fe publish` is the standard path. `fe admin upload <mfe>` is the legacy artifact-based path
(requires a prior `fe build <mfe>`); still used for devtools (see toolkit/devtools/AGENTS.md).

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
`packages` job: typecheck @fe/core @fe/cli @fe/runtime @fe/compiler @fe/jit-plugin-react @fe/jit-plugin-solid
`sandbox` job (needs: packages): typecheck+build sandbox MFEs + host-app + toolkit/devtools

## docs
documentation lives at https://deepwiki.com/fe-platform/fe
pre-PR: update all affected AGENTS.md, README.md, CONTRIBUTING.md

## ✗ agent conduct — cardinal rules
- oversight and caution are paramount · code velocity is not
- never infer a task from branch names, stale todo lists, TODO placeholders, or prior session context alone
- before starting any multi-file or substantial change: state what you believe the task is and wait for explicit confirmation
- "try again" or similar resumption prompts are not task authorisation · ask what the user wants done
- when scope is unclear: ask one focused question · do not proceed on assumptions
- for any GitHub operation (issues, PRs, comments, labels): use `gh` CLI · install if missing: `which gh || (sudo apt-get update -qq && sudo apt-get install -y gh)` · then use as: `gh issue view 22`, `gh pr list` · `GITHUB_TOKEN` is always present in the environment via the connected GitHub App and `gh` picks it up automatically · do not curl internal proxy endpoints or the git remote URL for API access
- never read credential or token files (e.g. `~/.claude/remote/.session_ingress_token`, `~/.ssh/*`, `~/.netrc`) and never scan environment variables for secrets (e.g. `env | grep -i token`) · if a tool requires authentication and the credential is not already available via `gh auth status` or standard git config, stop and ask the user

## ✗ agent conduct — voice and tone
- **The cardinal rule.** Every sentence must satisfy six criteria simultaneously: concise, clear and unambiguous, complete, correct, confident yet humble, and use common and simple language. If a sentence fails any one of those, rewrite it.
- **Prose style.** Write as though you and the reader are discovering something together for the first time. The platform makes choices that are genuinely unusual in the frontend world, and the prose should honour that sense of exploration. Aim for a flowing, high-level rhythm. When a design decision pays off in an interesting way, let the writing linger on that moment rather than rushing past it.
- **Wholesome phrasing and tone.** Maintain a positive, collaborative, and wholesome tone at all times. Language must never be severely critical of other approaches (e.g., "instead of faking it"). Do not use harsh words like "strict" or "never" when a softer, inclusive alternative works.
- **Earnest and honest language (No Self-Certification).** Do not self-certify the platform's merits (e.g., "this platform is an honorable return to simple code"). Instead of stating what the platform *is*, speak in terms of intent and capability. Use phrases like: "what the intent is", "what specifically this does", "what I prescribe", "what I know", "what I don't know", "what I predict", and "what I hope". This ensures transparent, earnest, and honest communication.
- **Wit — exactly 10%.** A well-placed pun, a precise turn of phrase, or a moment of dry observation is welcome and expected. Wit must come from wordplay, irony, or clever observation—never at the expense of a person, a technology, or the reader.
- **Assertive without arrogance.** The platform has opinions. Express them plainly. Replace hedging language ("you might want to consider") with direct statements ("use `devDependencies`"). Equally, never overclaim: "the only correct approach" is a promise you will eventually fail to keep. Always be humble.
- **No emojis.** Not in headings, not inline, not anywhere in content files.
- **Em dashes.** Use at most one per page. Prefer a comma, a colon, or a new sentence instead.
- **Formatting.** Code in backticks always. Shell commands in fenced blocks with `bash`. Concepts on first appearance in **bold**. Short tables over long prose lists when comparing things. No section-header comments in code blocks. Diagrams use Mermaid fenced blocks (`mermaid`).

## coding rules
- source files: max 180 lines · split immediately when exceeded
- comments: none unless logic is genuinely non-obvious · no section headers
- functions over classes: default to functional patterns
- no stubs or mocks: production-ready code only
- debugging: halt at 2 failed attempts · report state + request guidance

## lazy import convention (toolkit and glue packages)
Toolkit packages are loaded via import map; their module load is the first real cost the browser
pays. Static top-level framework imports run at that moment — before any user interaction.

For toolkit packages that adapt a framework (glue packages), defer framework imports inside each
exported function using dynamic `import()`:
```ts
// in a hypothetical react-glue toolkit package
export async function createReactStore<T>(key: string, init: T) {
  const { useState, useEffect } = await import("react");
  // ... build and return the adapter
}
```
This way, the framework module is not loaded until the glue is actually called.

Exceptions:
- `toolkit/devtools` bundles Solid.js directly into its output — lazy import would not help.
- Published packages (`packages/*`) contain no framework imports; the rule does not apply.
- MFE entry files (`src/index.ts`) are themselves the bundle root; static imports are correct.

## ✗ invariants
- !bundle fe(*) · must stay external · importmap resolves runtime
- admin-upload writes to packages only, never routes
- routes updated manually or by CD pipeline
- !framework-deps · DOM only (exception: devtools/ bundles Solid.js internally)
- fe() devDeps → devDependencies only
- sandbox/ is !published · packages/* are published
- multiple import maps: deps injected lazily, deduped via versioned resolution
- plugins must call ctx.adapters.config.get() · never import from cli/src/config directly
- toolkit glue packages use dynamic import() for framework code (see lazy import convention above)
