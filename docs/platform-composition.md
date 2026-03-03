# What your MFE platform will be made of

## Configs, infra and security

The platform manifest (`platform.json`) is the authoritative registry of packages
and routes. It maps URL paths to `specifier@version` strings, and maps each
specifier to the concrete URLs where compiled artifacts live.

A production deployment adds a CDN in front of the JIT server with immutable
caching headers. The first request compiles a given MFE version; every subsequent
request hits the CDN. MFE URLs are content-addressed by version, so cache
invalidation is a non-issue.

Content Security Policy requires `script-src` to allow the CDN origin and
`'wasm-unsafe-eval'` if any MFE uses WebAssembly. Import maps require no special
CSP directives beyond `script-src`.

## Your runtime / shell

The shell is a standard HTML file that embeds the platform config as a JSON
script tag. It loads `@fe/runtime` and calls two functions on startup:

```ts
import { load, loadDevtools } from "@fe/runtime";

await loadDevtools();
await load(location.pathname);
```

`loadDevtools()` mounts the developer overlay if `platform.json` has a `devtools`
key. `load(path)` resolves the route, injects the import map, and mounts the MFE.

## Your MFE teams

Each MFE team owns a directory (or a separate repository) with:

- `package.json` — declares the `fe()` package name, version, and a `"fe"` config
  key listing any JIT plugins the MFE needs.
- `tsconfig.json` — standard strict TypeScript config.
- `src/index.ts` — exports `render(container, props): () => void`.

Teams run `fe publish` to deploy. The CLI uploads raw source and registers the
new version in `platform.json`. No build step, no bundler config.

## Your common tooling

The `toolkit/` directory in this monorepo holds zero-dependency shared primitives:

- `fe(acme/store)` — framework-agnostic cross-MFE state (pub/sub store).
- `fe(acme/network)` — shared fetch with request deduplication, caching, and
  interceptor hooks.
- `fe(acme/devtools)` — developer overlay for managing import map overrides.

Toolkit packages are deployed like any other MFE: `fe admin upload toolkit/<name>`.
They are consumed as `fe()` devDependencies and resolved via import map at runtime.
