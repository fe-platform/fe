# ⬡ configs/ · agent-ref
↑ /AGENTS.md for repo-wide context

## platform.json
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

## semantics

### routes
key   = URL path (e.g. "/", "/dashboard")
value = "specifier@version" — the top-level MFE for that route
  goes into the default import map served with the HTML

### packages
key   = fe() bare-specifier (exact string in `import … from "fe(@acme/…)"`)
value = { versions: { "X.Y.Z": { url, deps } } }
  url:  runtime URL for the built artifact
    local:   "./uploads/<slug>/<ver>/index.js"
    remote:  "https://cdn.example.com/<slug>/<ver>/index.js"
  deps: fe() dependencies with semver ranges (e.g. "^1.0.0")

## consumers
```
cli/src/build.ts:buildShell()
  ← readPlatformConfig() + generateRouteImportMap()
  → inject <script type="importmap"> (routes only) into shell/dist/index.html
  → inject <script id="__platform__" type="application/json"> (full config)

cli/src/admin.ts:adminUpload()
  ← readPlatformConfig()
  → writePlatformConfig() (adds package version entry with URL + deps)

shell/src/platform.ts (browser runtime)
  ← reads <script id="__platform__"> from DOM
  → resolves fe() dep graph · injects additional import maps · dynamic import()
```

## update procedure
```
1. bun cli/src/index.ts admin upload <mfe>
     registers package version in platform.json (URL + deps)
2. edit platform.json "routes": update specifier@version for the route
3. bun cli/src/index.ts build shell   (re-injects updated map + config)
```

## invariants
- admin-upload writes to `packages` only, never `routes` (separation preserved)
- `routes` updated manually or by CD pipeline
- package URL must be reachable from shell/dist/index.html at runtime
- deps use semver ranges (e.g. "^1.0.0"); resolved by shell runtime in browser
- cross-ecosystem packages use full URLs (https://...)
