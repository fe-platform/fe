/**
 * Schema for fe.config.json — the declarative configuration file that
 * organizations place at their workspace root to extend @fe/cli behavior.
 */
export interface FeConfig {
  /**
   * NPM package names of @fe/cli plugins to load.
   * Plugins provide custom ArtifactStorage, ManifestManager, or additional
   * CLI commands specific to the organization's infrastructure.
   * @example ["@acme/fe-plugin-s3-storage", "@acme/fe-plugin-redis-manifest"]
   */
  plugins?: string[];

  /**
   * Path to the platform manifest, relative to workspace root.
   * @default "configs/platform.json"
   */
  manifestPath?: string;

  /**
   * Path to the uploads/artifacts directory, relative to workspace root.
   * @default "uploads"
   */
  uploadsDir?: string;

  /**
   * Path to the host application (shell) directory, relative to workspace root.
   * @default "shell"
   */
  shellDir?: string;
}
