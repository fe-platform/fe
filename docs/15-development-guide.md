## Development Guide (Ore)

This section is for developers building the FE platform itself (the Ore layer). For company platform teams building Metal, see the extension points in the Ownership Model.

### Tech Stack

| Tool | Purpose |
|------|---------|
| **Bun** | Runtime, package manager, bundler, test runner |
| **bun:test** | Unit and integration testing |
| **TypeScript (next)** | Type checking with latest features |
| **Turborepo** | Monorepo task orchestration and caching |
| **ESLint** | Linting (rslint-ready) |

### Monorepo Structure

```
fe-platform/
├── apps/
│   ├── registry/              # Source registry server
│   ├── build-server/          # Central build service
│   ├── catalog/               # Discovery portal UI
│   └── preview-server/        # PR preview environments
│
├── packages/
│   ├── create-fe-platform/    # npx create-fe-platform scaffold generator
│   │
│   ├── core/
│   │   ├── import-map/        # Import map generation
│   │   ├── preload/           # __fePreload runtime
│   │   ├── manifest/          # Manifest parsing and validation
│   │   ├── resolver/          # fe: specifier resolution
│   │   └── config/            # Config provider abstraction + built-in providers
│   │
│   ├── cli/
│   │   ├── cli-core/          # CLI framework and plugin loader
│   │   ├── cli-config/        # fe config command (get, set, use, migrate)
│   │   ├── cli-init/          # fe init command
│   │   ├── cli-dev/           # fe dev command
│   │   ├── cli-build/         # fe build command
│   │   ├── cli-clone/         # fe clone command
│   │   ├── cli-preview/       # fe preview command
│   │   ├── cli-publish/       # fe publish command
│   │   ├── cli-rollback/      # fe rollback command
│   │   ├── cli-rollout/       # fe rollout command
│   │   └── cli-update-external/ # fe update-external command
│   │
│   ├── platform/
│   │   ├── state/             # fe:state (Zustand wrapper)
│   │   ├── routing/           # fe:routing
│   │   ├── net/               # fe:net base
│   │   ├── auth/              # fe:auth
│   │   ├── i18n/              # fe:i18n
│   │   ├── telemetry/         # fe:telemetry
│   │   ├── visuals/           # fe:visuals base
│   │   └── experimentation/   # fe:experimentation
│   │
│   ├── testing/
│   │   ├── test/              # fe:test utilities
│   │   ├── test-mocks/        # fe:test/mocks
│   │   ├── plays-core/        # fe:plays base
│   │   └── scenes-core/       # fe:scenes base
│   │
│   ├── build/
│   │   ├── bundler/           # Bun bundler wrapper
│   │   ├── transform/         # Import rewriting (dynamic imports → __fePreload)
│   │   ├── loaders/           # Blessed file loaders
│   │   └── loader-plugin/     # Custom loader plugin interface
│   │
│   ├── governance/
│   │   ├── scoring/           # Governance score calculation
│   │   ├── permissions/       # Permission validation and enforcement
│   │   └── eslint-config/     # @fe/eslint-config base
│   │
│   └── ai/
│       ├── catalog-index/     # AI context aggregation
│       └── catalog-api/       # fe:ai/catalog query API
│
├── docs/
│   ├── getting-started/
│   ├── architecture/
│   ├── guides/
│   ├── api-reference/
│   └── adr/                   # Architecture Decision Records
│
├── examples/
│   ├── minimal-mfe/
│   ├── mfe-with-routing/
│   ├── mfe-with-state/
│   └── full-mfe/
│
├── turbo.json
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

### Plugin Architecture

**Principle:** Every major capability is a plugin. Core is minimal. This enables:
- Independent development and testing
- Easy extension by adopters
- Clear boundaries and contracts

**Plugin types:**

| Type | Interface | Examples |
|------|-----------|----------|
| **CLI Command** | `CliPlugin` | init, dev, build, clone, preview |
| **Loader** | `LoaderPlugin` | scss, json, svg, custom |
| **Transform** | `TransformPlugin` | import rewriting, preload injection |
| **Governance Rule** | `GovernancePlugin` | bundle size, a11y, coverage |
| **Platform Package** | `PlatformPlugin` | state, routing, net, auth |

**Plugin interface pattern:**

```typescript
// packages/core/plugin/types.ts

interface Plugin<TConfig = unknown> {
  name: string
  version: string
  config?: TConfig
  setup: (context: PluginContext) => Promise<void> | void
  teardown?: () => Promise<void> | void
}

