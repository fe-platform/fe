---
sidebar_position: 2
---

# Tutorial: SolidJS MFE

Build a SolidJS microfrontend from scratch and deploy it to the fe platform. By the end of this tutorial you will have a reactive SolidJS component running in the sandbox dev server and registered in the platform registry.

The working reference for everything in this tutorial is `sandbox/mfe-b` in the repository.

## Prerequisites

- Bun installed
- The `fe` CLI available on your PATH
- A working directory with `configs/platform.json` (see [Installation](../getting-started/installation))

## 1. Create the Package

```bash
mkdir -p mfe-greeting/src
cd mfe-greeting
```

Create `package.json`:

```json
{
  "name": "fe(@myorg/greeting)",
  "version": "1.0.0",
  "module": "src/index.tsx",
  "types": "index.d.ts"
}
```

Install Solid:

```bash
bun add solid-js
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
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
```

`jsx: "preserve"` with `jsxImportSource: "solid-js"` configures TypeScript to check JSX against Solid's types. Actual JSX compilation is handled by `@fe/compiler` at build time using a Babel-based transform.

## 3. Implement the MFE

Create `src/index.tsx`:

```tsx
import { createSignal } from "solid-js";
import { render as solidRender } from "solid-js/web";

function Greeting(props: { name?: string }) {
  const [expanded, setExpanded] = createSignal(false);
  return (
    <div style={{ "font-family": "sans-serif", padding: "1rem" }}>
      <p>Hello, {props.name ?? "world"}!</p>
      <button onClick={() => setExpanded((v) => !v)}>
        {expanded() ? "Less" : "More"}
      </button>
      {expanded() && <p>Solid renders this reactively.</p>}
    </div>
  );
}

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  return solidRender(
    () => <Greeting name={props.name as string | undefined} />,
    container
  );
}
```

Solid's `render` function returns a dispose function that cleans up the reactive graph and removes DOM nodes. Returning it directly satisfies the MFE interface.

Add `index.d.ts`:

```ts
export declare function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void;
```

## 4. Start the Dev Server

```bash
fe dev mfe-greeting
```

Open `http://localhost:3000`. Edit `src/index.tsx` and save. The dev server rebuilds and the browser applies the module swap. Solid's fine-grained reactivity and the platform's unmount/remount cycle coexist without conflict.

## 5. Publish

```bash
fe publish mfe-greeting
```

`@fe/compiler` detects `solid-js` in `package.json` and applies the Babel-based JSX transform automatically.

## 6. Activate in the Shell

```json
{
  "routes": {
    "/": "fe(@myorg/greeting)@1.0.0"
  }
}
```

```bash
fe build shell
fe serve
```

## How `@fe/compiler` Handles SolidJS

Bun's native JSX support does not correctly handle Solid's JSX transform — the `jsxImportSource` and custom factory options Solid requires are not fully supported by Bun v1.x. `@fe/compiler` detects `solid-js` in `package.json` and enables `bun-plugin-solid`, a Babel-based plugin that applies `babel-preset-solid` before handing the result to Bun. This is transparent to the MFE author: the `fe publish` and `fe dev` flows are identical to a React MFE.
