## Architectural Decisions

### ADR-001: fe: URI Scheme for All Platform Imports

**Context** — MFEs need to import other MFEs and platform packages without knowing deployment URLs or versions.

**Decision** — Use `fe:` URI scheme resolved via import maps. Platform generates and controls the import map.

**Consequences** — Standard ES import syntax. No proprietary module loader. Browser-native resolution. Platform controls all versioning.

---

### ADR-002: Source Publishing Model

**Context** — When platform externalizes a dependency or updates browser targets, MFE teams must redeploy to receive the change. Infrequent deployers fall behind.

**Decision** — Teams publish TypeScript source. Platform builds all MFEs centrally.

**Consequences** — Platform upgrades apply universally. Build consistency guaranteed. Teams lose direct control over build output. Requires robust build infrastructure.

---

### ADR-003: Build-Time Import Rewriting Over Runtime Loaders

**Context** — Dynamic imports need preloading to avoid network waterfalls. Options: runtime module loader (SystemJS-style), wrapper functions, or build-time rewriting.

**Decision** — Rewrite dynamic `import()` calls at build time to inject `__fePreload()` invocations.

**Consequences** — Developers write standard `import()`. No new APIs to learn. Preloading is automatic. Requires build tooling to parse and transform imports.

---

### ADR-004: Single Global State Over Message Passing

**Context** — MFEs need to share state. Options: event bus, postMessage, shared store.

**Decision** — Single Zustand store on main thread, accessed via `fe:state`.

**Consequences** — Simple mental model. No serialization overhead. All MFEs share one state tree. Requires conventions for slice ownership. No worker-based state isolation.

---

### ADR-005: Shell as MFE

**Context** — The shell could be a special runtime or a regular MFE.

**Decision** — Shell is an MFE that imports other MFEs. No special status beyond being the entry point.

**Consequences** — Shell is replaceable/upgradeable like any MFE. Composition model is uniform. Shell owns root layout and route structure.

---

### ADR-006: Import Metadata Manifest

**Context** — Preloading requires knowing an MFE's assets before importing it.

**Decision** — Each MFE declares import metadata (modulepreload, preload, prefetch) in its manifest. Platform aggregates into a runtime-accessible manifest.

**Consequences** — Explicit asset declaration. Platform can validate and optimize. Authors must maintain metadata accuracy.

---

### ADR-007: Bun and TypeScript Native

**Context** — Toolchain choice affects DX and build performance.

**Decision** — Bun as runtime and bundler. TypeScript required. No transpilation escape hatches.

**Consequences** — Fast builds. Type safety enforced. Ecosystem constrained to Bun-compatible packages.

---

### ADR-008: Org-Scoped Namespaced Packages

**Context** — Cross-team collaboration requires shared utilities (test flows, mocks, network clients, types). Without structure, teams duplicate effort or create ad-hoc sharing patterns.

**Decision** — Platform namespaces (`fe:net`, `fe:plays`, `fe:scenes`, etc.) support org subpaths. Org teams own their subpath; platform owns the base.

**Consequences** — Discoverability via import paths. Auth boundaries encapsulated in `fe:net/{org}`. Test composition via `fe:plays/{org}`. Requires governance on what belongs in each namespace.

---

### ADR-009: Progressive Disclosure of Complexity

**Context** — Platform must serve both new developers (low barrier) and enterprise teams (full governance). Forcing all features upfront creates friction; hiding them creates confusion.

**Decision** — Minimal MFE is three files with zero config. Features are opt-in: add `permissions` when you need security boundaries, add `ai` when you want agent discovery. Defaults are permissive.

**Consequences** — Five-minute onboarding. No decisions required upfront. Enterprise features available but not imposed. Risk of teams never opting in to governance.

---

### ADR-010: Declarative Permission Model

**Context** — MFEs need access control for state, network, and storage. Options: implicit (allow all), role-based, or capability-based.

**Decision** — Capability-based permissions declared in manifest. Build-time validation catches undeclared access. Runtime enforcement blocks violations.

**Consequences** — Security boundaries are explicit and auditable. Teams must maintain permission declarations. Default permissive to avoid blocking adoption.

---

### ADR-011: Source-Based Cloning for Local Development

**Context** — Developers need to modify MFEs they don't own for debugging or feature development. Options: fork the repo, mock it, or clone the source.

**Decision** — `fe clone` pulls published source locally. `fe dev --local` runs cloned MFEs alongside your own. Source publishing makes this possible.

**Consequences** — Any MFE can be inspected and modified locally. No repo access required. Changes are local only until published. Encourages cross-team collaboration.

---

### ADR-012: AI-Queryable MFE Catalog

**Context** — As MFE count grows, discovery becomes difficult. AI agents need structured access to invoke MFEs programmatically.

**Decision** — MFEs optionally declare `ai` context (description, intents, inputs, outputs). Platform aggregates into a searchable index. Agents can discover and invoke MFEs via `fe:ai/catalog`.

**Consequences** — Catalog becomes agent-queryable. MFE authors must maintain AI context accuracy. Opens path to AI-driven composition.

---

### ADR-013: Framework Agnosticism

**Context** — Different teams prefer different frameworks. Platform could mandate one, support a blessed set, or stay agnostic.

**Decision** — Platform is framework-agnostic. Each company adopting the platform configures which frameworks they support and whether to externalize them. Platform provides the mechanism, not the policy.

