import { join } from "path";
import { readFileSync } from "fs";
import type { ManifestManager, PlatformConfig, PackageVersion } from "@fe/core";

export function createJsonManifestManager(root: string, manifestPath: string): ManifestManager {
  const configPath = join(root, manifestPath);

  return {
    async read() {
      const text = readFileSync(configPath, "utf8");
      return JSON.parse(text) as PlatformConfig;
    },

    async write(config) {
      await Bun.write(configPath, JSON.stringify(config, null, 2) + "\n");
    },

    async registerPackage(specifier, version, entry) {
      const config = await this.read();
      if (!config.packages[specifier]) {
        config.packages[specifier] = { versions: {} };
      }
      config.packages[specifier].versions[version] = entry;
      await this.write(config);
    },
  };
}
