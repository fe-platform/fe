---
sidebar_position: 2
---

# Your First MFE

An MFE in fe exports one function: `render`. The platform calls it to mount your code and calls the value it returns to unmount. That is the full surface area of the contract between the platform and every MFE that runs on it.

## Create the Package

From your workspace root, create a directory for the MFE:

```bash
mkdir -p mfe-hello/src
```

Create `mfe-hello/package.json`:

```json
{
  "name": "fe(@myorg/hello)",
  "version": "1.0.0"
}
```

Replace `@myorg` with your organisation's npm scope. The `fe(...)` wrapper is a **bare specifier**: the exact string that will appear in import statements, and the identifier the browser resolves via an import map at runtime. It is not a URL scheme. It is a naming convention, and that convention is how the build system knows to keep this package external rather than bundle it.

Run `bun install` from the workspace root to register the new package:

```bash
bun install
```

## Write the Render Function

Create `mfe-hello/src/index.ts`:

```ts
export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  container.appendChild(el);

  return () => {
    el.remove();
  };
}
```

`render` receives an `HTMLElement` and a props object. It returns the **unmount function**, which removes everything the MFE added to the DOM. The platform calls unmount before every hot reload and before navigating away from the route. An MFE that skips cleanup will accumulate stale DOM nodes; one that cleans up thoroughly composes correctly.

What you render inside is your choice. The platform has no opinion about framework, styling, or state management.

## Run the Dev Server

`fe dev` builds the MFE and serves it in an isolated sandbox page, with no shell or registry required:

```bash
fe dev mfe-hello
```

Open `http://localhost:3000`. The sandbox injects a minimal import map that resolves `fe(@myorg/hello)` to the local build, then calls your `render` function. Edit `src/index.ts` and save: the server rebuilds, sends a reload signal over a Server-Sent Event connection, the browser unmounts the previous instance and calls `render` again with the updated module.

To use a different port:

```bash
fe dev mfe-hello 4000
```

**Next:** [Composing MFEs](./composing-mfes)
