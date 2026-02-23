# docs/ · agent-ref

Documentation website for the fe platform, served using Docsify. All content lives in this directory structure.

## Structure

```
docs/
├─ README.md                      landing page / platform overview
├─ getting-started.md             quick start guide
├─ contributing.md                contribution guide
├─ architecture/                  how the system is designed and why
│  ├─ overview.md                 full lifecycle diagram and narrative
│  ├─ fe-specifier.md             the fe() naming convention
│  ├─ mfe-interface.md            the render contract
│  ├─ externalization.md          build-time externalization
│  ├─ import-maps.md              browser import maps
│  ├─ jit-compilation.md          JIT bundler and caching
│  ├─ runtime-model.md            browser runtime lifecycle
│  └─ platform-config.md          platform.json schema
├─ packages/                      API reference per package
│  ├─ core.md                     @fe/core types and interfaces
│  ├─ runtime.md                  @fe/runtime API
│  ├─ compiler.md                 @fe/compiler API
│  └─ cli.md                      @fe/cli commands
├─ guides/                        task-oriented how-to articles
│  ├─ dev-workflow.md             fe dev loop and HMR
│  ├─ publishing.md               fe publish workflow
│  ├─ linking-dependencies.md     fe link command
│  ├─ cli-plugins.md              writing plugins
│  ├─ cross-ecosystem.md          external MFE composition
│  └─ devtools.md                 developer overlay
├─ tutorials/                     end-to-end worked examples
│  ├─ react-mfe.md                React MFE tutorial
│  ├─ solid-mfe.md                SolidJS MFE tutorial
│  └─ host-app.md                 Host application tutorial
├─ advanced/                      deeper topics for power users
│  ├─ version-conflicts.md        semver resolution and conflicts
│  ├─ browser-support.md          browser compatibility
│  ├─ ci-integration.md           CI pipeline design
│  └─ deploy-to-cloud.md          cloud deployment patterns
├─ _sidebar.md                    navigation structure (Docsify config)
├─ style.css                      custom styling
└─ index.html                     Docsify configuration
```

## Voice and Tone

See root `AGENTS.md` for the universal voice and tone guidelines governing all content generation.

## Content Sections

### README.md

Purpose: orient a brand-new reader in under two minutes. Cover the mental model, the fe() convention, the MFE interface contract, and a one-paragraph summary of how it all connects at runtime. Link forward to Architecture and Getting Started. No setup instructions here.

### architecture/

The intellectual core of the documentation. Each file explains one design decision in depth: what it does, why it was designed that way, and what trade-offs it makes. Reading order follows the lifecycle: specifier → interface → externalization → import maps → JIT → runtime model → platform config → overview (which ties everything together).

Files and their scope:
- `overview.md` — full lifecycle diagram and narrative: author → build → publish → resolve → inject → import → render
- `fe-specifier.md` — what `fe(@scope/name)` is, why it is a package name and not a URL scheme, how naming drives both build-time externalization and runtime resolution
- `mfe-interface.md` — the `render` contract, framework-agnosticism, unmount/cleanup semantics
- `externalization.md` — how `readFeDepKeys` reads devDeps and passes them to `Bun.build external[]`, why the naming convention is the build signal
- `import-maps.md` — browser import maps, why multiple maps are injected lazily, deduplication via versioned resolution
- `jit-compilation.md` — JIT bundler, edge CDN deployment, on-demand compilation and caching
- `runtime-model.md` — step-by-step walkthrough of what happens in the browser from HTML load to `render()` call
- `platform-config.md` — platform.json and fe.config.json schemas, what each field means and when to change it

### getting-started.md

Quick start guide for new developers. Minimal setup and first steps to get something running. No architectural depth here — that belongs in architecture/. This article is about doing, not understanding.

### packages/

One article per published package. API-level detail: exported types, functions, interfaces, and their contracts. Accurate against current source. No prose padding — if a developer landed here they need the reference, not a preamble.

Files: `core.md`, `runtime.md`, `compiler.md`, `cli.md`

### guides/

Task-oriented. Each guide answers one question a practicing developer will ask. Start with the goal state, then the steps, then edge cases. No theory unless it directly helps complete the task.

Files:
- `dev-workflow.md` — the `fe dev` loop, HMR internals, what happens on a save
- `publishing.md` — `fe build` → `fe publish` → activate in routes → `fe build shell`
- `linking-dependencies.md` — `fe link`, file: URIs, git URIs for external repos
- `cli-plugins.md` — writing and registering a plugin, the adapter pattern, hook catalog
- `cross-ecosystem.md` — composing MFEs hosted on external CDNs, URL specifiers in platform.json
- `devtools.md` — the developer overlay, per-tab import map overrides, how to activate and use it

### tutorials/

End-to-end worked examples. The reader follows along and ends up with something running. Each tutorial covers one complete scenario from a blank directory to a working result. Prefer realistic but simple code — a counter is fine; a full authentication flow is too much.

Files: `react-mfe.md`, `solid-mfe.md`, `host-app.md`

### advanced/

Topics for developers who already understand the basics and need to go deeper. Each article can assume familiarity with everything in architecture/ and getting-started/.

Files:
- `version-conflicts.md` — semver ranges, scope-based resolution, what happens when two MFEs need incompatible versions
- `browser-support.md` — import map browser compatibility, polyfills, minimum viable browser targets
- `ci-integration.md` — CI pipeline design: packages job then sandbox job, typecheck + build, the `fe check` command
- `deploy-to-cloud.md` — cloud deployment patterns and considerations

### contributing.md

Contribution guide with setup, development workflows, coding standards, and PR guidelines.

## Workflow Rules

**Lifecycle for content files.** Each file moves through: `TODO placeholder` → `in progress` → `complete`. A file is complete when it has no `<!-- TODO -->` comments and passes a read-through against the cardinal rule above.

**Accuracy first.** All code examples must be valid at the time of writing. All CLI command signatures must match the current implementation in `packages/cli/src/`. All type names must match `packages/core/src/`.

**Cross-linking.** Concepts introduced in architecture/ should be linked from their first mention in other sections. Use relative Docsify links (`[fe() specifier](architecture/fe-specifier.md)`).

**Archive discipline.** Design docs and RFCs go in `archive/` after the implementing code lands. Add a status header (`> Status: IMPLEMENTED` or `> Status: ARCHIVED`) and update the title. Never delete archive files.

## Invariants

- No content file may reference internal CLI file paths (e.g. `helpers.ts`) without a qualifying statement that these are implementation details subject to change
- platform.json schema documented here must match `packages/core/src/types.ts`
- CLI command signatures documented here must match `packages/cli/src/commands/`
- All `fe()` package names in examples follow the `fe(@scope/name)` convention exactly
- No content file establishes a tutorial that requires tools other than Bun
- Getting Started articles must not use Bun workspaces or any shared root `package.json` that creates coupling between MFEs. Each MFE is an independent package. The only join at runtime is `platform.json` and the import maps the runtime injects from it. `fe link` appears only as a local development convenience for TypeScript resolution, never as an architectural requirement.

## Docsify Features

**Styling.** Custom styling with Source Serif 4 for body text and Google Sans Code for code blocks. Neo-brutalist design with sharp borders and no rounded corners.

**Search.** Built-in search across all documentation content.

**Code Copying.** One-click copy buttons for all code examples.

**Navigation.** Previous/next page navigation for guided reading.

**Dark Mode.** Full dark theme support with appropriate color adjustments.

**Mermaid Diagrams.** Support for rendering diagrams using mermaid.js syntax.

**Responsive Design.** Mobile-friendly layout that works on all device sizes.