# What fe will own

## The brains of runtime

`@fe/runtime` handles the full browser-side lifecycle:

- Reading the embedded platform config from the DOM.
- Walking the dep graph from a route or specifier to a complete set of URLs.
- Injecting import maps lazily so the browser resolves `fe(*)` specifiers.
- Merging sessionStorage overrides for per-tab development redirects.
- Preloading MFEs declaratively (via `platform.json` `preload` array) or
  imperatively (via `preload(specifierVersion)`).

## The CLI, the JIT bundler

`@fe/cli` covers the full MFE lifecycle from the command line:

- `fe new` scaffolds a new MFE project with a `render()` stub.
- `fe build` compiles for local feedback.
- `fe check` typechecks and simulates a build without writing to dist (CI use).
- `fe dev` serves a single MFE with SSE-based hot module reload.
- `fe link` wires up a local fe() dependency without publishing it.
- `fe publish` uploads raw source and registers a new version in the manifest.
- `fe serve` runs the JIT server with live compilation.

`@fe/compiler` houses the JIT bundler (`createJITBundler`) and the single-MFE
compiler (`compileMfe`). It is consumed by `fe serve`.

## Common CI/CD workflows

The recommended CI pipeline has two jobs:

```
packages job: bun run typecheck for each package in packages/*
sandbox job (after packages): typecheck + build for sandbox/* and toolkit/*
```

`fe check <target>` wraps both steps for a single package and exits non-zero on
any failure. Platform teams can use it in per-MFE CI pipelines without knowing
the internal mechanics.

## Plugin extension points

Two plugin systems let organisations extend the platform without forking it:

**CLI plugins** (`Plugin` interface) swap adapters at bootstrap time. A plugin that
stores artifacts in S3 replaces `ctx.adapters.artifactStorage`. A plugin that reads
config from an environment variable replaces `ctx.adapters.config`. Plugins may
also declare an `updatePolicy` to signal when an outdated version is dangerous.

**JIT plugins** (`JitPlugin` interface) transform `BuildOptions` before each
compilation. `@fe/jit-plugin-react` and `@fe/jit-plugin-solid` ship out of the
box. Custom plugins handle other frameworks or apply additional transforms.
