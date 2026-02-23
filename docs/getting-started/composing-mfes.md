
# Composing MFEs

The fe() naming convention pays off here. Two MFEs that have never shared a `package.json`, a `node_modules`, or a workspace can depend on each other at runtime purely through import maps. This article shows how to wire that connection, set up a shell, and serve the result.

## Prerequisites

Complete [Your First MFE](./your-first-mfe) first. `mfe-hello` should be published and recorded in `configs/platform.json`.

## Create a Second MFE

Create `mfe-world/` as an independent package:

```bash
mkdir -p mfe-world/src
```

Create `mfe-world/package.json`:

```json
{
  "name": "fe(@myorg/world)",
  "version": "1.0.0"
}
```

## Wire the Local Development Dependency

To import from `fe(@myorg/hello)` during development, TypeScript needs to resolve the specifier. `fe link` creates that local resolution without making the packages structurally dependent on each other:

```bash
bunx fe link mfe-world mfe-hello
```

This adds `"fe(@myorg/hello)": "file:../mfe-hello"` to `mfe-world`'s `devDependencies` and runs `bun install` inside `mfe-world/`. The result is a symlink at `mfe-world/node_modules/fe(@myorg/hello)` that TypeScript follows. It is a local development convenience. The packages remain independent: `mfe-world` does not bundle `mfe-hello`, does not share its `node_modules`, and does not need to know where `mfe-hello` lives in production. At runtime the browser uses an import map, not this symlink.

## Import the Dependency

Create `mfe-world/src/index.ts`:

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

The bare specifier `fe(@myorg/hello)` passes through the build untouched. The output bundle imports from the specifier as written; no source from `mfe-hello` is copied into it.

## Publish the Second MFE

```bash
bunx fe publish mfe-world
```

`fe publish` resolves the `fe(...)` entries in `mfe-world`'s `devDependencies`, records them as semver ranges in the `deps` field of the manifest entry, and registers the full package in `configs/platform.json`. After this, `platform.json` knows that `fe(@myorg/world)@1.0.0` depends on `fe(@myorg/hello)` at `^1.0.0`.

## Set Up the Shell

The shell is a standalone web application. Create it as its own independent package:

```bash
mkdir -p shell/src
cd shell && bun add @fe/runtime && cd ..
```

Create `shell/index.html`. The `<!-- __PLATFORM_CONFIG__ -->` comment is replaced by `fe build shell` with the embedded platform config. Leave it exactly as written:

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

`load` reads the embedded platform config, resolves the current path to a specifier and version, walks the dependency graph, injects import maps for every resolved package, and returns the MFE module. The shell's only job is to call `render` on the right container.

## Activate a Route

Open `configs/platform.json` and add a route. The value is `specifier@version`, matching what `fe publish` registered:

```json
{
  "routes": {
    "/": "fe(@myorg/world)@1.0.0"
  },
  "packages": { "..." }
}
```

The `packages` section was written by `fe publish`. The `routes` section is yours to manage.

## Build and Serve

```bash
bunx fe build shell
bunx fe serve
```

`bunx fe build shell` bundles `shell/src/index.ts` into `shell/dist/app.js`, reads `configs/platform.json`, and inlines the full config into `shell/dist/index.html`.

`bunx fe serve` starts at `http://localhost:3000`, serving `shell/dist/` and the JIT bundler at `/bundle/`. Open the browser and watch the network tab. The runtime resolves `/` to `fe(@myorg/world)@1.0.0`, traces its dependency on `fe(@myorg/hello)`, injects two import maps, and imports `mfe-world`. The browser fetches `mfe-hello` at the moment `mfe-world`'s import executes — not before.

Look back at what you wrote. There is no shared `package.json` between the two MFEs. No shared `node_modules`. No build plugin stitching them together. The only thing that connected them was a single line in `configs/platform.json`.

To use a different port:

```bash
bunx fe serve 8080
```

**Next:** [Architecture Overview](../architecture/overview)
