/// <reference types="bun-types" />
import type { BuildOptions, JitPlugin, SourceStorage } from "@fe/core";
import { SolidPlugin } from "bun-plugin-solid";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

export interface CompileOptions {
  entrypoints: string[];
  outdir?: string;
  external?: string[];
  rootDir: string;
  naming?: string | Record<string, string>;
  plugins?: unknown[];
}

export async function compileMfe(options: CompileOptions) {
  const { entrypoints, outdir, external = ["@*/fe.*", "fe.*"], rootDir, naming, plugins } = options;

  let buildPlugins: unknown[];
  if (plugins !== undefined) {
    buildPlugins = plugins;
  } else {
    let hasSolid = false;
    try {
      const pkgJsonPath = join(rootDir, "package.json");
      if (existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
        if (pkg.dependencies?.["solid-js"] || pkg.devDependencies?.["solid-js"]) {
          hasSolid = true;
        }
      }
    } catch (e) {
      // ignore
    }
    buildPlugins = hasSolid ? [SolidPlugin()] : [];
  }

  const result = await Bun.build({
    entrypoints,
    outdir,
    format: "esm",
    target: "browser",
    external,
    plugins: buildPlugins as Parameters<typeof Bun.build>[0]["plugins"],
    naming,
  });

  return result;
}

export interface JITBundlerOptions {
  storage: SourceStorage;
  external?: string[];
  jitPlugins?: JitPlugin[];
}

type CacheEntry = { js: string };

async function jitHandle(
  req: Request,
  storage: SourceStorage,
  cache: Map<string, CacheEntry>,
  external: string[],
  jitPlugins: JitPlugin[],
): Promise<Response | null> {
  const url = new URL(req.url);
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

  const allFiles = await storage.listFiles(slug, version);
  if (allFiles.length === 0) {
    return new Response(`Source not found: ${slug}@${version}`, { status: 404 });
  }

  const tmpDir = `/tmp/fe-jit/${slug}/${version}`;
  for (const file of allFiles) {
    const src = await storage.fetchFile(slug, version, file);
    if (src === null) continue;
    const dest = `${tmpDir}/${file}`;
    await Bun.write(dest, src);
  }

  let plugins: unknown[] | undefined;
  if (jitPlugins.length > 0) {
    let opts: BuildOptions = {
      entrypoints: [`${tmpDir}/${filePath}`],
      format: "esm",
      target: "browser",
      external,
    };
    for (const jp of jitPlugins) {
      opts = jp.transform(opts);
    }
    plugins = opts.plugins;
  }

  const result = await compileMfe({
    entrypoints: [`${tmpDir}/${filePath}`],
    external,
    rootDir: tmpDir,
    plugins,
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
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function createJITBundler(options: JITBundlerOptions) {
  const { storage, external = ["@*/fe.*", "fe.*"], jitPlugins = [] } = options;
  const cache = new Map<string, CacheEntry>();

  return { handle: (req: Request) => jitHandle(req, storage, cache, external, jitPlugins) };
}
