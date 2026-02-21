import { join } from "path";
import { cpSync, mkdirSync, existsSync } from "fs";
import type { ArtifactStorage } from "@fe/core";

export function createLocalArtifactStorage(root: string, uploadsDir: string): ArtifactStorage {
  const uploadsDirAbs = join(root, uploadsDir);

  return {
    async upload(slug, version, distDir) {
      const uploadPath = join(uploadsDirAbs, slug, version);
      mkdirSync(uploadPath, { recursive: true });
      cpSync(distDir, uploadPath, { recursive: true });
      return `./${uploadsDir}/${slug}/${version}/index.js`;
    },

    async exists(slug, version) {
      return existsSync(join(uploadsDirAbs, slug, version, "index.js"));
    },
  };
}
