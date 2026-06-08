# Future Feature Hypotheses

What follows is a catalogue of partially built or planned features that exist in the
codebase as scaffolding but are not yet exercised by real use. Each entry describes
the *problem* the feature was meant to solve, the *current implementation* state,
and the *conditions* under which the feature becomes valuable.

The intent is to keep these hypotheses visible so we can rebuild them deliberately
when the need arises, rather than carrying dead code in the meantime.

---

## 1. External CLI Plugins

### Problem

Organisations need to customise the `fe` CLI for their infrastructure -- swap local
file storage for S3, register deployments in an internal API, or add CI-specific
commands. Without a plugin system, every fork of the platform must patch `@fe/cli`
internals.

### Current implementation

The `Plugin` interface (`@fe/core/plugin.ts`) and `plugin-loader.ts` support dynamic
`import()` of npm packages listed in `fe.config.json["plugins"]`. Each plugin can
swap any `ctx.adapters.*` implementation and register new commands. The `updatePolicy`
field optionally enforces version freshness by checking the npm registry.

### What's missing

- Zero external plugins exist in the codebase or are known to be in use.
- The `updatePolicy` machinery (npm registry fetch, semver comparison) is untested.
- The `Hooks` class exposes lifecycle events (`build:before`, `publish:after`, etc.)
  that plugins could listen to, but no listener has ever been registered externally.
- No documentation or published example plugin exists.

### Triggers to build this for real

- A second team adopts `fe` and needs S3-backed source storage.
- An organisation wants to enforce a deployment approval gate between
  `publish:before` and `publish:register:before`.
- A CI pipeline needs a custom `fe ci` command that reports bundle stats.

---

## 2. Per-Project CLI Config (Standalone MFE Mode)

### Problem

The default CLI config (`fe.config.json` at the monorepo root) assumes a monorepo
topology. An MFE team working out of a single-package repository cannot run `fe`
commands without creating the monorepo config structure.

### Current implementation

`package-json-config-provider.ts` reads the `"fe"` key from the MFE's own
`package.json`, making the MFE self-describing:
```json
{
  "name": "@conqueso/fe-my-mfe",
  "fe": { "jitPlugins": ["@fe/jit-plugin-react"] }
}
```

### What's missing

- Not imported or wired anywhere. A plugin (external or builtin) would need to
  call `ctx.adapters.config = createPackageJsonConfigProvider(ctx.root)`.
- No unit test or integration test exists.
- The `fe new` scaffold generates a `"fe"` key in `package.json` but it is empty.

### Triggers to build this for real

- An MFE team wants to develop and publish independently without cloning the full
  monorepo.
- A single-package CI pipeline needs `fe check` to work without a shared config.

---

## 3. JIT Plugin: React

### Problem

The JIT bundler (`@fe/compiler`) needs framework-specific build plugins to compile
JSX and other framework transforms. Solid.js requires `bun-plugin-solid`. React
requires... nothing, because Bun handles `"jsx": "react-jsx"` natively.

### Current implementation

`@fe/jit-plugin-react` exists as a no-op package that mirrors
`@fe/jit-plugin-solid`. Its `transform()` returns options unchanged. It is listed
in documentation and CI as a peer to the Solid plugin.

### What's missing

- No actual transform logic. The package is a placeholder.
- If a future React version or a specific React setup requires a Bun build plugin,
  this package would be the place to add it.

### Triggers to build this for real

- A future React version ships JSX transforms that require a Bun plugin.
- An organisation uses a React meta-framework that injects compile-time transforms.
- The platform adopts a convention where *every* framework must have an explicit
  JIT plugin (no implicit auto-detection), and React needs a real plugin to match.

---

## 4. Pre-Built Artifact Deploy Path (Legacy / Admin)

### Problem

The source-first JIT model requires the server to compile TypeScript on demand.
Some MFEs may bundle framework code (like Solid.js) or use compile-to-JS languages
that the JIT server does not support. These MFEs need a pre-built artifact path.

### Current implementation

`fe admin upload <target>` builds and uploads pre-compiled `dist/` artifacts, then
registers them in `platform.json` under the `"packages"` key. The JIT server's
`/bundle/*` routes coexist with the `/uploads/*` artifact routes. `fe serve` serves
both.

### What's missing

- The `fe publish` command (source-first) and `fe admin upload` (artifact) do the
  same registration work but diverge in their pre-flight and storage logic.
- Only `@fe/fe-devtools` uses the artifact path today, and only because the sandbox
  lacks a `jitPlugins` config for Solid.js.
- No documentation explains when to choose one path over the other.

### Triggers to build this for real

- An MFE bundles a framework that the JIT server cannot compile (e.g. Svelte,
  Angular, or a WASM-compiled library).
- The platform is deployed to an environment where the JIT server is unavailable
  (static hosting like S3 + CloudFront).
- A team wants to ship a fully optimised production bundle with code splitting.

---

## 5. MFE Scaffolding (`fe new`)

### Problem

Starting a new MFE requires creating the directory structure, `package.json`,
`tsconfig.json`, and a `render()` stub. This is a one-time cost per MFE but
creates friction for new teams.

### Current implementation

`fe new <scope/name>` creates a directory with a minimal MFE skeleton:
- `package.json` with `@scope/fe-<name>` specifier, `build` and `check` scripts
- `tsconfig.json` (strict, ESNext, bundler resolution)
- `src/index.ts` with a `render()` stub

### What's missing

- The `"fe"` config key in the generated `package.json` is empty (`"plugins": [],
  "jitPlugins": []`).
- No interactive prompts (framework choice, CSS approach, etc.).
- No `README.md` or `AGENTS.md` generated.
- No `bun install` or workspace registration step after scaffolding.

### Triggers to build this for real

