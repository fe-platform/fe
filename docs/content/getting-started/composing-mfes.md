---
sidebar_position: 3
---

# Composing MFEs

Two MFEs. One depends on the other. No shared bundle, no shared runtime state injected by a framework, no magic. Just a bare specifier that the browser resolves at import time. This article shows the whole chain from wiring the dependency to seeing both MFEs run together in the shell.

## Prerequisites

This article uses the sandbox MFEs. Make sure you have completed [Installation](./installation) and that the workspace is bootstrapped with `bun install`.

## Wire the Dependency

Run from the **monorepo root**:

```bash
fe link sandbox/mfe-b sandbox/mfe-a
```

`fe link` writes the `fe()` dependency into `mfe-b`'s `devDependencies` and runs `bun install` in `sandbox/mfe-b`. After it finishes, `mfe-b/package.json` contains:

```json
"devDependencies": {
  "fe(@acme/mfe-a)": "file:../mfe-a"
}
```

The `file:` URI is a local symlink that Bun creates at `node_modules/fe(@acme/mfe-a)` inside `mfe-b`. TypeScript can now resolve the import without any `tsconfig.paths` configuration. The dependency goes into `devDependencies` on purpose: it is a build-time signal to the externalization step, not a bundling instruction. The build will mark it as external. The browser will fill it in at runtime via an import map.

## Import and Use

In `sandbox/mfe-b/src/index.tsx` (or `index.ts`), import from the bare specifier:

```ts
import { render as renderA } from "fe(@acme/mfe-a)";

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const wrapper = document.createElement("div");
  container.appendChild(wrapper);

  const unmountA = renderA(wrapper, props);

  return () => {
    unmountA();
    wrapper.remove();
  };
}
```

The specifier `fe(@acme/mfe-a)` passes through the Bun build untouched. Check `sandbox/mfe-b/dist/index.js` after building and you will find it still there as a bare import, with no copy of `mfe-a`'s source bundled alongside it.

## Build Both MFEs

```bash
fe build sandbox/mfe-a
fe build sandbox/mfe-b
```

Build order matters here: `mfe-a` must be built before it can be uploaded and referenced by `mfe-b`'s dependency resolution in the next step.

## Upload to the Package Registry

```bash
fe admin upload sandbox/mfe-a
fe admin upload sandbox/mfe-b
```

`fe admin upload` copies each `dist/` directory to the uploads folder and registers the package, its version, and its `fe()` dependencies in `sandbox/configs/platform.json`. You do not edit `platform.json` by hand at this step. The upload command writes the `packages` section; you control only the `routes` section.

## Activate a Route

Open `sandbox/configs/platform.json` and point a route at `mfe-b`:

```json
{
  "routes": {
    "/": "fe(@acme/mfe-b)@1.0.0"
  },
  "packages": { "..." }
}
```

The runtime will see that `/` resolves to `fe(@acme/mfe-b)@1.0.0`, look up its dependencies in the `packages` section, find `fe(@acme/mfe-a)`, and inject import maps for both before importing either.

## Build the Shell and Serve

```bash
fe build shell
fe serve
```

Open `http://localhost:3000`. The shell loads, `@fe/runtime` resolves the route, walks the dependency graph from `platform.json`, injects two import maps, and then imports `mfe-b`. The browser fetches `mfe-a` only at the moment `mfe-b` imports it — not before. Each MFE is its own network request, its own module scope, its own bundle.

That is composition without a bundler crossing the boundary.

**Next:** [Architecture Overview](../architecture/overview)
