import type { PlatformConfig, PackageVersion, BuildOptions, BuildResult } from "./types";

/** Where built artifacts are stored and served from. */
export interface ArtifactStorage {
  /** Copy dist/ contents to the storage backend. Returns the public URL. */
  upload(slug: string, version: string, distDir: string): Promise<string>;
  /** Check whether an artifact exists. */
  exists(slug: string, version: string): Promise<boolean>;
}

/** How the platform manifest (routes + packages registry) is read and written. */
export interface ManifestManager {
  read(): Promise<PlatformConfig>;
  write(config: PlatformConfig): Promise<void>;
  /** Register a single package version (merge into existing). */
  registerPackage(specifier: string, version: string, entry: PackageVersion): Promise<void>;
}

/** Abstraction over the JS bundler. */
export interface Builder {
  build(options: BuildOptions): Promise<BuildResult>;
}
