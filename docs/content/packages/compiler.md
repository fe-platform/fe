---
sidebar_position: 3
---

# @fe/compiler

Framework-aware MFE bundler and JIT compiler. Used by `@fe/cli` for both static builds (`fe build`) and on-demand compilation (`fe serve`).

## `compileMfe(options)`

```ts
export interface CompileOptions {
  entrypoints: string[];
  outdir?: string;
  external?: string[];
  rootDir: string;
  naming?: string | Record<string, string>;
}

export async function compileMfe(options: CompileOptions): Promise<Bun.BuildOutput>
```

Compiles an MFE's source with framework detection. Reads `rootDir/package.json` to determine whether SolidJS is present; if so, applies `bun-plugin-solid`. The result is a standard `Bun.BuildOutput` with `success`, `outputs`, and `logs`.

**Framework detection:**

| Condition | Transform applied |
|-----------|-------------------|
| `solid-js` in `dependencies` or `devDependencies` | `bun-plugin-solid` (Babel + babel-preset-solid) |
| Neither | Bun native (React's `react-jsx` works without a plugin) |

**Default `external`:** `["fe(*)", "fe(@*)"]` — covers all `fe()` specifiers. Override by passing `external` explicitly.

## `createJITBundler(options)`

```ts
export interface JITBundlerOptions {
  storage: SourceStorage;
  external?: string[];
}

export function createJITBundler(
  options: JITBundlerOptions
): { handle: (req: Request) => Promise<Response | null> }
```

Creates the JIT request handler used by `fe serve`. Call `handle(req)` for each incoming request; it returns a `Response` if the request matches `/bundle/<slug>/<version>/<path>`, or `null` if it does not.

**Request matching:** `/bundle/<slug>/<version>/<path>` — e.g., `/bundle/mfe-a/1.0.0/index.tsx`.

**On cache miss:**

1. Calls `storage.listFiles(slug, version)` to enumerate source files.
2. Fetches each file via `storage.fetchFile` and writes it to `/tmp/fe-jit/<slug>/<version>/`.
3. Calls `compileMfe` with the requested file as entry point.
4. Caches the compiled JavaScript in memory under `slug@version/filePath`.
5. Returns `Content-Type: application/javascript` with `Cache-Control: public, max-age=31536000, immutable`.

**On cache hit:** Returns the cached JavaScript immediately.

**On source not found:** Returns 404.

**On compile error:** Returns 500 with the error messages from `Bun.BuildOutput.logs`.

## Integration with `fe serve`

`fe serve` creates one `JITBundler` instance per server process:

```ts
const jit = createJITBundler({ storage: ctx.adapters.sourceStorage });

Bun.serve({
  async fetch(req) {
    const jitResponse = await jit.handle(req);
    if (jitResponse) return jitResponse;
    // ... serve shell files
  }
});
```

The JIT bundler takes priority over all other request handlers. If the URL does not match `/bundle/*`, `handle` returns `null` and the request falls through to the shell file serving logic.

## Caching

The cache is an in-memory `Map` keyed by `slug@version/filePath`. It lives for the lifetime of the `fe serve` process. There is no disk cache and no cache invalidation — published versions are treated as immutable. Restarting `fe serve` clears the cache; subsequent requests recompile from source.
