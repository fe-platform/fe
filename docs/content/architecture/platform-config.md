---
sidebar_position: 8
---

# Platform Config

`platform.json` is the registry that connects everything: routes map URL paths to versioned MFEs, and the packages section records every published version with its URL and dependency declarations.

## Full Schema

```ts
interface PlatformConfig {
  routes:   Record<string, string>;
  packages: Record<string, { versions: Record<string, PackageVersion> }>;
  devtools?: string;
}

interface PackageVersion {
  url:  string;
  deps: Record<string, string>;
}
```

## `routes`

Maps URL path strings to `specifier@version` strings.

```json
{
  "routes": {
    "/": "fe(@acme/mfe-b)@1.0.0",
    "/dashboard": "fe(@acme/dashboard)@2.3.1"
  }
}
```

The key is the exact path string that `window.location.pathname` must equal. The value is `specifier@version`, where the specifier is the `fe(...)` package name and the version is the exact published version to serve. There is no wildcard matching or prefix routing — path handling beyond exact matches is the shell application's responsibility.

Routes are never written by `fe publish`. They are managed manually or by a deployment pipeline. The separation is intentional: publishing a new version and activating it in production are distinct operations with different access requirements.

## `packages`

Records every published MFE version. The key is the specifier; inside, each version maps to a `PackageVersion` entry.

```json
{
  "packages": {
    "fe(@acme/mfe-a)": {
      "versions": {
        "1.0.0": {
          "url": "/bundle/mfe-a/1.0.0/index.ts",
          "deps": {}
        }
      }
    },
    "fe(@acme/mfe-b)": {
      "versions": {
        "1.0.0": {
          "url": "/bundle/mfe-b/1.0.0/index.ts",
          "deps": {
            "fe(@acme/mfe-a)": "^1.0.0"
          }
        }
      }
    }
  }
}
```

**`url`** is the runtime-reachable address of the compiled module. For JIT-compiled MFEs, this is the `/bundle/` path that `fe serve`'s JIT handler responds to. For pre-built artifacts or CDN-hosted MFEs, this is any absolute or root-relative URL.

**`deps`** is a map of `fe()` specifier to semver range. The runtime uses this to resolve transitive dependencies before injecting import maps. The semver range format is the caret range (`^X.Y.Z`) supported by `@fe/runtime/src/semver.ts`.

## `devtools`

An optional `specifier@version` string that identifies the developer overlay MFE. When present, `loadDevtools()` loads this MFE into a `#__devtools__` container on every page load. Absent in production builds.

```json
{
  "devtools": "fe(@acme/devtools)@1.0.0"
}
```

## What `fe publish` Writes

`fe publish` only ever writes to the `packages` section. It creates or updates the entry for the published specifier and version. It never touches `routes` or `devtools`. The manifest manager's `registerPackage` method performs this write:

```ts
await manifest.registerPackage(name, version, { url, deps });
```

## `fe.config.json`

`platform.json` is read and written by the CLI and embedded into the shell at build time. The CLI itself is configured by a separate file, `configs/fe.config.json`, which controls where `platform.json` lives and other CLI defaults:

```json
{
  "plugins":      [],
  "manifestPath": "configs/platform.json",
  "uploadsDir":   "uploads",
  "sourcesDir":   "sources",
  "shellDir":     "host-app"
}
```

All fields are optional. Defaults apply when the file is absent or a field is omitted. See the [CLI Plugins guide](../guides/cli-plugins) for how to swap the manifest manager or config provider via a plugin.
