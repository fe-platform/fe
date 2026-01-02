## Architectural Characteristics

**Autonomy** — Teams own their MFE lifecycle. No coordination required for deployments. Platform changes propagate without team action.

**Performance** — No waterfall network requests. Preloading driven by import metadata. Shared dependencies externalized and cached.

**Evolvability** — Platform controls the build. Browser targets, dependency versions, and optimizations update centrally.

**Developer Ergonomics** — Standard ES imports with `fe:` specifiers. No proprietary APIs for composition. TypeScript-native.

**Consistency** — NATIVERS (Network, Auth, Telemetry, I18n, Visuals, Experimentation, Routing, State) provided by platform, consumed uniformly.

---

## Architectural Style

**Distributed Modular Frontend** with:
- Runtime composition via native ES modules and import maps
- Centralized build infrastructure
- Shared state over message passing
- Platform-as-dependency model

---

