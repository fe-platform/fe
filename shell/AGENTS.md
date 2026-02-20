# ⬡ shell/ · agent-ref
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
index.html       HTML template · placeholders: <!-- __IMPORT_MAP__ --> + <!-- __PLATFORM_CONFIG__ -->
src/index.ts     app entrypoint · uses platform.load() for dynamic MFE loading
src/platform.ts  browser runtime · reads config · resolves deps · injects import maps
dist/            build output (gitignored)
  index.html     importmap + platform config injected by buildShell()
  app.js         bundled shell script (includes platform.ts)
```

## src/index.ts — full behaviour
```ts
import {load} from "./platform"
const app = document.getElementById("app")!
const path = window.location.pathname
const {render} = await load(path)   // resolves deps, injects import maps, dynamic import
render(app, {name:"Shell User"})
```

## src/platform.ts — browser runtime
```
readConfig()        reads <script id="__platform__" type="application/json"> from DOM
parseSpecVersion()  "fe(@acme/mfe-b)@1.0.0" → {specifier,version}
satisfies()         minimal semver: ^X.Y.Z range matching
resolveVersion()    pick highest version from list that satisfies range
resolveDeps()       walk transitive fe() dep graph → flat Map<specifier,url>
injectImportMap()   create+append <script type="importmap"> for new deps
load(path)          route→MFE · resolve deps · inject maps · import(specifier)
```

## index.html structure
```html
<head>
  <!-- __IMPORT_MAP__ -->        ← route MFEs only (from platform.json routes)
  <!-- __PLATFORM_CONFIG__ -->   ← full platform.json as <script type="application/json">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
```

## build (from repo root)
```
bun cli/src/index.ts build shell
  1. Bun.build(src/index.ts → dist/app.js, esm, browser)
     platform.ts is bundled into app.js (local import, not external)
  2. read configs/platform.json
  3. generateRouteImportMap() → import map with top-level route MFEs only
  4. replace <!-- __IMPORT_MAP__ --> with <script type="importmap">
  5. replace <!-- __PLATFORM_CONFIG__ --> with <script id="__platform__" type="application/json">
  6. write dist/index.html

prereq: bun install must have run in shell/ (CI does this)
output: shell/dist/{index.html, app.js}
```

## serve (from repo root)
```
bun cli/src/index.ts serve [port=3000]
  serves shell/dist/ · /uploads/→ROOT/uploads/
  !must build shell first
  !mfe artifacts must be in uploads/ (run admin upload for each mfe)
```

## full run sequence (from repo root)
```
bun cli/src/index.ts build mfe-a
bun cli/src/index.ts build mfe-b
bun cli/src/index.ts admin upload mfe-a
bun cli/src/index.ts admin upload mfe-b
# edit configs/platform.json "routes" if needed
bun cli/src/index.ts build shell
bun cli/src/index.ts serve
```
