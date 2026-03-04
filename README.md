<div align="center">
  <img src="./assets/logo.png" width="128" height="128" alt="⚯ (UNMARRIED PARTNERSHIP SYMBOL) - representing independent yet connected microfrontends" />

# fe
**Ship independently. Compose natively.**
</div>

**fe** is a source-first microfrontend platform built on native browser primitives. It eliminates the friction of shared build pipelines and version negotiations, allowing teams to own their features from scaffold to production.

Each team publishes TypeScript source. The JIT server compiles it on first request. The browser resolves every `fe(scope/name)` specifier through import maps at runtime. No shared build pipeline. No version negotiations at deploy time.

## Why fe?

The traditional microfrontend approach often leads to "distributed monolith" hell: shared webpack configs, complex DLLs, or fragile federation rules. **fe** changes the game by leveraging **ES Modules** and **Import Maps** as its core foundation.

- 🚀 **Independent Shipping**: Publish a new version without touching the shell app or any other team's codebase.
- ⚯ **Native Composition**: The browser is the orchestrator. No proprietary loader bloat; just native `import` statements.
- 🛠️ **Source-First Pipeline**: Teams publish raw TypeScript. The JIT server compiles on demand, ensuring perfect consistency and immutable caching.
- 🏗️ **Framework Agnostic**: React, Solid, Vue, or Vanilla—if it can render into a DOM node, it works on **fe**.

## Moving parts

| Component | Responsibility |
|---|---|
| **MFE Teams** | Own the lifecycle with `fe new`, `fe dev`, and `fe publish`. |
| **JIT Server** | Compiles TypeScript source on demand with `Cache-Control: immutable`. |
| **Platform Config** | A single `platform.json` manifest that maps routes and versions. |
| **Browser Runtime** | Resolves the dependency graph and injects native import maps. |

## The `fe()` convention

`fe(scope/name)` is a bare specifier that works as a package name, an import key, and a manifest identifier. It's externalized during your local build and resolved by the browser at runtime.

```ts
// Clean, declarative dependencies
import { createStore } from "fe(acme/store)";
import { Button } from "fe(shared/ui)";
```

## MFE contract

Every MFE exports one function. Any framework works.

```ts
export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  // 1. Mount your application into the 'container'
  // 2. Return a cleanup function to unmount when navigation occurs
}
```

## CLI quick reference

```bash
fe new <scope/name>   scaffold a new MFE
fe dev <target>       live-reload dev server
fe check <target>     typecheck + build simulation (CI)
fe publish <target>   upload source + register version
fe link <mfe> <dep>   wire a local fe() dependency
fe build shell        compile the host shell
fe serve              run the JIT server
```

## Attributions

This project uses icons from [Streamline](https://streamlinehq.com). Some icons are licensed under Creative Commons 4.0 Attribution (CC BY 4.0), while others are free to use under Streamline's free license.

---

[Full documentation](https://fe.frustrated.dev) · [CONTRIBUTING.md](./CONTRIBUTING.md)

