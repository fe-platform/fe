---
sidebar_position: 7
---

# Runtime Model

The full browser lifecycle from initial page load to MFE rendering.

## Step 1: Shell HTML Loads with Embedded Config

`fe build shell` produces `dist/index.html` with the full `platform.json` inlined as a JSON script element:

```html
<script id="__platform__" type="application/json">
{
  "routes": { "/": "fe(@acme/mfe-b)@1.0.0" },
  "devtools": "fe(@acme/devtools)@1.0.0",
  "packages": { ... }
}
</script>
```

There is no static import map in the HTML. The browser receives no resolution information at load time, only the raw config. Import maps are added later, just before they are needed.

`processUrlParams()` runs immediately when `app.js` loads, before any async code. It reads `?platform:overrides` or `?platform:clear-overrides` query parameters and updates `sessionStorage` accordingly, then strips those parameters from the URL.

## Step 2: Devtools Loads (if configured)

If `config.devtools` is set, `loadDevtools()` resolves the devtools specifier, injects its import map, and mounts the overlay:

```ts
export async function loadDevtools(): Promise<void> {
  if (!config.devtools) return;
  const { specifier, version } = parseSpecVersion(config.devtools);
  const allDeps = resolveDeps(specifier, version);
  applyOverridesAndInject(allDeps);
  const container = document.createElement("div");
  container.id = "__devtools__";
  document.body.appendChild(container);
  const mod = await import(specifier) as { render: RenderFn };
  mod.render(container, {});
}
```

## Step 3: Route Resolved to Specifier and Version

`load(path)` looks up the current `window.location.pathname` in `config.routes`:

```ts
const routeEntry = config.routes[path];
// e.g. "fe(@acme/mfe-b)@1.0.0"
const { specifier, version } = parseSpecVersion(routeEntry);
```

`parseSpecVersion` splits on `)@`, the unique delimiter in `fe(@scope/name)@version`.

## Step 4: Transitive Dependencies Resolved via Semver

`resolveDeps` walks the dependency graph recursively, selecting the highest version of each dependency that satisfies the declared semver range:

```ts
function resolveDeps(specifier, version, resolved = new Map()) {
  if (resolved.has(specifier)) return resolved;
  const ver = config.packages[specifier].versions[version];
  resolved.set(specifier, ver.url);
  for (const [depSpec, depRange] of Object.entries(ver.deps)) {
    const depVersion = resolveVersion(Object.keys(config.packages[depSpec].versions), depRange);
    resolveDeps(depSpec, depVersion, resolved);
  }
  return resolved;
}
```

The result is a flat `Map<specifier, url>` covering the root MFE and all transitive dependencies.

## Step 5: Import Map Injected

`applyOverridesAndInject` merges any active `sessionStorage` overrides into the resolved map, then calls `injectImportMap`:

```ts
function injectImportMap(imports: Record<string, string>): void {
  // skip already-injected specifiers (first write wins)
  const script = document.createElement("script");
  script.type = "importmap";
  script.textContent = JSON.stringify({ imports: newImports });
  document.head.appendChild(script);
}
```

The injected map gives the browser everything it needs to resolve `import(specifier)`.

## Step 6: MFE Imported and Rendered

```ts
const mod = await import(specifier);
mod.render(app, { name: "Shell User" });
```

`import(specifier)` triggers a browser fetch to the URL recorded in the import map. If the JIT bundler has not yet compiled this version, it does so now. The result is cached; subsequent page loads (or other users) receive the cached bundle.

`render` mounts the MFE into the container. From this point the MFE owns its slice of the DOM.

## Deduplication Across Navigations

`injectedSpecifiers` is a module-level `Map` that persists for the lifetime of the page. When the user navigates within a single-page app and `load` is called again, `injectImportMap` skips any specifier that was already injected. Dependencies shared between the current and previous MFE are not re-added. The document head does not accumulate duplicate entries.

## Devtools Overrides

The devtools overlay allows swapping individual MFE versions without redeploying. It writes to `sessionStorage` under `platform:overrides`. On the next `load` call, `applyOverridesAndInject` reads those overrides and replaces the resolved URL for any matching specifier before injection. The browser loads the overridden version from the URL stored in sessionStorage, typically a local dev server or a staging URL.
