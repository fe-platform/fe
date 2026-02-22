---
sidebar_position: 7
---

# Runtime Model

The full browser lifecycle from initial page load to MFE rendering.

1. Shell HTML loads with the full platform config embedded as JSON — no static import map
2. `platform.js` reads the config and resolves the current route to a `specifier@version`
3. Transitive `fe()` deps are resolved via semver from the packages registry
4. A `<script type="importmap">` is injected covering all resolved deps
5. `import(specifier)` — the browser resolves via the injected map and mounts the MFE

<!-- TODO: Expand each step with diagrams, code snippets from @fe/runtime, and explain subsequent navigations, lazy map injection, and deduplication across navigations. -->
