# docs/ · agent-ref

Documentation website for the fe platform, served using Docsify. All content lives in this directory structure.

## Structure

```
docs/
├─ README.md                      landing page / platform overview
├─ getting-started.md             quick start guide (legacy stub — use getting-started/ instead)
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
├─ getting-started/               structured getting-started section
│  ├─ installation.md             toolchain setup
│  ├─ your-first-mfe.md           build and serve a single MFE
│  └─ composing-mfes.md           link two MFEs and compose them
├─ advanced/                      deeper topics for power users
│  ├─ version-conflicts.md        semver resolution and conflicts
│  ├─ browser-support.md          browser compatibility
│  ├─ ci-integration.md           CI pipeline design
│  └─ deploy-to-cloud.md          cloud deployment (TODO stub)
├─ _sidebar.md                    navigation structure (Docsify config)
├─ index.html                     Docsify configuration and plugin setup
└─ style.css                      local dev override (generated — do not edit directly)
```

## Theming — docsify-slab

The site uses `@fe/docsify-slab` (`meta/docsify-slab/`), a neo-brutalist Docsify theme published to npm. In production, `index.html` loads it from jsDelivr:

```
https://cdn.jsdelivr.net/npm/@fe/docsify-slab@<version>/theme.css
```

For local development, `docs/style.css` is a generated copy of the theme. Run `bun run docs` from the repo root — the `predocs` script copies `meta/docsify-slab/theme.css` → `docs/style.css` automatically before serving.

`docs/style.css` is a generated artifact. Edit `meta/docsify-slab/theme.css` to change the theme, then re-run `bun run docs` or `bun run meta/docsify-slab/scripts/copy-to-docs.ts` manually.

## Docsify setup — index.html

Framework: Docsify v4, no build step. Everything loads from CDN at runtime.

Stylesheet load order (each layer overrides the previous):
1. `docsify@4/themes/vue.css` — base Docsify theme
2. `@fe/docsify-slab` via jsDelivr — full neo-brutalist override
3. `style.css` — local dev copy of the same theme (no-op in production)

Plugins loaded:
- `docsify@4/lib/plugins/search.min.js` — full-text search
- `docsify@4/lib/plugins/copy-code.min.js` — one-click copy on code blocks
- `docsify-pagination@0.0.2` — previous/next navigation
- `mermaid@10` — diagram rendering, re-run on each `doneEach` hook

Loader: `#loader-overlay` is a fixed full-screen element outside `#app`. It blurs the page with `backdrop-filter` while Docsify boots, then receives `.hidden` via the `hook.ready` callback.

Key config:
- `loadSidebar: true` — reads `_sidebar.md`
- `subMaxLevel: 3` — renders h2/h3 in sidebar
- `auto2top: true` — scrolls to top on navigation
- Mermaid code fences (`\`\`\`mermaid`) are rendered as diagrams via a custom markdown renderer

## Layout — how centering works

Docsify adds `body.sticky` after load, switching `.sidebar` and `.content` to `position: fixed`. The theme overrides this with `position: absolute !important` on both `.sidebar, body.sticky .sidebar` and `.content, body.sticky .content`, keeping them inside `#app`. `#app` itself is `max-width: var(--slab-layout-max-width)` with `margin: 0 auto`, centering the sidebar+content pair on wide viewports.

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

### getting-started/

Three-part sequence: installation → first MFE → composing MFEs. Each article is about doing, not understanding. No architectural depth — link to architecture/ for that.

### packages/

One article per published package. API-level detail: exported types, functions, interfaces, and their contracts. Accurate against current source. No prose padding.

Files: `core.md`, `runtime.md`, `compiler.md`, `cli.md`

### guides/

Task-oriented. Each guide answers one question a practicing developer will ask. Start with the goal state, then the steps, then edge cases.

Files:
- `dev-workflow.md` — the `fe dev` loop, HMR internals, what happens on a save
- `publishing.md` — `fe build` → `fe publish` → activate in routes → `fe build shell`
- `linking-dependencies.md` — `fe link`, file: URIs, git URIs for external repos
- `cli-plugins.md` — writing and registering a plugin, the adapter pattern, hook catalog
- `cross-ecosystem.md` — composing MFEs hosted on external CDNs, URL specifiers in platform.json
- `devtools.md` — the developer overlay, per-tab import map overrides, how to activate and use it

### tutorials/

End-to-end worked examples. Each tutorial covers one complete scenario from a blank directory to a working result. Prefer realistic but simple code.

Files: `react-mfe.md`, `solid-mfe.md`, `host-app.md`

### advanced/

Topics for developers who already understand the basics and need to go deeper.

Files:
- `version-conflicts.md` — semver ranges, scope-based resolution, incompatible version handling
- `browser-support.md` — import map browser compatibility, polyfills, minimum viable browser targets
- `ci-integration.md` — CI pipeline design: packages job then sandbox job, typecheck + build, `fe check`
- `deploy-to-cloud.md` — cloud deployment patterns (currently a TODO stub)

### contributing.md

Contribution guide with setup, development workflows, coding standards, and PR guidelines.

## Content completion status

| File | Status |
|---|---|
| `README.md` | complete |
| `getting-started/installation.md` | complete |
| `getting-started/your-first-mfe.md` | complete |
| `getting-started/composing-mfes.md` | complete |
| `architecture/*.md` (all 8) | complete |
| `packages/*.md` (all 4) | complete |
| `guides/*.md` (all 6) | complete |
| `tutorials/*.md` (all 3) | complete |
| `advanced/version-conflicts.md` | complete |
| `advanced/browser-support.md` | complete |
| `advanced/ci-integration.md` | complete |
| `advanced/deploy-to-cloud.md` | TODO stub |

## Workflow Rules

**Lifecycle for content files.** Each file moves through: `TODO placeholder` → `in progress` → `complete`. A file is complete when it has no `<!-- TODO -->` comments and passes a read-through against the cardinal rule in root `AGENTS.md`.

**Accuracy first.** All code examples must be valid at the time of writing. All CLI command signatures must match `packages/cli/src/commands/`. All type names must match `packages/core/src/`.

**Cross-linking.** Concepts introduced in `architecture/` should be linked from their first mention in other sections. Use relative Docsify links: `[fe() specifier](architecture/fe-specifier.md)`.

**Archive discipline.** Design docs and RFCs go in `archive/` after the implementing code lands. Add a status header and never delete archive files.

## Invariants

- `docs/style.css` is generated — edit `meta/docsify-slab/theme.css` instead
- No content file may reference internal CLI file paths without noting they are implementation details
- `platform.json` schema documented here must match `packages/core/src/types.ts`
- CLI command signatures documented here must match `packages/cli/src/commands/`
- All `fe()` package names in examples follow the `fe(@scope/name)` convention exactly
- No content file establishes a tutorial that requires tools other than Bun
- Getting Started articles must not use Bun workspaces or shared root `package.json` — each MFE is independent
