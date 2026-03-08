<div align="center">
  <img src="./assets/logo.png" width="128" height="128" alt="Symbol representing independent yet connected microfrontends" />

# fe
**Ship independently. Compose natively.**
</div>

This platform is under active development. Interfaces, conventions, and package names are changing. Do not use it in production yet. Version 1.0 will be the first production-ready release, with the core user and developer stories addressed and stable.

**fe** is a source-first microfrontend platform built on native browser primitives and **TypeScript**. The intent is to provide a system where teams own their features from scaffold to production without the friction of shared build pipelines or version negotiations at deploy time.

Each team publishes raw **TypeScript source** code. The JIT server compiles it on first request. The browser resolves every `@scope/fe-name` specifier through import maps at runtime.

## Core principles

The platform makes choices that are genuinely unusual in the frontend world, and we hope to explore the benefits of these native browser capabilities together.

*   **Independent Shipping**: Teams can publish new versions without requiring changes to the shell app or other codebases.
*   **Native Composition**: The browser orchestrates the application loading. No proprietary loader is required; the system uses native **ES modules** and `import` statements.
*   **Source-First Pipeline**: Teams publish raw source code rather than bundled or compiled JavaScript. The JIT server compiles on demand, which ensures consistency and enables immutable caching.
*   **Framework Agnostic**: The platform provides a minimal interface. React, Solid, and other frameworks can be used as long as they satisfy the render contract.

## Platform components

| Component | Responsibility |
|---|---|
| **MFE Teams** | Own the lifecycle with `fe new`, `fe dev`, and `fe publish`. |
| **JIT Server** | Compiles TypeScript source on demand with `Cache-Control: immutable`. |
| **Platform Config** | A `platform.json` manifest that maps routes and versions. |
| **Browser Runtime** | Resolves the dependency graph and injects native import maps. |

## MFE specifier convention

`@scope/fe-name` is a bare specifier that works as a package name, an import key, and a manifest identifier. It is externalized during building and resolved by the browser at runtime. The `fe-` prefix in the name segment signals MFE identity; the scope is enforced by the registry.

Because MFEs are plain **ES modules**, they can export anything: functions, stores, API clients, or UI components.

```ts
import { createStore } from "@fe/fe-store";
import { Button } from "@shared/fe-ui";
```

## MFE contract

In cases where a microfrontend is registered as a route, it is expected to export a `render` function to mount into a container. You can read more about the [render contract](https://fe-frustrated.dev) in the documentation.

```ts
export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  // Mount the application into the container
  // Return a cleanup function for unmounting
}
```

## CLI quick reference

```bash
fe new <scope/name>   scaffold a new MFE
fe dev <target>       live-reload dev server
fe check <target>     typecheck + build simulation (CI)
fe publish <target>   upload source + register version
fe link <mfe> <dep>   wire a local MFE dependency
fe build shell        compile the host shell
fe serve              run the JIT server
```

## Attributions

This project uses icons from [Streamline](https://streamlinehq.com). Some icons are licensed under Creative Commons 4.0 Attribution (CC BY 4.0), while others are free to use under Streamline's free license.

---

[Full documentation](https://fe-frustrated.dev) · [CONTRIBUTING.md](./CONTRIBUTING.md)

