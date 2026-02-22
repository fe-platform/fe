import { join } from "path";
import { cpSync, mkdirSync, existsSync, readdirSync, readFileSync } from "fs";
import type { SourceStorage } from "@fe/core";

/**
 * Default local filesystem SourceStorage adapter.
 * Stores uploaded MFE source files at `<root>/<sourcesDir>/<slug>/<version>/`.
 * This is the zero-config backend suitable for POC deployments.
 * For production, swap this with an S3, Cloudflare R2, or CDN-backed adapter.
 */
export function createLocalSourceStorage(root: string, sourcesDir: string): SourceStorage {
  const sourcesRoot = join(root, sourcesDir);

  function pkgPath(slug: string, version: string): string {
    return join(sourcesRoot, slug, version);
  }

  return {
    async upload(slug, version, srcDir) {
      const dest = pkgPath(slug, version);
      mkdirSync(dest, { recursive: true });
      cpSync(srcDir, dest, { recursive: true });
      return join(sourcesDir, slug, version);
    },

    async fetchFile(slug, version, relativePath) {
      const filePath = join(pkgPath(slug, version), relativePath);
      if (!existsSync(filePath)) return null;
      return readFileSync(filePath, "utf8");
    },

    async listFiles(slug, version) {
      const dir = pkgPath(slug, version);
      if (!existsSync(dir)) return [];
      const results: string[] = [];
      function walk(current: string, prefix: string) {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
          const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) walk(join(current, entry.name), rel);
          else results.push(rel);
        }
      }
      walk(dir, "");
      return results;
    },
  };
}
