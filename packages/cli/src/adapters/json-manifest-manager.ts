import { join } from "path";
import { readFileSync } from "fs";
import type { ManifestManager, PlatformConfig, PackageVersion } from "@fe/core";

async function jsonRegisterPackage(
  configPath: string,
  specifier: string,
  version: string,
  entry: PackageVersion,
): Promise<void> {
  const text = readFileSync(configPath, "utf8");
  const config = JSON.parse(text) as PlatformConfig;
  if (!config.packages[specifier]) {
    config.packages[specifier] = { versions: {} };
  }
  config.packages[specifier].versions[version] = entry;
  await Bun.write(configPath, JSON.stringify(config, null, 2) + "\n");
}

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

    registerPackage: (specifier, version, entry) =>
      jsonRegisterPackage(configPath, specifier, version, entry),
  };
}
