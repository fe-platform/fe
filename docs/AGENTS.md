# docs/ · agent-ref

Documentation website for the fe platform, published at [fe.frustrated.dev](https://fe.frustrated.dev). Built with Docusaurus. All content lives in `content/`.

## Structure

```
docs/
├─ content/
│  ├─ intro.md                    landing page / platform overview
│  ├─ contributing.md             mirrored contribution guide
│  ├─ architecture/               how the system is designed and why
│  ├─ getting-started/            practical onboarding sequence
│  ├─ packages/                   API reference per package
│  ├─ guides/                     task-oriented how-to articles
│  ├─ tutorials/                  end-to-end worked examples
│  └─ advanced/                   deeper topics for power users
├─ archive/                       completed/superseded design docs
├─ blog/                          release notes and platform updates
├─ sidebars.ts                    sidebar ordering (Docusaurus config)
└─ docusaurus.config.ts           site-level config
```

## Voice and Tone

These rules apply to every content file without exception.

**The cardinal rule.** Every sentence must satisfy five criteria simultaneously: concise, clear and unambiguous, complete, correct, and confident yet humble. If a sentence fails any one of those, rewrite it. There is no partial credit.

**Prose style.** Write as though you and the reader are discovering something together for the first time. The platform makes choices that are genuinely unusual in the frontend world, and the prose should honour that sense of exploration. Aim for a flowing, high-level rhythm, not a parade of bullet points or an undifferentiated wall of jargon. When a design decision pays off in an interesting way, let the writing linger on that moment rather than rushing past it.

**Wit — exactly 10%.** A well-placed pun, a precise turn of phrase, or a moment of dry observation is welcome and expected. It keeps the reader awake. The constraint is specific: wit must come from wordplay, irony, or clever observation. It must never come at the expense of a person, a technology, or the reader. No put-downs. No sneering. Funny because it is smart, not because something is mocked.

**Assertive without arrogance.** The platform has opinions. Express them plainly. Replace hedging language ("you might want to consider") with direct statements ("use `devDependencies`"). Equally, never overclaim: "the only correct approach" is a promise you will eventually fail to keep.

**No emojis.** Not in headings, not inline, not anywhere in content files.

**Em dashes.** Use at most one per page. Prefer a comma, a colon, or a new sentence instead. This rule applies even when an em dash feels tempting.

**Formatting.** Code in backticks always. Shell commands in fenced blocks with `bash`. Concepts on first appearance in **bold**. Short tables over long prose lists when comparing things. No section-header comments in code blocks. Diagrams use Mermaid fenced blocks (`mermaid`).

## Content Sections

### intro.md

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

Onboarding sequence for new developers. Each file ends with a clear "what next" pointer. No architectural depth here — that belongs in architecture/. These articles are about doing, not understanding.

Files:
- `installation.md` — Bun installation, cloning, `bun install`, verifying the `fe` CLI is on PATH
- `your-first-mfe.md` — build and serve a single MFE end-to-end using the sandbox
- `composing-mfes.md` — wire two MFEs together with `fe link`, build and serve the composed result

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

### contributing.md

Mirror of the root CONTRIBUTING.md, reformatted for Docusaurus. Keep in sync manually. If CONTRIBUTING.md changes, update this file in the same PR.

## Workflow Rules

**Lifecycle for content files.** Each file moves through: `TODO placeholder` → `in progress` → `complete`. A file is complete when it has no `<!-- TODO -->` comments and passes a read-through against the cardinal rule above.

**Accuracy first.** All code examples must be valid at the time of writing. All CLI command signatures must match the current implementation in `packages/cli/src/`. All type names must match `packages/core/src/`.

**Cross-linking.** Concepts introduced in architecture/ should be linked from their first mention in other sections. Use relative Docusaurus links (`[fe() specifier](../architecture/fe-specifier.md)`).

**Archive discipline.** Design docs and RFCs go in `archive/` after the implementing code lands. Add a status header (`> Status: IMPLEMENTED` or `> Status: ARCHIVED`) and update the title. Never delete archive files.

## Invariants

- No content file may reference internal CLI file paths (e.g. `helpers.ts`) without a qualifying statement that these are implementation details subject to change
- platform.json schema documented here must match `packages/core/src/types.ts`
- CLI command signatures documented here must match `packages/cli/src/commands/`
- All `fe()` package names in examples follow the `fe(@scope/name)` convention exactly
- No content file establishes a tutorial that requires tools other than Bun
