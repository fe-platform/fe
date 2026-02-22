/// <reference types="bun-types" />
import type { SourceStorage } from "@fe/core";

export interface JITBundlerOptions {
  /**
   * Storage adapter to fetch raw source files from on a cache miss.
   */
  storage: SourceStorage;

  /**
   * Glob patterns for specifiers to externalize (default: ["fe(*)", "fe(@*)"]).
   * These are passed directly to Bun.build's `external` option.
   * The browser resolves them via injected import maps.
   */
  external?: string[];
}

type CacheEntry = { js: string };

/**
 * Creates a JIT Bundler request handler powered by Bun's native bundler.
 *
 * Basic usage (zero config — used by `fe serve`):
 *   The serve command mounts this automatically. You never call this directly.
 *
 * Advanced usage (CDN / Edge deployment):
 *   Import `createJITBundler` from `@fe/runtime/server` and mount the returned
 *   handler at `/bundle/` in your own server.
 *
 * URL schema: /bundle/<slug>/<version>/<path-to-file>
 *   e.g.  GET /bundle/mfe-a/1.0.0/index.ts
 */
export function createJITBundler(options: JITBundlerOptions) {
  const { storage, external = ["fe(*)", "fe(@*)"] } = options;

  // In-memory bundle cache: "<slug>@<version>/<file>" → compiled JS
  const cache = new Map<string, CacheEntry>();

  async function handle(req: Request): Promise<Response | null> {
    const url = new URL(req.url);
    // Expect: /bundle/<slug>/<version>/<...file>
    const match = url.pathname.match(/^\/bundle\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) return null;

    const [, slug, version, filePath] = match;
    const cacheKey = `${slug}@${version}/${filePath}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return new Response(cached.js, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Fetch all source files to build a virtual filesystem for Bun
    const allFiles = await storage.listFiles(slug, version);
    if (allFiles.length === 0) {
      return new Response(`Source not found: ${slug}@${version}`, { status: 404 });
    }

    // Write source files to a temp dir for Bun.build
    // Bun.build doesn't support in-memory virtual filesystems, so we write to tmp
    const tmpDir = `/tmp/fe-jit/${slug}/${version}`;
    for (const file of allFiles) {
      const src = await storage.fetchFile(slug, version, file);
      if (src === null) continue;
      const dest = `${tmpDir}/${file}`;
      await Bun.write(dest, src);
    }

    const result = await Bun.build({
      entrypoints: [`${tmpDir}/${filePath}`],
      format: "esm",
      target: "browser",
      // Externalize all fe(...) cross-MFE imports — the browser resolves these via import maps
      external,
    });

    if (!result.success) {
      const msgs = result.logs.map((l: { message: string }) => l.message).join("\n");
      return new Response(`JIT compile error:\n${msgs}`, { status: 500 });
    }

    const output = result.outputs[0];
    if (!output) {
      return new Response("JIT bundler produced no output", { status: 500 });
    }

    const js = await output.text();

    cache.set(cacheKey, { js });

    return new Response(js, {
      headers: {
        "Content-Type": "application/javascript",
        // Immutable: version is pinned, output never changes
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return { handle };
}
