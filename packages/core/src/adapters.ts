import type { PlatformConfig, PackageVersion, BuildOptions, BuildResult } from "./types";
import type { FeConfig } from "./fe-config";

export interface ConfigProvider {
  get(): Promise<Required<FeConfig>>;
}

export interface ArtifactStorage {
  upload(slug: string, version: string, distDir: string): Promise<string>;
  exists(slug: string, version: string): Promise<boolean>;
}

/**
 * Adapter for storing and retrieving raw MFE source files.
 * Used by `fe publish` (upload side) and the JIT bundler (fetch side).
 * Swap this adapter to use S3, Cloudflare R2, GCS, or any custom storage.
 */
export interface SourceStorage {
  /**
   * Upload all files from `srcDir` for a package at a given version.
   * Returns the base URL/path under which files can be fetched.
   */
  upload(slug: string, version: string, srcDir: string): Promise<string>;

  /**
   * Fetch the raw text content of a specific source file.
   */
  fetchFile(slug: string, version: string, relativePath: string): Promise<string | null>;

  /**
   * List all file paths for a given slug+version (relative to the src root).
   */
  listFiles(slug: string, version: string): Promise<string[]>;
}

export interface ManifestManager {
  read(): Promise<PlatformConfig>;
  write(config: PlatformConfig): Promise<void>;
  registerPackage(specifier: string, version: string, entry: PackageVersion): Promise<void>;
}

export interface Builder {
  build(options: BuildOptions): Promise<BuildResult>;
}
