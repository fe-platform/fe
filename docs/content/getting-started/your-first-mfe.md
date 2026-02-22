---
sidebar_position: 2
---

# Your First MFE

An MFE in fe exports one function: `render`. The platform calls it to mount your code and calls the value it returns to unmount. That is the complete contract.

## Create the Package

From your working directory, create a folder for the MFE:

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

Replace `@myorg` with your organisation's npm scope. The name is a **bare specifier**: the exact string that will appear in `import` statements and that the browser resolves via an import map. The `fe(...)` wrapper is the convention that tells the build system to keep this package external rather than bundle it into whatever imports it.

This package has no dependencies yet, so no `bun install` is needed at this point. When you add framework packages later, you will run `bun install` inside `mfe-hello/` the same as any other standalone project.

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

`render` receives the container element and a props object. It returns the **unmount function**, which removes everything the MFE added to the DOM. The platform calls unmount before every hot reload and before navigating away. What you render inside is your decision: any framework, any DOM approach, any styling strategy all satisfy the contract as long as the cleanup function is thorough.

## Preview with the Dev Server

`bunx fe dev` builds the MFE and serves it in an isolated sandbox page:

```bash
bunx fe dev mfe-hello
```

Open `http://localhost:3000`. The sandbox injects a minimal import map that resolves `fe(@myorg/hello)` to the local build, then calls your `render` function on a container element. There is no host application, no shell, no shared workspace. This is the MFE running entirely on its own.

Edit `src/index.ts` and save: the server rebuilds, sends a reload signal over a Server-Sent Event connection, the browser unmounts the previous instance, and calls `render` again with the updated module.

To use a different port:

```bash
bunx fe dev mfe-hello 4000
```

## Register the Package

When the MFE is ready to ship, register it:

```bash
bunx fe publish mfe-hello
```

`fe publish` pre-flight type-checks the source, uploads it to the local `sources/` directory, and writes the package entry into `configs/platform.json`. The registered URL points to the JIT bundler (`/bundle/mfe-hello/1.0.0/index.ts`), which compiles the source on the first request and caches the result.

After this step, `mfe-hello` exists in the registry as an independent, versioned artifact. How and where it appears is a separate concern — covered in the next article.

**Next:** [Composing MFEs](./composing-mfes)
