---
sidebar_position: 1
---

# Version Conflicts

How the platform handles incompatible versions of the same MFE dependency using import map scopes for per-consumer resolution.

## The Conflict Scenario

Consider two MFEs that both depend on a shared utility package, `fe(@acme/ui-kit)`, but at incompatible major versions:

```json
"fe(@acme/mfe-a)": {
  "1.0.0": { "url": "...", "deps": { "fe(@acme/ui-kit)": "^1.0.0" } }
}

"fe(@acme/mfe-b)": {
  "1.0.0": { "url": "...", "deps": { "fe(@acme/ui-kit)": "^2.0.0" } }
}
```

When a page loads both MFEs, `resolveDeps` picks the highest version satisfying each range. For `^1.0.0` it might pick `1.3.0`; for `^2.0.0` it might pick `2.1.0`. These cannot share a single import map entry — `fe(@acme/ui-kit)` cannot simultaneously point to two different URLs.

## How Import Map Scopes Solve This

The import maps specification supports **scopes**, which override the top-level resolution for imports originating from a specific URL prefix:

```json
{
  "imports": {
    "fe(@acme/ui-kit)": "/bundle/ui-kit/2.1.0/index.js"
  },
  "scopes": {
    "/bundle/mfe-a/1.0.0/": {
      "fe(@acme/ui-kit)": "/bundle/ui-kit/1.3.0/index.js"
    }
  }
}
```

With this map, when `mfe-b` (loaded from `/bundle/mfe-b/1.0.0/`) imports `fe(@acme/ui-kit)`, the browser uses the top-level entry and resolves to `2.1.0`. When `mfe-a` (loaded from `/bundle/mfe-a/1.0.0/`) imports `fe(@acme/ui-kit)`, the browser uses the scoped entry and resolves to `1.3.0`. Each MFE gets the version it asked for.

The two `ui-kit` versions are loaded as separate modules in separate module scopes. They do not share instances. This is the intended outcome for a major version split: breaking changes in `ui-kit@2` are isolated from `mfe-a`'s use of `ui-kit@1`.

## Current Implementation Note

`@fe/runtime`'s current `injectImportMap` implementation uses the flat `imports` object only. It does not yet generate scoped entries automatically. The first specifier write wins, which means the current runtime selects one version and serves it to all consumers on the page.

For teams whose MFEs have compatible (caret-range) version requirements, this is rarely a problem: `resolveVersion` picks the highest satisfying version, and all consumers work with it. For genuinely incompatible major version splits, the current approach produces a warning in the console and serves the first-resolved URL to all consumers.

Scoped import map support is a future improvement to `@fe/runtime`. In the meantime, coordinate major version upgrades across dependent MFEs to keep ranges compatible.

## Avoiding Conflicts

The most reliable mitigation is coordinating version ranges across teams. If `mfe-a` and `mfe-b` both declare `^1.0.0` or both declare `^2.0.0`, `resolveVersion` picks a single satisfying version and the conflict does not arise.

When a breaking upgrade is necessary, use a staged rollout: upgrade `mfe-a` to `ui-kit@2`, publish a new `mfe-a@2.0.0`, update routes to point to the new version, and then upgrade `mfe-b`. The old and new versions coexist in the platform configuration throughout the transition.
