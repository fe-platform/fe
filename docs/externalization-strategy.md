# Externalization Strategy: Multiple Import Maps + Versioned Dependencies

> **Status:** COMPLETED / ARCHIVED
> **Date:** 2026-02-19
> **Implemented:** 2026-02-19

## Problem

The current system uses a single static `configs/import-map.json` that maps every `fe()` specifier to a URL. This map is manually maintained, baked into `host-app/dist/index.html` at build time, and must contain the full flat list of every MFE in the ecosystem. Changing any mapping requires rebuilding the shell.

This does not scale:
- Adding an MFE means editing the global map + rebuilding the shell
- MFE dependency relationships are implicit (not declared)
- No versioning, no deduplication, no conflict detection
- Cross-ecosystem sharing of MFEs is not possible

## Solution

Replace the single static import map with **multiple browser import maps** (shipped in Chrome 133+, Safari 18.4+) driven by a **versioned package registry** in configuration.

### Key Principles

1. **Routes define top-level MFEs.** The server configuration maps URL paths to the MFE that owns each view. Only these go in the default import map.
2. **MFEs declare their own dependencies.** Each published MFE version includes its `fe()` deps with semver ranges. The dependency graph is explicit.
3. **Multiple import maps for lazy resolution.** Before importing an MFE, the shell runtime injects a new `<script type="importmap">` for its resolved transitive deps. The browser merges maps natively.
4. **Versioned dedup.** If two MFEs depend on the same package with compatible semver ranges, they resolve to the same version and URL. The browser's merge semantics deduplicate (first entry wins, same URL = no-op).
5. **Cross-ecosystem sharing.** A package URL can be local (`./uploads/...`) or remote (`https://cdn.other-org.com/...`). The resolution mechanism is identical.

## New Configuration: `sandbox/configs/platform.json`

Replaces `configs/import-map.json`.

```json
{
  "routes": {
    "/": "fe(@acme/mfe-b)@1.0.0"
  },
  "packages": {
    "fe(@acme/mfe-a)": {
      "versions": {
        "1.0.0": {
          "url": "./uploads/mfe-a/1.0.0/index.js",
          "deps": {}
        }
      }
    },
    "fe(@acme/mfe-b)": {
      "versions": {
        "1.0.0": {
          "url": "./uploads/mfe-b/1.0.0/index.js",
          "deps": {
            "fe(@acme/mfe-a)": "^1.0.0"
          }
        }
      }
    }
  }
}
```

### `routes`
- Maps URL path to `specifier@version`
- Only top-level MFEs for each view
- These go in the default import map served with the HTML

### `packages`
- Registry of all known packages (local + cross-ecosystem)
- Each package has one or more published versions
- Each version has a URL and its `fe()` deps with semver ranges
- `admin upload` writes new version entries here automatically

## Runtime Flow

### Initial page load

1. Shell build reads `platform.json`, generates import map from `routes` (top-level MFEs only)
2. Platform config is embedded in HTML as `<script id="__platform__" type="application/json">`
3. Browser parses the default import map
4. Shell's `app.js` loads

### MFE loading (e.g. route `/` loads `fe(@acme/mfe-b)`)

1. Shell calls `platform.load("/")`
2. `load()` reads the embedded config, looks up route `/` -> `fe(@acme/mfe-b)@1.0.0`
3. Resolves mfe-b's deps: `fe(@acme/mfe-a) ^1.0.0` -> resolves to `1.0.0` -> URL
4. Recursively resolves mfe-a's deps (none)
5. Injects `<script type="importmap">` with `{ "fe(@acme/mfe-a)": "./uploads/mfe-a/1.0.0/index.js" }`
6. Calls `import("fe(@acme/mfe-b)")` -> browser resolves via default map
7. mfe-b internally does `import ... from "fe(@acme/mfe-a)"` -> resolved via injected map

No waterfall. Dep map is injected synchronously before the dynamic import.

### Subsequent navigation

When a second route is loaded, its MFE deps are resolved. Any specifier already present in a previous import map is skipped (browser merge: first wins). Versioned resolution ensures the URL is the same if ranges overlap.

### Version conflicts

If two MFEs need incompatible versions of the same dep (e.g., `^1.0.0` vs `^2.0.0`), the runtime uses import map **scopes** for per-consumer resolution:

```json
{
  "imports": { "fe(@acme/charts)": "/_mfe/charts/1.3.0/index.js" },
  "scopes": {
    "./uploads/mfe-d/1.0.0/": {
      "fe(@acme/charts)": "/_mfe/charts/2.0.0/index.js"
    }
  }
}
```

## Cross-Ecosystem Sharing

The `packages` registry supports any URL. A remote MFE from another team/org:

```json
"fe(@other-org/widget)": {
  "versions": {
    "2.1.0": {
      "url": "https://cdn.other-org.com/widget/2.1.0/index.js",
      "deps": {
        "fe(@other-org/utils)": "^3.0.0"
      }
    }
  }
}
```

The shell runtime resolves it identically to a local package. The `fe()` specifier is the universal contract; the URL is an implementation detail in the config.

## Deploy Flow (new)

```
build <mfe>
  -> admin upload <mfe>
     -> copies dist/ to uploads/slug/ver/
     -> writes package entry to sandbox/configs/platform.json (URL + deps)
  -> build shell (re-injects route map + config into HTML)
  -> serve
```

The separation is preserved: `admin upload` writes to the `packages` registry (artifact metadata). The `routes` section (which version is active for a route) is updated separately (manual or CD).

## Implementation Changes

### New files
- `sandbox/configs/platform.json` — new config format
- `packages/runtime/src/platform.ts` — browser runtime (config reader, semver resolver, import map injector, `load()` function)

### Modified files
- `cli/src/config.ts` — new types (`PlatformConfig`, `PackageEntry`, `PackageVersion`), `readPlatformConfig()` / `writePlatformConfig()`, `PLATFORM_CONFIG_PATH`
- `cli/src/admin.ts` — after copying dist, read MFE devDeps, resolve dep versions, write package entry to `platform.json`
- `cli/src/build.ts` — `buildShell()` reads `platform.json`, generates route-only import map, embeds platform config in HTML
- `sandbox/host-app/index.html` — add `<!-- __PLATFORM_CONFIG__ -->` placeholder
- `sandbox/host-app/src/index.ts` — replace static `import { render } from "fe(@acme/mfe-b)"` with `platform.load("/")`

### Removed files
- `configs/import-map.json` — replaced by `platform.json`

## Invariants (updated)

- `fe()` specifiers must stay external at build time (unchanged)
- `admin upload` writes to `packages` section only, never `routes` (separation preserved)
- `routes` updated manually or by CD pipeline
- No framework deps, DOM only (unchanged)
- Uploads dir not git-tracked (unchanged)
- Shell build output: `host-app/dist/{index.html(importmap+config injected), app.js}`
- Browser support: Chrome 133+, Safari 18.4+ (native), Firefox via es-module-shims polyfill

## Browser Support

| Browser | Multiple Import Maps | Notes |
|---------|---------------------|-------|
| Chrome 133+ | Native | Shipped Feb 2025 |
| Safari 18.4+ | Native | Shipped Mar 2025 |
| Firefox | Polyfill needed | es-module-shims v2.4+ |

