# ⚯ shell/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    shell
version: 1.0.0
devDependencies:
  "fe(@acme/mfe-b)": "file:../mfe-b"
    → node_modules/fe(@acme/mfe-b) symlink (after bun install)
    → no longer statically imported; kept for bun install compatibility
```

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true lib=[ES2022,DOM] include=[src]

## files
```
index.html       HTML template · placeholder: <!-- __PLATFORM_CONFIG__ -->
src/index.ts     app entrypoint · calls loadDevtools() then platform.load()
src/platform.ts  browser runtime · reads config · resolves deps · injects import maps
src/semver.ts    minimal semver: parseSemver · satisfies · resolveVersion
src/overrides.ts sessionStorage overrides: readOverrides · processUrlParams
dist/            build output (gitignored)
  index.html     platform config injected by buildShell() · import maps injected at runtime
  app.js         bundled shell script (includes platform.ts + semver.ts + overrides.ts)
```

## src/index.ts — full behaviour
```ts
import {load, loadDevtools} from "./platform"
const app = document.getElementById("app")!
const path = window.location.pathname
await loadDevtools()                // loads fe(@acme/devtools) if config.devtools is set
const {render} = await load(path)  // resolves deps, injects import maps, dynamic import
render(app, {name:"Shell User"})
```

## browser runtime (split across 3 files)
```
semver.ts
  satisfies(version, range)     minimal ^X.Y.Z semver matching
  resolveVersion(versions, rng) pick highest satisfying version

overrides.ts
  readOverrides()               read specifier→url map from sessionStorage
  processUrlParams()            handle ?platform:overrides= and ?platform:clear-overrides

platform.ts
  readConfig()                  reads <script id="__platform__"> from DOM → PlatformConfig
  parseSpecVersion(sv)          "fe(@acme/mfe-b)@1.0.0" → {specifier,version}
  resolveDeps(spec,ver)         walk transitive fe() dep graph → flat Map<specifier,url>
  injectImportMap(imports)      create+append <script type="importmap"> · deduplicates
  applyOverridesAndInject(deps) merge sessionStorage overrides then injectImportMap
  load(path)                    route→MFE · resolve+inject · import(specifier)
  loadDevtools()                load config.devtools MFE into #__devtools__ div
```

## index.html structure
```html
<head>
  <!-- __PLATFORM_CONFIG__ -->   ← full platform.json as <script id="__platform__" type="application/json">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
```

## build (from repo root)
```
fe build shell
  1. Bun.build(src/index.ts → dist/app.js, esm, browser)
     platform.ts + semver.ts + overrides.ts bundled into app.js
  2. read sandbox/configs/platform.json
  3. replace <!-- __PLATFORM_CONFIG__ --> with <script id="__platform__" type="application/json">
  4. write dist/index.html
  note: no import map in HTML · all import maps injected at runtime by platform.ts

prereq: bun install must have run in shell/ (CI does this)
output: host-app/dist/{index.html, app.js}
```

## serve (from repo root)
```
fe serve [port=3000]
  serves host-app/dist/ · /uploads/→ROOT/uploads/
  !must build shell first
  !mfe artifacts must be in uploads/ (run admin upload for each mfe)
```

## full run sequence (from repo root)
```
fe build mfe-a
fe build mfe-b
fe admin upload mfe-a
fe admin upload mfe-b
# edit sandbox/configs/platform.json "routes" if needed
fe build shell
fe serve
```
