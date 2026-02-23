
# @fe/runtime

Browser runtime for the fe platform — config reading, semver resolution, import map injection, and the `load()` function that orchestrates MFE mounting.

`@fe/runtime` ships inside the compiled shell. It is not a script tag you add to HTML. `fe build shell` bundles it into `app.js` as part of the shell's source.

## Public API

### `load(path)`

```ts
export async function load(
  path: string
): Promise<{ render: RenderFn; [key: string]: unknown }>
```

Resolves `path` against the embedded `platform.json` routes, walks the transitive dependency graph, injects the resolved import maps, and returns the imported MFE module.

```ts
const { render } = await load(window.location.pathname);
render(container, props);
```

Throws if `path` has no matching route, or if a dependency specifier or version is not found in the packages configuration.

### `loadDevtools()`

```ts
export async function loadDevtools(): Promise<void>
```

Reads `config.devtools`. If set, resolves and injects the devtools MFE's dependencies, creates a `<div id="__devtools__">` container, and calls the devtools `render` function. Safe to call unconditionally; returns immediately if `config.devtools` is absent.

### `resolveVersion(versions, range)`

```ts
export function resolveVersion(versions: string[], range: string): string | null
```

Picks the highest version string from `versions` that satisfies `range`. Used internally by `load` and `loadDevtools`.

### `satisfies(version, range)`

```ts
export function satisfies(version: string, range: string): boolean
```

Returns `true` if `version` satisfies `range`. Supports caret ranges (`^X.Y.Z`) and exact matches. Minimal implementation covering the ranges `fe publish` produces.

### `readOverrides()`

```ts
export function readOverrides(): Record<string, string>
```

Returns the current specifier-to-URL overrides from `sessionStorage["platform:overrides"]`. Used by the devtools overlay and by `applyOverridesAndInject` during `load`.

### `processUrlParams()`

```ts
export function processUrlParams(): void
```

Runs at module evaluation time (immediately on load). Processes `?platform:overrides=` and `?platform:clear-overrides` query parameters, merging or clearing `sessionStorage` overrides and stripping the parameters from the URL via `history.replaceState`.

## Resolution Algorithm

`resolveDeps` performs a depth-first walk of the dependency graph:

1. Start with the root specifier and its exact version.
2. Look up the `PackageVersion` entry in `config.packages`.
3. Record `specifier → url` in the resolved map.
4. For each entry in `deps`, call `resolveVersion` to pick the highest satisfying version.
5. Recurse. Skip already-resolved specifiers to avoid cycles.

The result is a flat `Map<specifier, url>` covering the root and every transitive dependency.

## Import Map Injection

`injectImportMap` appends a new `<script type="importmap">` to `document.head`. It tracks all injected specifiers in a module-level `Map`. On each call:

- Specifiers already injected are skipped (first write wins).
- Conflicting URLs for an already-mapped specifier produce a console warning.
- If no new specifiers remain after filtering, no script element is created.

This deduplication ensures that multiple navigations within a session do not accumulate redundant import map entries for shared dependencies.

## `RenderFn` Type

```ts
export type RenderFn = (
  container: HTMLElement,
  props: Record<string, unknown>
) => () => void;
```

The type of the `render` export that every MFE must provide. Used internally by `load` and `loadDevtools`; re-exported for MFE authors who want typed references to the contract.
