# ⚯ packages/compiler/ · agent-ref
↑ /AGENTS.md for repo-wide context
↑ packages/core/AGENTS.md for all types/interfaces

## purpose
`@fe/compiler` v1.0.0: framework-aware MFE bundler and server-side JIT bundler.
Published. Used by `@fe/cli` (via `createBunBuilder`) and `fe serve` (via `createJITBundler`).

## src/ file map
```
src/
  index.ts   compileMfe() · createJITBundler()
```

## compileMfe(options: CompileOptions)
```ts
interface CompileOptions {
  entrypoints: string[];
  outdir?:     string;
  external?:   string[];        // default: ["fe(*)"]
  rootDir:     string;          // used for solid-js auto-detection
  naming?:     string | Record<string, string>;
  plugins?:    unknown[];       // when set, skips auto-detection
}
```
Runs `Bun.build()` with `format: "esm"`, `target: "browser"`.

Plugin resolution:
1. If `options.plugins` is provided (set by a JIT plugin via `build:options` waterfall): use it directly.
2. Otherwise: check `<rootDir>/package.json` for `solid-js` in `dependencies`/`devDependencies`.
   - Found: apply `SolidPlugin()` from `bun-plugin-solid`
   - Not found: no plugins (React JSX is handled natively by Bun via tsconfig)

## createJITBundler(options: JITBundlerOptions)
```ts
interface JITBundlerOptions {
  storage:     SourceStorage;
  external?:   string[];        // default: ["fe(*)"]
  jitPlugins?: JitPlugin[];     // transforms applied to BuildOptions before each compile
}
```
Returns `{ handle(req: Request): Promise<Response | null> }`.

Handles requests matching `/bundle/<slug>/<version>/<filePath>`:
1. Check in-memory cache (`slug@version/filePath` key); return cached JS if hit.
2. List files via `storage.listFiles(slug, version)`; 404 if empty.
3. Copy all source files to `/tmp/fe-jit/<slug>/<version>/`.
4. Apply each `JitPlugin.transform(options)` in order to build up `BuildOptions`.
5. Call `compileMfe(...)` with the assembled options.
6. Cache and return compiled JS with immutable cache headers.

The JIT bundler is framework-agnostic. Framework support requires a `JitPlugin`
(e.g. `@fe/jit-plugin-solid`) configured in `FeConfig.jitPlugins`.

## invariants
- compileMfe: when plugins is undefined, auto-detect via rootDir/package.json
- createJITBundler: source storage contains src/ contents + package.json (uploaded by publish)
  → auto-detection works if package.json is in source storage
- compiled outputs are cached immutably (cache-control: max-age=31536000, immutable)
- JIT compile errors return HTTP 500 with the error messages
