import { join } from "path";
import { cpSync, mkdirSync, existsSync } from "fs";
import type { ArtifactStorage } from "../core/adapters";

export function createLocalArtifactStorage(root: string): ArtifactStorage {
  const uploadsDir = join(root, "uploads");

  return {
    async upload(slug, version, distDir) {
      const uploadPath = join(uploadsDir, slug, version);
      mkdirSync(uploadPath, { recursive: true });
      cpSync(distDir, uploadPath, { recursive: true });
      return `./uploads/${slug}/${version}/index.js`;
    },

    async exists(slug, version) {
      return existsSync(join(uploadsDir, slug, version, "index.js"));
    },
  };
}