**Consequences** — Maximum flexibility for adopters. Companies can standardize on React, support multiple frameworks, or allow anything. Interoperability between frameworks is the company's concern, not the platform's.

---

### ADR-014: Blessed Loaders with Escape Hatch

**Context** — Teams need various file types (SCSS, GraphQL, templates). Options: support everything, support nothing, or provide a blessed set with extensibility.

**Decision** — Platform supports a blessed set (TS, CSS, SCSS, JSON, images). Teams can bring custom loaders declared in manifest. Custom loaders run at build time with no platform support.

**Consequences** — Common cases work out of the box. Edge cases are possible but teams own the complexity. Build times may increase for custom loaders.

---

### ADR-015: Progressive Metal Complexity

**Context** — Company platform teams adopting the FE platform face a high initial setup burden: infrastructure, auth, governance, namespaces, UI kit. This delays time-to-first-MFE.

**Decision** — Minimal Metal is a JSON config file with two required decisions (CDN provider, framework). Everything else has sensible defaults. Platform teams add capabilities incrementally as needs arise.

**Consequences** — Time-to-first-MFE is under an hour. Platform teams don't over-engineer upfront. Enterprise features are available but not imposed. Risk of teams never upgrading from defaults (mitigated by governance scoring visibility).

---

### ADR-016: One Version Policy

**Context** — Multiple versions of the same package running simultaneously cause version mismatch bugs, bloated bundles, and debugging complexity. Teams tend to "pin" to old versions indefinitely.

**Decision** — A single version of any package (MFE, library, external) runs in each environment. No version ranges. No concurrent versions except during active rollout.

**Consequences** — Eliminates version conflicts. Forces teams to stay current. Requires robust rollout/rollback mechanisms. No escape hatch for "pin to old version."

---

### ADR-017: Two-State Rollout Model

**Context** — Rollouts need to be safe (gradual traffic shift) but the system shouldn't accumulate old versions. Options: semantic versioning with ranges, explicit version pinning, or constrained state model.

**Decision** — Each environment supports exactly two states: "rolled out" (current) and "rolling out" (next). Rollout completes by promoting rolling-out to rolled-out and discarding the previous. Rollback is instant promotion of previous version.

**Consequences** — Simple mental model. Forces falling forward. No version accumulation. Requires previous version artifacts to remain available for rollback. Teams cannot maintain parallel versions.

---

### ADR-018: JSON-Only Configuration

**Context** — Configuration can be TypeScript (type-safe, code execution), YAML (human-friendly), or JSON (universal, toolable). Platform needs config that's easy to migrate, validate, and store anywhere.

**Decision** — All configuration is JSON. No TypeScript config files. No YAML. Every config file has a schema version for mechanical migrations.

**Consequences** — Config is pure data. No build step for config. Schema validation is trivial. Any config provider (S3, Consul, Postgres) works natively. Migrations are transforms, not code. Less expressive than TypeScript (no computed values).

---

### ADR-019: Config Provider Abstraction

**Context** — Day 1 should be local files. Production should be centralized (S3, Consul, etc.). CLI commands shouldn't change based on where config lives.

**Decision** — CLI talks to a ConfigProvider interface. Built-in providers: file://, s3://, consul://, etcd://, postgres://, http://. Provider is configured in `.fe/provider.json` or environment variable.

**Consequences** — Same commands from Day 1 to Year 10. Platform teams upgrade infrastructure without relearning tools. Rollout state is just another config key. Adds abstraction layer complexity.

---

### ADR-020: Centralized CLI Plugin Resolution

**Context** — Platform teams need to extend the `fe` CLI with custom commands (auth flows, release tooling, internal integrations) without forking or redistributing binaries.

**Decision** — CLI plugins are resolved dynamically from platform configuration (`cli.json`) and loaded from a local cache. Plugins are standard npm packages with exact version pinning.

**Consequences** — Platform teams extend tooling without redistributing binaries. Developers always use the same `fe` executable. Tooling evolves centrally, safely, and incrementally. Requires plugin governance (allowlists, checksums).

---

### ADR-021: State Slice Ownership Model

**Context** — A single global store requires rules about who can write to what. Without ownership, MFEs create silent coupling and race conditions.

**Decision** — Every state slice has exactly one owner. Only the owner may write. Naming convention: `<owner>/<slice>`. Enforced at build-time and runtime via permissions.

**Consequences** — Clear ownership. No silent coupling. Requires discipline in slice naming. Read access still governed by permissions.

---

### ADR-022: MFE Failure Isolation

**Context** — MFE failures should not cascade. Options: iframe isolation (heavy), error boundaries (light), or no isolation.

**Decision** — All MFEs are wrapped in platform-provided error boundaries. Failures are isolated to the MFE. Optional fallback exports. Failure telemetry is automatic.

**Consequences** — Shell always renders. Individual MFE failures are contained. Debugging requires per-MFE context. No iframe overhead.

---

### ADR-023: CSS Scoping by Default

**Context** — CSS from one MFE can bleed into another. Options: Shadow DOM, CSS-in-JS, build-time scoping, or conventions.

**Decision** — Build-time scoped CSS (hashed class names) by default. No Shadow DOM. MFEs may opt-in to global styles explicitly.

**Consequences** — Predictable, tooling-friendly. No Shadow DOM edge cases. Global styles require explicit opt-in. `fe:visuals` and shell may emit global styles.

---