interface PluginContext {
  hooks: PluginHooks
  config: PlatformConfig
  logger: Logger
}

interface PluginHooks {
  // Lifecycle hooks - plugins tap into these
  onBuildStart: Hook<BuildContext>
  onBuildEnd: Hook<BuildResult>
  onTransform: Hook<TransformContext>
  onResolve: Hook<ResolveContext>
  onPublish: Hook<PublishContext>
  onDevServerStart: Hook<DevServerContext>
}
```

**CLI plugin example:**

```typescript
// packages/cli/cli-init/index.ts

import type { CliPlugin } from "@fe/cli-core"

export const initPlugin: CliPlugin = {
  name: "init",
  version: "1.0.0",
  
  setup(context) {
    context.registerCommand({
      name: "init",
      description: "Scaffold a new MFE",
      options: [
        { name: "template", alias: "t", type: "string", default: "minimal" }
      ],
      action: async (args, options) => {
        // Implementation
      }
    })
  }
}
```

**Loader plugin example:**

```typescript
// packages/build/loaders/scss.ts

import type { LoaderPlugin } from "@fe/loader-plugin"

export const scssLoader: LoaderPlugin = {
  name: "scss",
  version: "1.0.0",
  extensions: [".scss", ".sass"],
  
  setup(context) {
    context.hooks.onTransform.tap("scss", async (ctx) => {
      if (!this.extensions.includes(ctx.path.extname)) return
      
      const result = await compileSass(ctx.source)
      return {
        code: result.css,
        map: result.sourceMap,
        type: "css"
      }
    })
  }
}
```

### Centralized CLI Plugin System

Platform teams must extend `fe` without forking, re-implementing, or redistributing the CLI binary.

**Decision:** `fe` dynamically loads CLI plugins from a central config provider.

**Plugin configuration (stored in config provider):**

```json
// config/cli.json
{
  "$schema": "https://fe-platform.dev/schemas/cli/v1.json",
  "plugins": [
    {
      "name": "@acme/fe-cli-auth",
      "version": "1.2.0"
    },
    {
      "name": "@acme/fe-cli-release",
      "version": "3.0.1",
      "config": {
        "requireTicket": true
      }
    }
  ]
}
```

- Exact versions only (mirrors One Version Policy)
- Ordered loading
- Optional per-plugin config

**Plugin distribution:** Standard npm/Bun packages. Published by platform teams. Installed into a local CLI cache.

**CLI startup lifecycle:**

```
fe invoked
    ↓
Load minimal core (help, config, doctor)
    ↓
Resolve config provider
    ↓
Fetch cli.json
    ↓
Resolve + cache plugins (exact versions)
    ↓
Load plugins in order
    ↓
Plugins register commands/hooks
    ↓
