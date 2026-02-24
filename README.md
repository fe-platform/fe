<div align="center">
  <img src="./assets/logo.png" width="128" height="128" alt="⚯ (UNMARRIED PARTNERSHIP SYMBOL) - representing independent yet connected microfrontends" />

# fe
**Ship independently. Compose natively.**
</div>

A microfrontend platform built on native browser primitives — ES modules, import maps, and dynamic `import()`. MFEs deploy independently and compose at runtime. Nothing bundles across MFE boundaries.

## Mental Model

At its core, `fe` embraces the browser rather than fighting it. The platform rejects the complexity of distributed bundling in favor of native ES modules and import maps.

1. **Convention over Configuration**: The `fe(@scope/name)` specifier is the universal contract. It's a package name, a bare import specifier, and a registry key.
2. **Build-Time Externalization**: Any `fe()` import is automatically externalized by the bundler. MFEs are built in true isolation.
3. **Just-In-Time Compilation**: Source code is published to the registry and compiled on-demand at the edge.
4. **Lazy Resolution**: The browser runtime dynamically resolves dependencies, dedupes versions, and injects import maps exactly when needed.

## The `fe()` specifier scheme

Cross-MFE imports use the `fe(@scope/name)` package name convention:

```ts
import { render } from "fe(@acme/mfe-a)";
```

`fe(...)` is a plain package name — not a URL scheme. It is the `name` in `package.json`, a bare specifier in `import` statements, and the key in the platform's lookup service. Any `fe(...)` import is immediately recognizable as a cross-MFE boundary.

At build time, `fe(...)` imports are externalized — never bundled. At runtime, the browser resolves them via injected import maps.

## MFE interface

Every MFE exports one function:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The return value unmounts and cleans up. Any framework is supported — React, SolidJS, Svelte, or plain DOM. The contract is framework-agnostic; the host never knows what rendered into the container.

## Packages

| | |
|---|---|
| `packages/core/` | Shared types and interfaces (`@fe/core`) |
| `packages/runtime/` | Browser runtime — import map injection, semver resolution (`@fe/runtime`) |
| `packages/compiler/` | Framework-aware MFE bundler + JIT bundler (`@fe/compiler`) |
| `packages/cli/` | `fe` binary — build, serve, dev, link, publish, check (`@fe/cli`) |
| `sandbox/mfe-a/` | React MFE (`fe(@acme/mfe-a)`) |
| `sandbox/mfe-b/` | SolidJS MFE that composes mfe-a (`fe(@acme/mfe-b)`) |
| `sandbox/host-app/` | Host app — resolves routes, injects import maps, mounts MFEs |
| `toolkit/devtools/` | Developer overlay for per-tab import map overrides (`fe(@acme/devtools)`) |
| `sandbox/configs/platform.json` | Routes + package version registry |
| `sandbox/configs/fe.config.json` | CLI config — plugins, artifact paths, shell directory |

## CLI

All commands run from the repo root:

| Command | What it does |
|---|---|
| `fe build <target>` | Bundle an MFE or the shell |
| `fe serve` | Serve the built shell |
| `fe dev <target>` | Isolated sandbox with hot module replacement |
| `fe link <consumer> <dep>` | Wire a `fe()` devDependency between packages |
| `fe publish <target>` | Publish MFE source code for JIT compilation |

## Developer experience

**Isolated development.** `dev` mode runs a standalone sandbox per MFE. Edit `src/` — Bun rebuilds, an SSE message triggers the browser to unmount the old render, import the new module under a cache-busting URL, and call `render()` again in the same container. No page reload. MFE authors have zero awareness of the HMR mechanism.

**Independent deployment (JIT compilation).** `publish` runs a pre-flight typecheck, uploads the raw source code of an MFE, and registers its bundle URL in the CDN configuration. The system uses a **Just-In-Time (JIT) bundler** that compiles the source code on-the-fly when the browser first requests it, caching the result.

**Cross-ecosystem composition.** The CDN lookup process accepts full URLs alongside `fe(...)` specifiers, so MFEs hosted on external CDNs compose the same way as local packages. The JIT bundler can be pushed to edge CDNs for production scale.

## Runtime model

1. Shell HTML loads with the full platform config embedded as JSON — no static import map
2. `platform.js` reads the config and resolves the current route to a `specifier@version`
3. Transitive `fe()` deps are resolved via semver from the packages registry
4. A `<script type="importmap">` is injected covering all resolved deps
5. `import(specifier)` — the browser resolves via the injected map and mounts the MFE

Multiple import maps are injected lazily and deduped across navigations.

## Attributions

This project uses icons from [Streamline](https://streamlinehq.com). Some icons are licensed under Creative Commons 4.0 Attribution (CC BY 4.0), while others are free to use under Streamline's free license. See the [@fe/icons package](./meta/icons/) for detailed licensing information.

---

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, development workflows, and contribution guidelines.
