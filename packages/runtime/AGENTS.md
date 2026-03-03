# ⚯ packages/runtime/ · agent-ref
↑ /AGENTS.md for repo-wide context
↑ packages/core/AGENTS.md for PlatformConfig and related types

## purpose
`@fe/runtime` v0.1.0 — browser-side platform loader.
Published. Consumed by `sandbox/host-app` (and any host application).
Reads the embedded platform config, resolves the dep graph, injects import maps, and mounts MFEs.

## src/ file map
```
src/
  index.ts      re-exports: load · loadDevtools · readOverrides · processUrlParams · resolveVersion · satisfies
  platform.ts   readConfig · parseSpecVersion · resolveDeps · injectImportMap · applyOverridesAndInject · load · loadDevtools
  semver.ts     parseSemver · satisfies · resolveVersion
  overrides.ts  readOverrides · processUrlParams
```

## platform.ts — full behaviour

### readConfig()
Reads `<script id="__platform__" type="application/json">` from DOM → `PlatformConfig`.
Injected by `fe build shell` at build time.

### load(path: string)
```
1. config.routes[path] → "fe(acme/mfe-b)@1.0.0"
2. parseSpecVersion → { specifier, version }
3. resolveDeps(specifier, version) → Map<specifier, url>  (transitive walk)
4. applyOverridesAndInject(allDeps)  → merge sessionStorage overrides, then injectImportMap
5. return import(specifier)          → dynamic import resolves via injected map
```

### loadDevtools()
Loads `config.devtools` MFE (if set) into a `<div id="__devtools__">` appended to body.
Same dep resolution + import map injection as `load()`.

### injectImportMap(imports)
Creates `<script type="importmap">` and appends to `<head>`.
Skips specifiers already injected (deduplication). Warns on URL conflicts.

### applyOverridesAndInject(allDeps)
Reads `sessionStorage["platform:overrides"]` and replaces resolved URLs before injection.
Allows per-tab import map overrides without redeploying.

## semver.ts
```ts
satisfies(version: string, range: string): boolean  // minimal ^X.Y.Z matching
resolveVersion(versions: string[], range: string): string | null  // highest satisfying
```

## overrides.ts
```ts
readOverrides(): Record<string, string>  // parse sessionStorage["platform:overrides"]
processUrlParams(): void                 // handle ?platform:overrides= and ?platform:clear-overrides
```
`processUrlParams()` runs at module load time (side effect in platform.ts import).

## invariants
- no static import map in HTML; all maps injected at runtime by platform.ts
- multiple import maps across navigations; deduped by specifier
- sessionStorage key "platform:overrides" → Record<specifier, url>
- processUrlParams strips ?platform:* params from URL after processing
