<div align="center">

# ⚯ fe
**Ship independently. Compose natively.**
</div>

A microfrontend platform built on native browser primitives — ES modules, import maps, and dynamic `import()`. MFEs deploy independently and compose at runtime. Nothing bundles across MFE boundaries.

## The `fe()` specifier scheme

Cross-MFE imports use the `fe(@scope/name)` package name convention:

```ts
import { render } from "fe(@acme/mfe-a)";
```

`fe(...)` is a plain package name — not a URL scheme. It is the `name` in `package.json`, a bare specifier in `import` statements, and the key in the platform's package registry. Any `fe(...)` import is immediately recognizable as a cross-MFE boundary.

At build time, `fe(...)` imports are externalized — never bundled. At runtime, the browser resolves them via injected import maps.

## MFE interface

Every MFE exports one function:

```ts
export function render(container: HTMLElement, props: Record<string, unknown>): () => void
```

The return value unmounts and cleans up. No framework required — pure DOM.

## Packages

| | |
|---|---|
| `mfe-a/` | Standalone microfrontend (`fe(@acme/mfe-a)`) |
| `mfe-b/` | Microfrontend that composes `mfe-a` (`fe(@acme/mfe-b)`) |
| `shell/` | Host app — resolves routes, injects import maps, mounts MFEs |
| `devtools/` | Developer overlay for per-tab import map overrides (`fe(@acme/devtools)`) |
| `cli/` | Build, serve, dev, link, and upload tooling |
| `sandbox/configs/platform.json` | Routes + package version registry |

## CLI

All commands run from the repo root:

| Command | What it does |
|---|---|
| `fe build <target>` | Bundle an MFE or the shell |
| `fe serve` | Serve the built shell |
| `fe dev <target>` | Isolated sandbox with hot module replacement |
| `fe link <consumer> <dep>` | Wire a `fe()` devDependency between packages |
| `fe admin upload <target>` | Publish a built artifact to the local registry |

## Developer experience

**Isolated development.** `dev` mode runs a standalone sandbox per MFE. Edit `src/` — Bun rebuilds, an SSE message triggers the browser to unmount the old render, import the new module under a cache-busting URL, and call `render()` again in the same container. No page reload. MFE authors have zero awareness of the HMR mechanism.

**Independent deployment.** `admin upload` publishes an artifact and registers it in the package registry. Activating it on a route is a separate step — anyone can upload a candidate build; only a privileged actor (CD pipeline or repo access) promotes it by editing `routes` in `sandbox/configs/platform.json`.

**Cross-ecosystem composition.** The package registry accepts full URLs alongside `fe(...)` specifiers, so MFEs hosted on external CDNs compose the same way as local packages.

## Runtime model

1. Shell HTML loads with the full platform config embedded as JSON — no static import map
2. `platform.js` reads the config and resolves the current route to a `specifier@version`
3. Transitive `fe()` deps are resolved via semver from the packages registry
4. A `<script type="importmap">` is injected covering all resolved deps
5. `import(specifier)` — the browser resolves via the injected map and mounts the MFE

Multiple import maps are injected lazily and deduped across navigations.

---

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, development workflows, and contribution guidelines.
