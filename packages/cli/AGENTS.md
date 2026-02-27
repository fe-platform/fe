# ⚯ packages/cli/ · agent-ref
↑ /AGENTS.md for repo-wide context
↑ packages/core/AGENTS.md for all types/interfaces

## purpose
`@fe/cli` v0.1.0 — the `fe` binary. Bootstraps context, loads plugins, dispatches commands.
Published. Entry: `src/index.ts` → dispatches to `ctx.commands`. Bin alias: `fe`.

## src/ file map
```
src/
  index.ts                   CLI entry: parse argv → bootstrap → dispatch
  bootstrap.ts               wires up CliContext + loads plugins
  plugin-loader.ts           dynamic import() of external plugin npm packages
  helpers.ts                 readPackageMeta · readFeDepKeys · readFeDeps · slugFromSpecifier
  adapters/
    json-config-provider.ts  ConfigProvider: reads configs/fe.config.json
    json-manifest-manager.ts ManifestManager: reads/writes configs/platform.json
    local-source-storage.ts  SourceStorage: cp src/→sources/<slug>/<ver>/
    local-artifact-storage.ts ArtifactStorage: cp dist/→uploads/<slug>/<ver>/
    bun-builder.ts           Builder: thin Bun.build() wrapper
  plugins/
    build.ts                 `fe build <target|shell>`
    serve.ts                 `fe serve [port]` (has JIT bundler)
    dev.ts                   `fe dev <target> [port]`
    link.ts                  `fe link <consumer> <dep>`
    publish.ts               `fe publish <target>`
    admin.ts                 `fe admin upload <target>` (legacy artifact upload)
    check.ts                 `fe check <target|shell>`
```

## bootstrap flow (bootstrap.ts)
```
1. createJsonConfigProvider(root)          → configProvider
2. configProvider.get()                    → feConfig (plugins, manifestPath, uploadsDir, shellDir)
3. build CliContext:
     adapters.config          = configProvider
     adapters.sourceStorage   = createLocalSourceStorage(root, feConfig.sourcesDir)
     adapters.artifactStorage = createLocalArtifactStorage(root, feConfig.uploadsDir)
     adapters.manifest        = createJsonManifestManager(root, feConfig.manifestPath)
     adapters.builder         = createBunBuilder()
4. loadExternalPlugins(root, feConfig.plugins)  → external Plugin[]
5. run setup() for each plugin in order:
     BUILTIN_PLUGINS (build, serve, dev, link, admin, check) first
     external plugins after → can swap any ctx.adapters.*
```
The `configProvider` is stored in `ctx.adapters.config` so plugins can swap it or call `.get()`.

## ConfigProvider adapter (adapters/json-config-provider.ts)
```ts
createJsonConfigProvider(root: string): ConfigProvider
```
Reads `<root>/configs/fe.config.json`. Returns `Required<FeConfig>` with defaults merged:
```
plugins:      []
manifestPath: "configs/platform.json"
uploadsDir:   "uploads"
sourcesDir:   "sources"
shellDir:     "shell"
```
If file is absent, returns defaults. Throws on malformed JSON.

**All plugins must call `ctx.adapters.config.get()` to read config — never import from this file directly.**

## Plugin pattern
Each builtin plugin's `run()` fetches config on-demand:
```ts
// correct ✓
const feConfig = await ctx.adapters.config.get();

// wrong ✗ (config.ts was deleted — this will not compile)
const { readFeConfig } = await import("../config");
```

## Command behaviours

### build (plugins/build.ts)
```
fe build <target>   Bun.build src/index.ts → dist/index.js, esm, browser
                    external[] = fe() keys from devDependencies
fe build shell      Bun.build src/index.ts → dist/app.js
                    reads platform.json → injects as <script id="__platform__"> in dist/index.html
```
`buildTarget(ctx, hooks, target, shellDir)` is exported — re-used by dev plugin.

### serve (plugins/serve.ts)
```
fe serve [port=3000]
  mounts JIT bundler at /bundle/*
  serves <shellDir>/dist/  (index.html + app.js)
  /<uploadsDir>/* → <root>/<uploadsDir>/  (artifact passthrough)
  all other paths → distDir file or 404
```

### dev (plugins/dev.ts)
```
fe dev <target> [port=3000]
  initial build of target
  serves at http://localhost:<port>:
    /          → sandboxHtml (inline importmap + SSE reload)
    /index.js  → dist/index.js
    /__dev     → SSE stream (data: {t: timestamp})
  watches src/ (recursive) → rebuild → notifyReload() via SSE
  HMR: browser imports /index.js?t=<ts> → unmounts old · mounts new
```

### link (plugins/link.ts)
```
fe link <consumer> <dep>
  reads dep's package.json → name
  writes consumer/package.json devDependencies[depName] = "file:../dep"
  runs bun install in consumer/
```

### publish (plugins/publish.ts)
```
fe publish <target>
  runs pre-flight check (build simulation)
  reads name + version from target/package.json
  slug = slugFromSpecifier(name)  // strips "fe(" prefix/suffix chars
  sourceStorage.upload(slug, version, srcDir)
  reads fe() devDeps → resolves dep versions from local package.json files
  url = `/bundle/${slug}/${version}/index.ts`
  manifest.registerPackage(name, version, {url, deps})
```
Never touches "routes" — only "packages" in platform.json. Legacy `admin.ts` provides artifact uploads but `publish` handles source code for JIT.

### check (plugins/check.ts)
```
fe check <target|shell>
  tsc --noEmit (via bunx tsc --project <dir>/tsconfig.json)
  Bun.build simulation (same options as real build, respects build:options waterfall)
  exits 0 on pass · exits 1 on first failure
  NOTE: check writes to dist/ as a side effect of the build simulation
```

## helpers.ts
```ts
readPackageMeta(dir)    → { name, version }  reads dir/package.json
readFeDepKeys(dir)      → string[]           devDep keys that start with "fe("
readFeDeps(dir)         → Record<string,string>  full devDeps map filtered to fe() keys
slugFromSpecifier(name) → string             "fe(acme/mfe-a)" → "mfe-a"
```

## external plugin loading (plugin-loader.ts)
```ts
loadExternalPlugins(root, pluginNames): Promise<Plugin[]>
  for each name: dynamic import(name)
  expects: mod.default or mod.plugin implementing Plugin interface
  throws on missing export or failed import
```

## ✗ invariants
- config.ts does not exist (deleted) — use ctx.adapters.config.get()
- builtin plugins are always loaded first; external plugins run after
- admin upload writes packages only, never routes
- build plugin exports buildTarget() for reuse; do not duplicate build logic
