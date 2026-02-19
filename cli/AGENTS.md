# ⬡ cli/ · agent-ref
↑ /AGENTS.md for repo-wide context

pkg=cli@1.0.0 · entry: src/index.ts · run: `bun cli/src/index.ts <cmd>` from repo-root

## src/ file map
```
index.ts   argv-router (process.argv[2]=cmd) · dynamic import each module
config.ts  shared constants+helpers
build.ts   Bun.build wrapper
serve.ts   static HTTP server
dev.ts     sandbox server + SSE hotreload
link.ts    devDep wiring + bun-install
admin.ts   artifact upload to local registry
```

## config.ts — exports
```
ROOT            = import.meta.dir/../../          (repo root, absolute)
CONFIGS_DIR     = ROOT/configs/
IMPORT_MAP_PATH = ROOT/configs/import-map.json
UPLOADS_DIR     = ROOT/uploads/

readImportMap()→ImportMap          JSON.parse(IMPORT_MAP_PATH)
writeImportMap(map)→void           Bun.write(IMPORT_MAP_PATH, JSON.stringify+\n)  [unused currently]
readPackageMeta(dir)→{name,ver}    JSON.parse(dir/package.json) · throws if !name||!version
ImportMap type = {imports:Record<string,string>}
```

## build.ts — logic
```
feDeps(dir):string[]
  JSON.parse(dir/package.json).devDependencies
  → filter keys.startsWith("fe(")
  → returned as external[] to Bun.build

build(target):Promise<void>
  target==="shell" → buildShell()
  else:
    dir = ROOT/target
    Bun.build({
      entrypoints:[dir/src/index.ts]
      outdir:dir/dist
      format:"esm" target:"browser"
      external:feDeps(dir)
    })
    success=false → log errors, process.exit(1)
    success → log "Built {target} → {target}/dist/"

buildShell():Promise<void>
  dir = ROOT/shell
  importMap ← readImportMap()
  Bun.build({
    entrypoints:[dir/src/index.ts]
    outdir:dir/dist
    naming:"app.js"
    format:"esm" target:"browser"
    external:feDeps(dir)
  })
  template ← Bun.file(dir/index.html).text()
  scriptTag = <script type="importmap">\n  {JSON.stringify(importMap,null,2)}\n  </script>
  html = template.replace("<!-- __IMPORT_MAP__ -->", scriptTag)
  Bun.write(dir/dist/index.html, html)
  log "Built shell → shell/dist/"
```

## serve.ts — logic
```
serve(port=3000):void
  distDir = ROOT/shell/dist
  uploadsDir = ROOT/uploads
  Bun.serve(port) fetch handler:
    pathname="/" → "/index.html"
    startsWith("/uploads/") → Bun.file(ROOT/pathname.slice(1)) · 404 if !exists
    else → Bun.file(distDir/pathname) · 404 if !exists
  log "Serving shell at http://localhost:{port}"
  log "Uploads served from: {uploadsDir}"
```

## dev.ts — logic
```
SSE_PATH = "/__dev"
sseClients = Set<ReadableStreamDefaultController>
notifyReload() → ctrl.enqueue("data: reload\n\n") for each client

sandboxHtml(name):string
  inline importmap: {"imports":{name:"/index.js"}}
  import {render} from name → render(#sandbox,{})
  SSE: new EventSource("/__dev").onmessage = ()=>location.reload()

dev(target,port=3000):Promise<void>
  dir=ROOT/target · name←readPackageMeta(dir).name · distDir=dir/dist
  await build(target)
  log "Dev server: http://localhost:{port}"
  Bun.serve(port) fetch handler:
    "/__dev"         → SSE stream (Content-Type:text/event-stream Cache-Control:no-cache)
    "/"|"/index.html"→ sandboxHtml(name)
    else             → Bun.file(distDir/pathname) · 404 if !exists
  Bun.watch(dir/src, recursive) for await event:
    stdout "Rebuilding {target}... "
    await build(target)
    notifyReload()
    log "done."
```

## link.ts — logic
```
link(consumerTarget,depTarget):Promise<void>
  consumerDir=ROOT/consumer · depDir=ROOT/dep
  depName ← readPackageMeta(depDir).name   e.g. "fe(@acme/mfe-a)"
  relToDep = relative(consumerDir,depDir)  normalised with /
  fileUri = "file:{rel}" (ensure leading ./)
  pkg ← JSON.parse(consumerDir/package.json)
  pkg.devDependencies[depName] = fileUri
  writeFileSync(consumerDir/package.json, JSON.stringify(pkg,null,2)+\n)
  Bun.spawn(["bun","install"], cwd=consumerDir stdout+stderr=inherit)
  await proc.exited
  log "Linked {depName} in {consumerTarget}"
result: node_modules/fe(@acme/mfe-a) symlink in consumer → TS resolves without paths config
```

## admin.ts — logic
```
adminUpload(target):void
  dir=ROOT/target · distDir=dir/dist
  !Bun.file(distDir/index.js).size → error+exit(1)
  {name,version} ← readPackageMeta(dir)
  slug = name.replace(/^fe\(/,"").replace(/\)$/,"").replace(/^@[^/]+\//,"")
    e.g. "fe(@acme/mfe-a)"→"mfe-a"
  uploadPath = UPLOADS_DIR/slug/version
  mkdirSync(uploadPath,{recursive:true})
  cpSync(distDir, uploadPath, {recursive:true})
  url = "./uploads/{slug}/{version}/index.js"
  prints:
    "Uploaded {name}@{version}"
    "URL: {url}"
    ""
    "Update configs/import-map.json manually:"
    '  "{name}": "{url}"'
  !modifies configs/import-map.json
```