Execute requested command
```

If config provider is unreachable: CLI runs in core-only degraded mode. Cached plugins are used if available.

**Governance & safety:**

| Constraint | Enforcement |
|------------|-------------|
| Allowlisted package scopes | e.g. `@acme/*` only |
| Exact version pinning | No ranges |
| Checksum verification | On install |
| Sandboxed execution | Plugins cannot mutate core |

**Failure modes:**

| Failure | Behavior |
|---------|----------|
| Plugin fails to load | CLI continues without it |
| Plugin throws in setup | Plugin disabled, warning shown |
| Plugin command fails | Scoped failure only |

No plugin can brick the CLI.

### AI Agent Guidelines

Guidelines for AI agents contributing to the FE platform codebase.

**General principles:**

1. **Read before writing.** Check existing code in the relevant package before creating new files.
2. **Plugin first.** If the feature can be a plugin, make it a plugin.
3. **Test alongside.** Every new file gets a corresponding `.test.ts` file.
4. **Types are documentation.** Export interfaces. Use JSDoc for public APIs.
5. **Small PRs.** One capability per PR. Easier to review and revert.

**Package creation checklist:**

```
□ package.json with correct name (@fe/package-name)
□ tsconfig.json extending root config
□ src/index.ts exporting public API
□ src/types.ts for shared types
□ src/*.test.ts for each source file
□ README.md with usage examples
```

**File structure per package:**

```
packages/category/package-name/
├── src/
│   ├── index.ts           # Public exports only
│   ├── types.ts           # Shared types
│   ├── [feature].ts       # Implementation
│   └── [feature].test.ts  # Tests
├── package.json
├── tsconfig.json
└── README.md
```

**Naming conventions:**

| Entity | Convention | Example |
|--------|------------|---------|
| Package | `@fe/kebab-case` | `@fe/cli-init` |
| File | `kebab-case.ts` | `import-map.ts` |
| Export (function) | `camelCase` | `generateImportMap` |
| Export (class) | `PascalCase` | `ImportMapBuilder` |
| Export (type) | `PascalCase` | `ImportMapConfig` |
| Export (constant) | `SCREAMING_SNAKE` | `DEFAULT_TIMEOUT` |
| Plugin | `camelCase + Plugin` | `initPlugin`, `scssLoader` |

**Commit message format:**

```
type(scope): description

feat(cli-init): add template selection prompt
fix(import-map): handle circular dependencies
refactor(resolver): extract path utils
test(state): add subscription edge cases
docs(guides): add routing tutorial
```

**Testing requirements:**

- Unit tests with `bun:test`
- Tests live next to source files (`foo.ts` → `foo.test.ts`)
- Minimum coverage: 80% lines for core packages
- Integration tests in `apps/*/tests/`

**Before submitting:**

```bash
bun run typecheck    # No errors
bun run lint         # No warnings
bun run test         # All pass
bun run build        # Builds successfully
```

### Development Phases

#### Phase 0: Foundation

**Goal:** Monorepo scaffolding, CI, basic tooling.

**Deliverables:**
- [ ] Monorepo structure with Turborepo
- [ ] Root tsconfig, .eslintrc.json, package.json
- [ ] CI pipeline (typecheck, lint, test, build)
- [ ] `@fe/core` package with plugin system skeleton
- [ ] `create-fe-platform` scaffold generator (minimal Metal)
- [ ] Contributing guidelines and PR template

**Exit criteria:** `bun install && bun run build` succeeds. `npx create-fe-platform test-platform` generates working scaffold.

---

#### Phase 1: Core Runtime

**Goal:** fe: imports work in browser. Config provider abstraction works.

**Deliverables:**
- [ ] `@fe/config` — ConfigProvider interface + file:// provider
- [ ] `@fe/import-map` — generate import maps from config
- [ ] `@fe/resolver` — resolve fe: specifiers to URLs
- [ ] `@fe/preload` — `__fePreload` runtime implementation
- [ ] `@fe/manifest` — parse and validate MFE manifests
- [ ] JSON schemas for platform.json, environments.json, rollout.json, governance.json
- [ ] Basic HTML shell that loads an import map and mounts an MFE

**Exit criteria:** Static HTML page loads an MFE via `fe:@test/hello` specifier. `fe config get platform.name` reads from local JSON.

---

#### Phase 2: CLI Foundation

**Goal:** `fe init`, `fe dev` (isolation mode), and `fe config` work.

**Deliverables:**
- [ ] `@fe/cli-core` — CLI framework with plugin loading
- [ ] `@fe/cli-config` — `fe config get/set/use/migrate` commands
- [ ] `@fe/cli-init` — scaffold MFE from template
- [ ] `@fe/cli-dev` — dev server with HMR (isolation mode)
- [ ] JSON schema validation on config writes
- [ ] Example templates: minimal, with-routing, with-state

**Exit criteria:** `fe init @myorg/test && cd test && fe dev` starts a working dev server. `fe config set` validates against schema.

---

#### Phase 3: Build Pipeline

**Goal:** Source publish and central build.

**Deliverables:**
- [ ] `@fe/bundler` — Bun bundler wrapper
- [ ] `@fe/transform` — dynamic import rewriting
- [ ] `@fe/loaders` — blessed loaders (TS, CSS, SCSS, JSON, images)
- [ ] `@fe/loader-plugin` — custom loader interface
- [ ] `apps/registry` — accepts source uploads
- [ ] `apps/build-server` — builds on publish, stores artifacts
- [ ] `@fe/cli-publish` — publish source to registry
- [ ] `@fe/cli-build` — local build for validation

**Exit criteria:** `fe publish` sends source to registry, build server produces artifacts, import map updates.

---

#### Phase 4: Versioning and Rollouts

**Goal:** One Version Policy and Two-State rollouts work.

**Deliverables:**
- [ ] Registry tracks rolled-out and rolling-out state per environment
- [ ] Import map generation respects rollout state
- [ ] Session cohort assignment (cookie/header based)
- [ ] `@fe/cli-rollout` — `fe rollout` command with percentage control
- [ ] `@fe/cli-rollback` — instant rollback to previous version
- [ ] `@fe/cli-update-external` — atomic external library updates
- [ ] Rollout state API for monitoring

**Exit criteria:** Publish new version, rollout at 10%, verify cohort split, complete rollout, rollback, verify instant switch.

---

#### Phase 5: Platform Packages (NATIVERS Core)

**Goal:** State and routing work.

**Deliverables:**
- [ ] `@fe/state` — Zustand-based global store
- [ ] `@fe/routing` — history-based routing
- [ ] `@fe/net` — fetch wrapper with interceptors
- [ ] Externalization of platform packages in build

**Exit criteria:** MFE imports `fe:state`, `fe:routing`, `fe:net` and they resolve to shared chunks.

---

#### Phase 6: Developer Experience (Advanced)

**Goal:** Full `fe dev` modes, clone, preview.

**Deliverables:**
- [ ] `@fe/cli-dev` — add `--in` (context mode) and `--local` (multi-local mode)
- [ ] `@fe/cli-clone` — pull source for local development
- [ ] `@fe/cli-preview` — create PR preview environments
- [ ] `apps/preview-server` — serves preview environments with import map overrides
- [ ] `@fe/cli-rollback` — instant version rollback

**Exit criteria:** `fe dev --in=@platform/shell --local=@org/header` runs with HMR on both local MFEs.

---

#### Phase 7: Testing Infrastructure

**Goal:** `fe:test`, `fe:plays`, `fe:scenes` work.

**Deliverables:**
- [ ] `@fe/test` — test utilities (render, screen, fireEvent)
- [ ] `@fe/test-mocks` — mockState, mockNet, mockRouter, etc.
- [ ] `@fe/plays-core` — Playwright fixtures base
- [ ] `@fe/scenes-core` — MSW integration, scene loading

**Exit criteria:** MFE can `import { render } from "fe:test"` and run component tests with mocked state.

---

#### Phase 8: Governance

**Goal:** Permissions and scoring.

**Deliverables:**
- [ ] `@fe/permissions` — build-time validation, runtime enforcement
- [ ] `@fe/scoring` — governance score calculation (bundle size, coverage, a11y)
- [ ] `@fe/eslint-config` — base ESLint config (rslint-ready)
- [ ] Integration into build pipeline (scores reported, permissions enforced)

**Exit criteria:** Build fails if MFE accesses undeclared permission. Score visible in build output.

---

#### Phase 9: Remaining NATIVERS

**Goal:** Complete platform packages.

**Deliverables:**
- [ ] `@fe/auth` — token management, security boundaries
- [ ] `@fe/telemetry` — auto-instrumentation, custom events
- [ ] `@fe/i18n` — localization, formatting
- [ ] `@fe/visuals` — base component library, tokens
- [ ] `@fe/experimentation` — feature flags, remote config

**Exit criteria:** All NATIVERS packages importable and functional.

---

#### Phase 10: Namespaced Packages

**Goal:** `fe:net/{org}`, `fe:plays/{org}`, `fe:scenes/{org}` pattern works.

**Deliverables:**
- [ ] Registry support for namespaced packages
- [ ] Build server handles org-scoped resolution
- [ ] Documentation for creating org packages
- [ ] Example: `fe:net/example-org` with auth boundary

**Exit criteria:** Org team can publish `fe:net/theirorg` and other MFEs can import it.

---

#### Phase 11: Catalog and AI

**Goal:** Discovery portal and AI integration.

**Deliverables:**
- [ ] `apps/catalog` — browsable MFE registry UI
- [ ] `@fe/catalog-index` — aggregate AI context from manifests
- [ ] `@fe/catalog-api` — `fe:ai/catalog` query API
- [ ] Search by capability, intent, and keywords

**Exit criteria:** Catalog shows all MFEs with scenes rendered. AI agent can query and invoke MFEs via API.

---

#### Phase 12: Documentation

**Goal:** Complete docs site.

**Deliverables:**
- [ ] Getting started guide
- [ ] Architecture overview
- [ ] API reference (generated from types)
- [ ] Tutorials: first MFE, adding state, testing, publishing
- [ ] ADRs migrated to docs
- [ ] Contribution guide

**Exit criteria:** New developer can go from zero to published MFE following docs alone.

---

#### Phase 13: Remote Config Providers

**Goal:** Platform teams can centralize config beyond local files.

**Deliverables:**
- [ ] `@fe/config` — s3://, consul://, etcd://, postgres://, http:// providers
- [ ] `fe config use` — switch providers seamlessly
- [ ] `fe config migrate` — schema version migrations
- [ ] Config watching (real-time updates from remote providers)
- [ ] Config diff and audit logging

**Exit criteria:** `fe config use s3://bucket/path` switches all config reads/writes to S3. Rollout state changes propagate in real-time.

---

