
# Tutorial: React MFE

Build a React microfrontend from scratch and deploy it to the fe platform. By the end of this tutorial you will have a React component running in the sandbox dev server and registered in the platform configuration.

The working reference for everything in this tutorial is `<mfe-directory>` in the repository.

## Prerequisites

- Bun installed (`bun --version` works)
- The `fe` CLI available on your PATH
- A working directory with `configs/platform.json` (see [Installation](../getting-started/installation))

## 1. Create the Package

```bash
mkdir -p mfe-counter/src
cd mfe-counter
```

Create `package.json`:

```json
{
  "name": "fe(@myorg/counter)",
  "version": "1.0.0",
  "module": "src/index.tsx",
  "types": "index.d.ts"
}
```

Install React:

```bash
bun add react react-dom
bun add -d @types/react @types/react-dom
```

## 2. Add TypeScript Config

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
```

## 3. Implement the MFE

Create `src/index.tsx`:

```tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <p>Count: {count}</p>
      <button onClick={() => setCount((n) => n + 1)}>+1</button>
    </div>
  );
}

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  container.appendChild(el);
  const root = createRoot(el);
  root.render(<Counter initial={Number(props.initial ?? 0)} />);
  return () => {
    root.unmount();
    el.remove();
  };
}
```

The `render` function appends a wrapper element to the container, creates a React root on it, and returns a cleanup function that both unmounts the React tree and removes the wrapper. React 19's `createRoot` API handles all internal teardown when `unmount()` is called.

Add the public type declaration `index.d.ts` (committed, not generated):

```ts
export declare function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void;
```

Consumers import types from this file rather than `src/index.tsx`, keeping React's JSX type requirements isolated inside the MFE.

## 4. Start the Dev Server

From the workspace root:

```bash
fe dev mfe-counter
```

Open `http://localhost:3000`. The counter renders. Change the initial count value in `src/index.tsx`, save, and the browser updates without a page reload — React unmounts cleanly, the new module loads, and `render` mounts the updated component.

## 5. Publish

When the MFE is ready:

```bash
fe publish mfe-counter
```

Check `configs/platform.json`. A new entry appears under `packages`:

```json
"fe(@myorg/counter)": {
  "versions": {
    "1.0.0": {
      "url": "/bundle/counter/1.0.0/index.tsx",
      "deps": {}
    }
  }
}
```

## 6. Activate in the Shell

Add a route in `configs/platform.json`:

```json
{
  "routes": {
    "/": "fe(@myorg/counter)@1.0.0"
  }
}
```

Build and serve:

```bash
fe build shell
fe serve
```

Open `http://localhost:3000`. The shell resolves `/` to `fe(@myorg/counter)@1.0.0`, injects the import map, and mounts your React counter. The JIT bundler compiles `index.tsx` on the first request and caches the result.

## What `@fe/compiler` Does for React

`@fe/compiler` checks whether `react-dom` appears in the MFE's `package.json`. For React MFEs, Bun's native `react-jsx` handling applies automatically, with no Babel transform needed. The compiler sets `format: "esm"`, `target: "browser"`, and passes the `fe()` dep keys as `external`. The output is a single ESM file with React bundled in and cross-MFE imports left as bare specifiers.
