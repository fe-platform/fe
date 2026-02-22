---
sidebar_position: 2
---

# Your First MFE

A microfrontend in fe exports one function. Not a class, not a framework component, not a configuration object. One function: `render`. That is the entire contract the platform needs to load, mount, and clean up your code. This article walks through building one from scratch.

## What You Will Build

A standalone MFE that renders a greeting. By the end you will have a correctly named package, a working `render` export, a production build, and a live dev server with hot module replacement.

## Create the Package

All CLI commands run from the **monorepo root**. Create a new directory inside `sandbox/`:

```bash
mkdir -p sandbox/my-mfe/src
```

Create `sandbox/my-mfe/package.json`:

```json
{
  "name": "fe(@acme/my-mfe)",
  "version": "1.0.0",
  "scripts": {
    "build": "cd ../.. && fe build sandbox/my-mfe"
  },
  "devDependencies": {
    "@fe/cli": "workspace:*"
  }
}
```

The name `fe(@acme/my-mfe)` is a **bare specifier**: a package name, not a URL. This naming convention is doing real work. At build time, any other MFE that lists this name as a `devDependency` will have it marked as external, so Bun never bundles it. At runtime, the browser resolves the specifier to a URL via an injected import map. The name is the signal that makes both of those things happen without any extra configuration.

## Write the Entry Point

Create `sandbox/my-mfe/src/index.ts`:

```ts
export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("p");
  el.textContent = `Hello, ${(props.name as string) ?? "world"}!`;
  container.appendChild(el);

  return () => {
    el.remove();
  };
}
```

The return value is the **unmount function**. It removes every DOM node the MFE added. The platform calls it when navigating away or when the dev server triggers a hot reload. If your MFE sets up event listeners, timers, or subscriptions, clean them up here.

## Build

```bash
fe build sandbox/my-mfe
```

The output lands at `sandbox/my-mfe/dist/index.js`. Open it and you will find a lean ES module with no bundled dependencies, because there are none to bundle yet. That changes in the next article.

## Start the Dev Server

```bash
fe dev sandbox/my-mfe
```

The dev server builds the MFE first, then starts at `http://localhost:3000`. The page it serves is a minimal sandbox: an import map that resolves `fe(@acme/my-mfe)` to `/index.js`, and a small script that calls `render`.

Now edit `src/index.ts` and save. The file watcher detects the change, rebuilds, and sends a Server-Sent Event to the browser. The browser re-imports the module with a cache-busting timestamp, calls `unmount` on the previous instance, then calls `render` again. The page updates without a full reload.

To use a different port:

```bash
fe dev sandbox/my-mfe 3001
```

## A Note on Framework Code

Nothing in the contract prevents you from using React, Solid, Vue, or any other framework inside an MFE. The `render` function is just the entry point. The sandbox MFE at `sandbox/mfe-a` uses React, for example. The platform does not know or care — it only calls `render` and later the cleanup function you return.

**Next:** [Composing MFEs](./composing-mfes)
