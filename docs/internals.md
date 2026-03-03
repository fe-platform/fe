# Advanced topics for contributors

## How fe works internally

### The JIT compilation loop

When `fe serve` handles a request to `/bundle/<slug>/<ver>/index.ts`:

1. `createJITBundler` (in `@fe/compiler`) intercepts the request.
2. It reads the source files from `SourceStorage` (default: local `sources/` dir).
3. It calls the `build:options` waterfall hook. Each `JitPlugin` in `ctx.jitPlugins`
   transforms the `BuildOptions` in turn.
4. `Bun.build()` compiles the transformed options.
5. The result is served with `Cache-Control: immutable` headers.

Because artifact URLs include the version, the compiled output is stable and safe
to cache forever. A new version means a new URL.

### The import map lifecycle

The browser starts with no import maps. When `load(path)` is called:

1. The runtime resolves the full dep graph for the route's specifier, including
   transitive deps, using semver matching against `platform.json`.
2. It merges any sessionStorage overrides into the resolved URLs.
3. It injects one `<script type="importmap">` with all new (not yet injected)
   specifiers.
4. It calls `import(specifier)`. The browser resolves it via the map.

Subsequent calls to `load()` skip specifiers already in `injectedSpecifiers`,
preventing duplicate map entries.

### The plugin system

Plugins are the extension mechanism for both the CLI and the JIT bundler.

**CLI plugins** (`Plugin` interface, `@fe/core`) run at bootstrap time. Their
`setup(ctx, hooks)` call happens after all builtin plugins have registered, so
external plugins can override any adapter or add commands. The `updatePolicy`
field lets a plugin signal to the CLI that outdated installs are risky.

**JIT plugins** (`JitPlugin` interface, `@fe/core`) run before every build. They
receive `BuildOptions` and return a (possibly modified) copy. The `build:options`
waterfall hook chains all registered plugins in the order they were loaded.

Both systems are loaded at bootstrap from `FeConfig.plugins` and
`FeConfig.jitPlugins` respectively, sourced via `ctx.adapters.config.get()`.

## Platform goals

The platform intends to stay small. The published packages (`packages/*`) have no
framework dependencies. The JIT bundler uses Bun natively. The runtime is a few
hundred lines of vanilla TypeScript.

The complexity budget is intentional: every line in these packages is a line every
MFE team implicitly depends on. Keeping the surface small keeps the blast radius
of a bug small.

Toolkit packages (`toolkit/*`) are allowed more weight because they are optional
dependencies, not platform primitives.
