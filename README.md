# FE Platform Architecture

## Vision

A micro-frontend platform enabling independent teams to build, publish, and deploy frontend experiences at their own pace while inheriting platform-wide improvements automatically. Teams publish source code; the platform builds, optimizes, and serves.

---

## Documentation

### Core Architecture

| Document | Description |
|----------|-------------|
| [Ownership Model](docs/01-ownership-model.md) | Ore / Metal / Blade layers and their responsibilities |
| [Architecture](docs/02-architecture.md) | Architectural characteristics and style |
| [Core Concepts](docs/03-core-concepts.md) | Import specifiers, composition, state, failure isolation, CSS |
| [Versioning](docs/04-versioning.md) | One Version Policy, Two-State rollouts, cohort assignment |
| [Configuration](docs/05-configuration.md) | JSON-only config, config providers |
| [Boundaries & Non-Goals](docs/06-boundaries-and-non-goals.md) | Framework interop rules, explicit non-goals |
| [Namespaced Packages](docs/07-namespaced-packages.md) | fe:net, fe:plays, fe:scenes patterns |

### Decisions & Standards

| Document | Description |
|----------|-------------|
| [Architectural Decisions](docs/08-architectural-decisions.md) | ADRs 001-023 |
| [NATIVERS](docs/09-nativers.md) | Platform packages overview |
| [Build Pipeline](docs/10-build-pipeline.md) | Build flow, manifest schema, runtime components |
| [Platform Standards](docs/13-platform-standards.md) | Testing, linting, loaders, externals |

### Developer Guides

| Document | Description |
|----------|-------------|
| [Developer Experience](docs/11-developer-experience.md) | CLI commands and workflows |
| [Enterprise Features](docs/12-enterprise-features.md) | Permissions, governance, AI integration |
| [Development Guide](docs/15-development-guide.md) | Contributing to Ore: tech stack, monorepo, phases |
| [Quick Reference](docs/16-quick-reference.md) | Agent quick start guide |

### Planning

| Document | Description |
|----------|-------------|
| [Open Questions](docs/14-open-questions.md) | Remaining implementation decisions |

---

## Quick Start

### For Platform Teams (Metal)

```bash
$ npx create-fe-platform@latest my-company --local
$ cd my-company
$ bun run dev
```

### For Product Teams (Blade)

```bash
$ fe init @myorg/my-mfe
$ cd my-mfe
$ fe dev
$ fe publish
```

---

## Key Constraints

- **JSON only** for all configuration
- **Bun** for runtime, bundler, and tests
- **One Version Policy** — single version of everything, everywhere
- **Two-State rollouts** — only rolled-out and rolling-out states
- **Plugin first** — if it can be a plugin, make it a plugin
- **State ownership** — every slice has one owner, only owner writes
- **CSS scoped by default** — no Shadow DOM, hashed class names
- **MFE failure isolation** — error boundaries, never crash shell

---

## ADR Index

| ADR | Title |
|-----|-------|
| [001](docs/08-architectural-decisions.md#adr-001-fe-uri-scheme) | fe: URI Scheme |
| [002](docs/08-architectural-decisions.md#adr-002-source-publishing-model) | Source Publishing Model |
| [003](docs/08-architectural-decisions.md#adr-003-build-time-import-rewriting) | Build-Time Import Rewriting |
| [004](docs/08-architectural-decisions.md#adr-004-single-global-state-over-message-passing) | Single Global State Over Message Passing |
| [005](docs/08-architectural-decisions.md#adr-005-shell-as-mfe) | Shell as MFE |
| [006](docs/08-architectural-decisions.md#adr-006-import-metadata-manifest) | Import Metadata Manifest |
| [007](docs/08-architectural-decisions.md#adr-007-bun-and-typescript-native) | Bun and TypeScript Native |
| [008](docs/08-architectural-decisions.md#adr-008-org-scoped-namespaced-packages) | Org-Scoped Namespaced Packages |
| [009](docs/08-architectural-decisions.md#adr-009-progressive-disclosure-of-complexity) | Progressive Disclosure of Complexity |
| [010](docs/08-architectural-decisions.md#adr-010-declarative-permission-model) | Declarative Permission Model |
| [011](docs/08-architectural-decisions.md#adr-011-source-based-cloning-for-local-development) | Source-Based Cloning |
| [012](docs/08-architectural-decisions.md#adr-012-ai-queryable-mfe-catalog) | AI-Queryable MFE Catalog |
| [013](docs/08-architectural-decisions.md#adr-013-framework-agnosticism) | Framework Agnosticism |
| [014](docs/08-architectural-decisions.md#adr-014-blessed-loaders-with-escape-hatch) | Blessed Loaders with Escape Hatch |
| [015](docs/08-architectural-decisions.md#adr-015-progressive-metal-complexity) | Progressive Metal Complexity |
| [016](docs/08-architectural-decisions.md#adr-016-one-version-policy) | One Version Policy |
| [017](docs/08-architectural-decisions.md#adr-017-two-state-rollout-model) | Two-State Rollout Model |
| [018](docs/08-architectural-decisions.md#adr-018-json-only-configuration) | JSON-Only Configuration |
| [019](docs/08-architectural-decisions.md#adr-019-config-provider-abstraction) | Config Provider Abstraction |
| [020](docs/08-architectural-decisions.md#adr-020-centralized-cli-plugin-resolution) | Centralized CLI Plugin Resolution |
| [021](docs/08-architectural-decisions.md#adr-021-state-slice-ownership-model) | State Slice Ownership Model |
| [022](docs/08-architectural-decisions.md#adr-022-mfe-failure-isolation) | MFE Failure Isolation |
| [023](docs/08-architectural-decisions.md#adr-023-css-scoping-by-default) | CSS Scoping by Default |

---

## Development Phases

| Phase | Goal | Key Deliverables |
|-------|------|------------------|
| 0 | Foundation | Monorepo, CI, plugin system, create-fe-platform |
| 1 | Core Runtime | Config, import maps, resolver, preload, manifest |
| 2 | CLI Foundation | init, dev, config commands |
| 3 | Build Pipeline | Bundler, registry, transforms, publish |
| 4 | Versioning | Two-state model, rollout/rollback |
| 5 | NATIVERS Core | State, routing, net |
| 6 | DX Advanced | Clone, preview, context/multi-local dev |
| 7 | Testing | Test utilities, plays, scenes |
| 8 | Governance | Permissions, scoring, lint config |
| 9 | Remaining NATIVERS | Auth, telemetry, i18n, visuals, experimentation |
| 10 | Namespaced Packages | fe:net/{org}, fe:plays/{org}, fe:scenes/{org} |
| 11 | Catalog & AI | Discovery portal, AI context, agent API |
| 12 | Documentation | Guides, API reference, tutorials |
| 13 | Remote Config | S3, Consul, etcd, postgres providers |

See [Development Guide](docs/15-development-guide.md) for full details.
