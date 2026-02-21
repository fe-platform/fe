import { join } from "path";
import { readFileSync } from "fs";
import type { ManifestManager } from "../core/adapters";
import type { PlatformConfig, PackageVersion } from "../core/types";

export function createJsonManifestManager(root: string): ManifestManager {
  const configPath = join(root, "configs", "platform.json");

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
