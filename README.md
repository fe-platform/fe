<div align="center">
  <img src="./assets/logo.png" width="128" height="128" alt="⚯ (UNMARRIED PARTNERSHIP SYMBOL) - representing independent yet connected microfrontends" />

# fe
**Ship independently. Compose natively.**
</div>

A microfrontend platform built on native browser primitives. Each team publishes TypeScript source. The JIT server compiles it on first request. The browser resolves every `fe(scope/name)` specifier through import maps at runtime. No shared build pipeline. No version negotiations at deploy time.

## How it works

| | |
|---|---|
| **MFE teams** | `fe new` · `fe dev` · `fe publish` — full lifecycle, no platform knowledge required |
| **JIT server** | `fe serve` compiles source on demand, serves with `Cache-Control: immutable` |
| **Platform config** | `platform.json` maps routes to `specifier@version` and versions to artifact URLs |
| **Browser runtime** | `@fe/runtime` resolves the dep graph, injects import maps, calls `render()` |

## The `fe()` convention

`fe(scope/name)` is a plain package name — the `name` in `package.json`, a bare specifier in imports, and the key in the platform registry. At build time it is externalized. At runtime the browser resolves it via an injected import map.

```ts
import { createStore } from "fe(acme/store)";
```

## MFE contract

Every MFE exports one function. Any framework works.

```ts
export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void
```

The return value unmounts and cleans up. The host never knows what rendered into the container.

## CLI

```
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