- Onboarding a new team that is not familiar with the MFE project structure.
- The platform grows enough conventions (testing setup, lint config, CI templates)
  that scaffolding saves meaningful time.

---

## 6. Local MFE Linking (`fe link`)

### Problem

During development, an MFE that imports another MFE (e.g. `mfe-b` importing
`mfe-a`) needs TypeScript to resolve the dependency. Without a monorepo workspace,
the developer must manually configure `tsconfig.json` paths or publish intermediate
versions.

### Current implementation

`fe link <consumer> <dep>` writes a `file:` URI into the consumer's
`devDependencies` and runs `bun install`, creating a `node_modules` symlink. This
makes TypeScript resolution work without any `tsconfig.json` path aliases.

### What's missing

- Only tested within the sandbox monorepo where workspace links already exist.
- No support for cross-repository linking (the CONTRIBUTING.md suggests manual
  `git+https` URIs as an alternative).
- No `unlink` command.

### Triggers to build this for real

- A team regularly develops MFEs across multiple repositories and needs a reliable
  local workflow.
- The monorepo workspace topology is abandoned in favour of independent repos.

---

## 7. CLI Hook / Extension Points

### Problem

External plugins need to observe and intercept lifecycle events -- log builds,
notify a dashboard when a publish succeeds, transform build options for
framework plugins.

### Current implementation

The `Hooks` class (`@fe/core/hooks.ts`) provides `hook()`, `callHook()`, and
`waterfall()`. The `HookMap` type defines 22 event names across all 8 builtin
commands. The `build:options` waterfall is the only hook with a subscriber
(the JIT plugin chain registered in `bootstrap.ts`). Every other `callHook()`
invocation fires into an empty listener set.

### What's missing

- 21 of 22 hook events have zero subscribers at any point in the codebase.
- No hook has a typed payload beyond what `HookMap` defines.
- No documentation describes which hooks exist or what guarantees they provide
  (e.g. is `publish:after` called even if `registerPackage` fails?).

### Triggers to build this for real

- An external CLI plugin is written that needs to observe or intercept a lifecycle
  event.
- The platform's audit or observability requirements call for logging
  every `publish` invocation.

---

## 8. Plugin Version Enforcement (`updatePolicy`)

### Problem

If external CLI plugins are loaded dynamically from npm, a developer may run an
older plugin version that is incompatible with the current `@fe/core` interfaces.
The CLI should warn or block on stale plugins.

### Current implementation

`plugin-loader.ts:applyUpdatePolicy()` fetches the latest version from the npm
registry (`https://registry.npmjs.org/<pkg>/latest`) and compares it with the
installed version. Supports `"warn"` (prints a warning) and `"block"` (throws an
error). Network errors are silently swallowed.

### What's missing

- Zero plugins in the codebase set `updatePolicy`, so the code path is never
  exercised.
- The semver comparison (`isOutdated`) is naive -- it splits on `"."` and casts
  to `Number`. Pre-release tags, build metadata, and range comparisons are not
  handled.
- The npm registry fetch adds latency to every bootstrap (4-second timeout) with
  no caching of results.
- No offline fallback.

### Triggers to build this for real

- External plugins exist in production and a stale plugin causes a deploy failure.

---

## 9. Toolkit Libraries as Shared Platform Primitives

### Problem

MFEs that need global state, a shared network client, or a devtools overlay would
benefit from a shared module resolved through the import map -- zero-config
singletons without global variables.

### Current implementation

Four toolkit packages are published:
- `@fe/fe-store` -- `createStore()` with subscriptions, scoped by key. The import
  map guarantees all MFEs importing `@fe/fe-store` share one registry.
- `@fe/fe-network` -- `network.fetch()` with request dedup, response caching, and
  interceptor chain. Same singleton guarantee via import map.
- `@fe/fe-devtools` -- Solid.js overlay for overriding specifier URLs, clearing
  overrides, and sharing override URLs via query params.
- `@feo/fe-syntax-highlighter` -- CSS Custom Highlight API highlighter (published
  to JSR, independent of the platform).
- `@feo/fe-web-components` -- Custom elements for fragment-based page assembly
  (published to JSR, used by the docs site).

### What's missing

- No MFE in the codebase actually imports `@fe/fe-store` or `@fe/fe-network`.
  They are published as available primitives but have zero known consumers.
- `@fe/fe-devtools` is used by the sandbox but requires the legacy artifact
  build path.
- `@feo/fe-syntax-highlighter` and `@feo/fe-web-components` are functionally
  independent of the MFE platform and are published to JSR under a different
  scope (`@feo/`).

### Triggers to build this for real

- An MFE team needs cross-MFE state sharing and adds `@fe/fe-store` to their
  devDependencies.
- The devtools overlay is adopted outside the sandbox.
- A second MFE needs HTTP deduplication and consumes `@fe/fe-network`.

---

## 10. Preloading API

### Problem

When a user navigates to a route that loads a new MFE, the browser must resolve
the dep graph, inject import maps, fetch the module, and parse it before
rendering. For large MFEs this creates a perceptible delay.

### Current implementation

`@fe/runtime` exports `preload(specifierVersion)` which resolves the transitive
dep graph, injects import maps, and appends `<link rel="modulepreload">` for the
entry module. The `PlatformConfig.preload` array in `platform.json` can specify
specifiers to preload eagerly on page load.

### What's missing

- No real-world performance data exists to validate that preloading improves
  navigation latency.
- The `preload` array in `platform.json` is never populated in the sandbox config.
- No mechanism exists to preload specifiers based on navigation intent (e.g.
  prefetching an MFE when hovering over a link).

### Triggers to build this for real

- Performance metrics show that MFE load time on navigation is a user-facing
  problem.
- A/B testing confirms that `modulepreload` hints improve time-to-interactive.
