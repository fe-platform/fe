import type { PlatformConfig, PackageVersion, BuildOptions, BuildResult } from "./types";
import type { FeConfig } from "./fe-config";

export interface ConfigProvider {
  get(): Promise<Required<FeConfig>>;
}

export interface ArtifactStorage {
  upload(slug: string, version: string, distDir: string): Promise<string>;
  exists(slug: string, version: string): Promise<boolean>;
}

export interface ManifestManager {
  read(): Promise<PlatformConfig>;
  write(config: PlatformConfig): Promise<void>;
  registerPackage(specifier: string, version: string, entry: PackageVersion): Promise<void>;
}

export interface Builder {
  build(options: BuildOptions): Promise<BuildResult>;
}
