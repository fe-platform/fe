# ⬡ cli/ · agent-ref
↑ /AGENTS.md for repo-wide context

pkg=cli@1.0.0 · entry: src/index.ts · run: `bun cli/src/index.ts <cmd>` from repo-root

## architecture
Plugin-based CLI. Each command is a `Plugin` with `setup(ctx, hooks)`.
Adapter pattern for swappable backends. Hook system for cross-plugin communication.

## src/ file map
```
index.ts                 bootstrap() + argv dispatch to registered commands
core/
  hooks.ts               Hooks class (hook/callHook/waterfall) + HookMap interface (declaration merging)
  plugin.ts              Plugin interface: { name, setup(ctx, hooks) }
  context.ts             CliContext: root, adapters, commands · CommandDef type
  adapters.ts            ArtifactStorage / ManifestManager / Builder interfaces
  bootstrap.ts           wire default adapters + register built-in plugins
  types.ts               ImportMap, PackageVersion, PackageEntry, PlatformConfig, BuildOptions, BuildResult
  helpers.ts             ROOT, readPackageMeta, readFeDeps, readFeDepKeys, parseSpecVersion, slugFromSpecifier, generateRouteImportMap
adapters/
  local-artifact-storage.ts   cpSync to uploads/ · createLocalArtifactStorage(root)→ArtifactStorage
  json-manifest-manager.ts    platform.json R/W · createJsonManifestManager(root)→ManifestManager
  bun-builder.ts              Bun.build() wrapper · createBunBuilder()→Builder
plugins/
  build.ts               build command + buildTarget() export for dev plugin · hooks: build:before/after, build:shell:before/after
  serve.ts               static HTTP server · hooks: serve:start, serve:request
  dev.ts                 sandbox+SSE HMR · module-swap via ?t= cache-buster · pendingTs reconnect queue · hooks: dev:start, dev:rebuild, dev:reload
  link.ts                devDep wiring + bun-install · hooks: link:before/after
  admin.ts               artifact upload + manifest registration · hooks: admin:upload:before/after, admin:register:before/after
```

## core interfaces
```
Plugin          = { name:string, setup(ctx:CliContext, hooks:Hooks):void|Promise<void> }
CliContext       = { root:string, adapters:{ artifactStorage, manifest, builder }, commands:Map<string,CommandDef> }
CommandDef       = { name, description, usage, run(args:string[]):Promise<void> }
ArtifactStorage  = { upload(slug,version,distDir)→Promise<string>, exists(slug,version)→Promise<boolean> }
ManifestManager  = { read()→Promise<PlatformConfig>, write(config)→Promise<void>, registerPackage(spec,ver,entry)→Promise<void> }
Builder          = { build(options:BuildOptions)→Promise<BuildResult> }
HookMap          = {} (extended via declaration merging by each plugin)
Hooks            = { hook(name,fn,priority?), callHook(name,...args), waterfall(name,initial) }
```

## hook catalog
```
build:before          (target, options)           — pre-build
build:after           (target, result)            — post-build
build:shell:before    (config)                    — pre-shell-build (config modifiable)
build:shell:after     ()                          — post-shell-build
build:options         waterfall<BuildOptions>      — modify build options before bundling
serve:start           (port)                      — server started
serve:request         (req)                       — per-request middleware
dev:start             (target, port)              — dev server started
dev:rebuild           (target)                    — file change rebuild
dev:reload            ()                          — SSE reload sent
link:before           (consumer, dep)             — pre-link
link:after            (consumer, depName)         — post-link
admin:upload:before   (target, {name,version})    — pre-upload
admin:upload:after    (target, url, deps)         — post-upload
admin:register:before (specifier, version, entry) — pre-manifest-write
admin:register:after  ()                          — post-manifest-write
```

## dev plugin — HMR detail
```
sandboxHtml(name)   generated at request time · never written to disk · MFE-unaware
  <script type="importmap"> { "imports": { "<name>": "/index.js" } }
  <script type="module">
    let unmount = render(#sandbox, {})
    new EventSource("/__dev").onmessage = async ({data}) => {
      const { t } = JSON.parse(data)
      const mod = await import("/index.js?t=" + t)   // new URL = new module registry entry
      unmount?.()                                     // tear down old render
      unmount = mod.render(#sandbox, {})              // mount new version
    }

pendingTs: number|null
  set by notifyReload() to Date.now() before broadcasting
  read by drainPending(ctrl) when a new SSE client connects
  → reconnecting tabs receive the latest build timestamp immediately
  → superseded by next rebuild (single slot, latest-wins, never accumulates)

limitations:
  - module-level state resets on each HMR swap (new module evaluation)
  - props reset to {} on each swap
  - stale module URLs accumulate in browser registry until page reload
  - cross-MFE HMR not wired (dev target only; deps use whatever URL their import map entry says)
```

## extending
To add a command: create a Plugin, register it via bootstrap()'s extraPlugins.
To swap a backend: replace ctx.adapters.* in a plugin's setup().
To observe/modify: hook into existing hooks via hooks.hook(name, fn).
