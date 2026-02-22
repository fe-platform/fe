---
sidebar_position: 3
---

# Composing MFEs

Two separately deployed MFEs, one depending on the other, with no bundler crossing the boundary between them. This article builds on the package from the previous article and walks through wiring a second MFE, setting up a shell, publishing both, and serving the result.

## Prerequisites

Complete [Your First MFE](./your-first-mfe) first. The `mfe-hello` package should already exist in your workspace.

## Create the Registry

The manifest at `configs/platform.json` records which package versions exist and which one each route should load. Create it before running any publish commands:

```bash
mkdir configs
```

Create `configs/platform.json`:

```json
{
  "routes": {},
  "packages": {}
}
```

This file is the only persistent state the platform maintains locally. `fe publish` writes to the `packages` section automatically; you write to `routes` by hand.

## Add a Second MFE

Create `mfe-world/package.json`:

```json
{
  "name": "fe(@myorg/world)",
  "version": "1.0.0"
}
```

Wire the dependency from `mfe-world` to `mfe-hello`:

```bash
fe link mfe-world mfe-hello
```

`fe link` adds `"fe(@myorg/hello)": "file:../mfe-hello"` to `mfe-world`'s `devDependencies` and runs `bun install` inside `mfe-world`. The result is a symlink at `mfe-world/node_modules/fe(@myorg/hello)` that TypeScript follows for type resolution — no `tsconfig.paths` required.

The dependency is in `devDependencies` on purpose. It is a build-time signal: when the CLI builds `mfe-world`, it reads all `fe(...)` keys from `devDependencies`, marks them as external in the Bun build, and leaves the bare specifier in the output bundle untouched. The browser resolves it via an import map at load time.

## Import the Dependency

Create `mfe-world/src/index.ts`. Import from the bare specifier exactly as you would from any module:

```ts
import { render as renderHello } from "fe(@myorg/hello)";

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  container.appendChild(el);

  const unmountHello = renderHello(el, props);

  return () => {
    unmountHello();
    el.remove();
  };
}
```

After building, the output bundle will still contain `import { render as renderHello } from "fe(@myorg/hello)"` as a literal bare specifier. No copy of `mfe-hello`'s source appears inside it.

## Set Up the Shell

The shell is a plain web application that loads `@fe/runtime` and calls `load(path)`. Create the directory:

```bash
mkdir -p shell/src
```

Create `shell/package.json`:

```json
{
  "name": "shell",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@fe/runtime": "latest"
  }
}
```

Create `shell/index.html`. The `<!-- __PLATFORM_CONFIG__ -->` placeholder is replaced by `fe build shell` with the embedded platform config — leave it exactly as written:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My App</title>
  <!-- __PLATFORM_CONFIG__ -->
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

Create `shell/src/index.ts`:

```ts
import { load } from "@fe/runtime";

const app = document.getElementById("app")!;
const { render } = await load(window.location.pathname);
render(app, {});
```

`load` reads the embedded platform config, resolves the current path to a specifier and version, walks the dependency graph, injects import maps for all resolved packages, and returns the MFE module. The shell calls `render`; the runtime handles everything in between.

Register the new packages:

```bash
bun install
```

## Publish Both MFEs

`fe publish` pre-flight type-checks the source, uploads it to the local registry, and records the package entry in `configs/platform.json`:

```bash
fe publish mfe-hello
fe publish mfe-world
```

The registered URL points to the JIT bundler route (`/bundle/<slug>/<version>/index.ts`). On the first browser request for that module, the server compiles it on demand and caches the result. There is no separate build step for MFEs in this flow.

## Activate a Route

Open `configs/platform.json` and point a route at `mfe-world`. The value is `specifier@version`, matching what `fe publish` registered:

```json
{
  "routes": {
    "/": "fe(@myorg/world)@1.0.0"
  },
  "packages": { "..." }
}
```

## Build and Serve

```bash
fe build shell
fe serve
```

`fe build shell` bundles `shell/src/index.ts` into `shell/dist/app.js`, reads `configs/platform.json`, inlines the full config into `shell/dist/index.html` as an embedded JSON script, and writes the final HTML.

`fe serve` starts a server at `http://localhost:3000` that serves `shell/dist/`, the uploads directory, and the JIT bundler at `/bundle/`. Open the URL: the runtime resolves `/` to `fe(@myorg/world)@1.0.0`, traces its dependency on `fe(@myorg/hello)`, injects two import maps, and imports `mfe-world`. The browser fetches `mfe-hello` at the exact moment `mfe-world` imports it — not before.

To use a different port:

```bash
fe serve 8080
```

**Next:** [Architecture Overview](../architecture/overview)
