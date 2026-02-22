---
sidebar_position: 1
slug: /
---

# Introduction

The browser already ships with everything needed to run independent modules: native ES modules, import maps, and dynamic `import()`. The intent behind `fe` is to build on these primitives directly, creating a microfrontend platform that feels like a natural extension of the web. Inspired by the broader web community, module federation, and [1fe](https://1fe.com/), the platform aims to keep the underlying code straightforward.

Three browser features make this possible:

1. **Native ES Modules**: Code separation at the language level, with no extra tooling required.
2. **Import Maps**: The browser resolves simple package names to URLs without a bundler in the loop.
3. **Dynamic `import()`**: Modules load on demand, exactly when needed.

## How It Works

The system runs in two stages:

- **Publish:** MFE source code is uploaded to the platform and registered in the config with its dependency declarations. No build step happens here.
- **Run:** When the browser first requests a module, the **JIT bundler** compiles it on-the-fly, caches the result, and serves it. The browser resolves cross-MFE imports using injected import maps.

Modules stay independent through development, testing, and production.

## The `fe()` Naming Convention

```ts
import { render } from "fe(@acme/mfe-a)";
```

`fe(@acme/mfe-a)` serves as the `name` in `package.json`, the `import` specifier in source code, and the lookup key in the platform registry. The `fe(` prefix is what tells the build system to keep this import external rather than bundle it.

## The Render Contract

Each MFE exports exactly one function:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The host application calls `render()` and receives an **unmount function** in return. Any framework can power the internals: React, SolidJS, Svelte, or plain DOM. The host has no knowledge of what runs inside the container.

## Next Steps

- **[Getting Started](./getting-started/installation.md)**: Install the toolchain, create a module, and link two modules together.
- **[Architecture](./architecture/overview.md)**: Read about the full system design and how modules compose at runtime.

> *Heavily influenced by and borrows concepts from the MFE architecture described at [1fe.com](https://1fe.com/).*
