# ⬡ shell/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:    shell
version: 1.0.0
devDependencies:
  "fe(@acme/mfe-b)": "file:../mfe-b"
    → node_modules/fe(@acme/mfe-b) symlink (after bun install)
    → external at build · importmap at runtime
```

## tsconfig
target=ES2022 module=ESNext moduleResolution=bundler strict=true lib=[ES2022,DOM] include=[src]

## files
```
index.html    HTML template · placeholder: <!-- __IMPORT_MAP__ --> → replaced at build
src/index.ts  app entrypoint
dist/         build output (gitignored)
  index.html  importmap injected by buildShell()
  app.js      bundled shell script
```

## src/index.ts — full behaviour
```ts
import {render} from "fe(@acme/mfe-b)"   // external · resolved via importmap
const app = document.getElementById("app")!
render(app, {name:"Shell User"})
// no unmount needed (shell lives for page lifetime)
```

## index.html structure
```html
<head>
  <!-- __IMPORT_MAP__ -->   ← replaced by buildShell() with:
                              <script type="importmap">
                                {contents of configs/import-map.json}
                              </script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
```

## build (from repo root)
```
bun cli/src/index.ts build shell
  1. Bun.build(src/index.ts → dist/app.js, esm, browser, external=["fe(@acme/mfe-b)"])
  2. read configs/import-map.json
  3. replace <!-- __IMPORT_MAP__ --> in index.html with <script type="importmap">…</script>
  4. write dist/index.html

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
# edit configs/import-map.json if needed
bun cli/src/index.ts build shell
bun cli/src/index.ts serve
```
