
# Tutorial: Host App

Build a host application that resolves routes, injects import maps, and mounts MFEs. By the end of this tutorial you will have a working shell that loads any registered MFE for the current route.

The working reference for everything in this tutorial is `<shell-directory>` in the repository.

## Prerequisites

- At least one published MFE in `configs/platform.json`. Follow the [React MFE tutorial](./react-mfe) first if you need one.
- Bun installed
- The `fe` CLI available on your PATH

## 1. Create the Shell Package

```bash
mkdir -p shell/src
cd shell
bun add @fe/runtime
```

Create `package.json`:

```json
{
  "name": "shell",
  "version": "1.0.0",
  "module": "src/index.ts"
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
```

## 2. Write the HTML Template

Create `index.html`. The comment `<!-- __PLATFORM_CONFIG__ -->` is a build-time placeholder. `fe build shell` replaces it with the embedded platform config. Leave it exactly as written:

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

There is no import map in this template. The runtime injects import maps at runtime, just before each `import()` call.

## 3. Write the Entry Point

Create `src/index.ts`:

```ts
import { load, loadDevtools } from "@fe/runtime";

const app = document.getElementById("app")!;

await loadDevtools();

const { render } = await load(window.location.pathname);
render(app, {});
```

`loadDevtools()` is a no-op if `config.devtools` is not set. Call it unconditionally; it is safe in production.

`load(path)` reads the embedded config, resolves the route, injects import maps for all transitive dependencies, and returns the MFE module. Call `render` with your container element and any props the MFE should receive.

## 4. Wire Up the Config

`fe build shell` needs to know where the shell directory is. Set `shellDir` in `configs/fe.config.json` (relative to the workspace root):

```json
{
  "shellDir": "shell"
}
```

The default is `"shell"`, so this step is only necessary if your directory has a different name.

## 5. Build the Shell

```bash
fe build shell
```

This command:

1. Bundles `shell/src/index.ts` into `shell/dist/app.js`.
2. Reads `configs/platform.json`.
3. Inlines the full config as `<script id="__platform__" type="application/json">` in `shell/dist/index.html`.

Inspect `shell/dist/index.html`. The full platform config JSON is embedded in the `<head>`.

## 6. Serve

```bash
fe serve
```

Open `http://localhost:3000`. The shell loads, `app.js` calls `load("/")`, the runtime resolves the route from the embedded config, injects an import map, and mounts the MFE. The JIT bundler handles compilation on first request.

## 7. Add More Routes

Add MFEs to `configs/platform.json` routes:

```json
{
  "routes": {
    "/": "fe(@myorg/counter)@1.0.0",
    "/greeting": "fe(@myorg/greeting)@1.0.0"
  }
}
```

Rebuild the shell to embed the updated config:

```bash
fe build shell
fe serve
```

Navigate to `http://localhost:3000/greeting` and the greeting MFE loads. The counter MFE's import map entries from the previous navigation remain in the document head. They are deduped by the runtime on any subsequent visit to `/`.

## Multi-Page Routing

The shell's `load(window.location.pathname)` is a single call. Routing between pages is a full navigation (`location.href = "/new-path"`) that reloads the shell. The platform config is re-read from the embedded script on each load, and import maps are rebuilt for the new route.

For client-side routing without full page reloads, call `load(newPath)` on navigation events and manage the MFE lifecycle (unmount previous, mount new) manually in `src/index.ts`.
