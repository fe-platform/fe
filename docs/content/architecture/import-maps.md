---
sidebar_position: 4
---

# Multiple Import Maps

How the platform uses multiple browser import maps (Chrome 133+, Safari 18.4+) for lazy dependency resolution, deduplication, and per-consumer scoping.

## What Multiple Import Maps Enable

The HTML specification originally allowed only one `<script type="importmap">` per document, and it had to appear before any module scripts. This restriction made runtime-discovered dependencies impossible: if you do not know which MFEs will load until the user navigates, you cannot pre-populate a single static map.

Chrome 133 and Safari 18.4 shipped support for multiple import maps — additional maps inserted after page load, each merged into the browser's existing resolution table. The fe platform's runtime model depends entirely on this capability.

## How the Platform Injects Maps

`@fe/runtime` calls `injectImportMap` each time it resolves a new set of dependencies:

```ts
function injectImportMap(imports: Record<string, string>): void {
  const newImports: Record<string, string> = {};
  for (const [spec, url] of Object.entries(imports)) {
    if (injectedSpecifiers.has(spec)) {
      const existing = injectedSpecifiers.get(spec)!;
      if (existing !== url) {
        console.warn(`[fe/runtime] specifier "${spec}" already mapped to ${existing}, skipping ${url}`);
      }
      continue;
    }
    newImports[spec] = url;
    injectedSpecifiers.set(spec, url);
  }

  if (Object.keys(newImports).length === 0) return;

  const script = document.createElement("script");
  script.type = "importmap";
  script.textContent = JSON.stringify({ imports: newImports });
  document.head.appendChild(script);
}
```

Two things are worth noting. First, the function only injects specifiers that have not been seen before. Once a specifier is mapped, its URL is fixed for the lifetime of the page — the first write wins. Second, if a specifier arrives with a conflicting URL, it logs a warning and skips rather than silently overwriting. This mirrors the browser's own behaviour: multiple maps merge, but a specifier already resolved in a prior map cannot be overridden.

## Lazy Injection

Maps are not injected at page load. They are injected immediately before the dynamic `import(specifier)` that needs them:

```ts
export async function load(path: string): Promise<{ render: RenderFn }> {
  const { specifier, version } = parseSpecVersion(config.routes[path]);
  const allDeps = resolveDeps(specifier, version);
  applyOverridesAndInject(allDeps);   // ← inject map here, just before import
  return import(specifier);           // ← browser resolves via the freshly injected map
}
```

This means the browser only receives URLs for packages that are actually needed on the current navigation. An MFE that is never visited never adds entries to the document's import map table.

## Deduplication Across Navigations

When the user navigates from one route to another, `load` is called again for the new route. If the new MFE shares dependencies with the previous one — a common scenario when a shared utility MFE is used by several routes — `injectImportMap` detects that those specifiers are already in `injectedSpecifiers` and skips them. No duplicate `<script type="importmap">` elements accumulate in the document head for shared dependencies.

## Browser Support

| Browser | Multiple Import Maps | Ships since |
|---------|---------------------|-------------|
| Chrome | Native | 133 (Feb 2025) |
| Edge | Native | 133 (Feb 2025) |
| Safari | Native | 18.4 (Mar 2025) |
| Firefox | Polyfill needed | — |

For Firefox, [es-module-shims](https://github.com/guybedford/es-module-shims) v2.4+ provides the multiple-map behaviour. See [Browser Support](../advanced/browser-support) for polyfill setup details.
