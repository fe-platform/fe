---
sidebar_position: 6
---

# Devtools

The developer overlay for per-tab import map overrides, allowing you to swap MFE versions in the browser without redeploying.

## Enabling Devtools

Add `"devtools"` to `platform.json` after publishing the devtools MFE:

```json
{
  "devtools": "fe(@acme/devtools)@1.0.0",
  "routes": { ... },
  "packages": { ... }
}
```

Rebuild the shell to embed the updated config, then serve:

```bash
fe build shell
fe serve
```

The shell's `loadDevtools()` call reads `config.devtools` on every page load. If the field is absent, nothing happens. If it is set, the devtools MFE is resolved, its import map is injected, and the overlay is mounted into a `<div id="__devtools__">` appended to `<body>`.

## The Overlay UI

The devtools overlay renders a floating panel in the bottom-right corner. It shows:

- The list of active import map overrides stored in `sessionStorage` for the current tab.
- Controls to add a new override (specifier + URL), remove individual overrides, and clear all.
- A "Share" button that encodes the current overrides as a `?platform:overrides=` query parameter, producing a URL you can paste in another tab or send to a colleague.

Changes take effect on the next page load. The overlay triggers a reload automatically after writing to `sessionStorage`.

## How Overrides Work

The override mechanism uses `sessionStorage`, which means overrides are scoped to the current browser tab (not shared across tabs or windows).

When `applyOverridesAndInject` runs during `load()`, it reads `sessionStorage["platform:overrides"]` and replaces any matching resolved URL before injecting the import map:

```ts
function applyOverridesAndInject(allDeps: Map<string, string>): void {
  const overrides = readOverrides();
  for (const [spec, url] of Object.entries(overrides)) {
    if (allDeps.has(spec)) {
      allDeps.set(spec, url);  // replace the resolved URL
    }
  }
  // inject the (possibly modified) map
  injectImportMap(Object.fromEntries(allDeps));
}
```

The override URL can point anywhere: a local `fe dev` server, a staging JIT Server, a specific branch build. The browser fetches the MFE from the override URL; all other MFEs load from their registered URLs.

## Sharing Overrides via URL

The "Share" URL encodes overrides as JSON in the `?platform:overrides=` query parameter:

```
https://app.example.com/?platform:overrides={"fe(@acme/mfe-a)":"http://localhost:4000/index.js"}
```

When `@fe/runtime` loads, `processUrlParams()` runs immediately and merges the parameter value into `sessionStorage` before any routing logic. The parameter is stripped from the URL via `history.replaceState`, so subsequent navigations are clean.

To clear all overrides from a URL:

```
https://app.example.com/?platform:clear-overrides
```

This removes `sessionStorage["platform:overrides"]` entirely and strips the parameter.

## Security Considerations

Import map overrides allow arbitrary URLs to be loaded as trusted MFE code. Use devtools only in development and staging environments. Remove the `"devtools"` field from `platform.json` for production deployments.
