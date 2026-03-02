/**
 * Schema for configs/fe.config.json — CLI configuration supplied by the
 * ConfigProvider adapter (default: JsonConfigProvider reads configs/fe.config.json).
 * Plugins may swap ctx.adapters.config to source these values elsewhere.
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
   * NPM package names of JIT compiler plugins to load.
   * Each package must export a default JitPlugin (or named `jitPlugin`) with
   * a `transform(options: BuildOptions): BuildOptions` method.
   * JIT plugins run during every `fe build`, `fe check`, and JIT bundle request.
   * @example ["@fe/jit-plugin-solid", "@fe/jit-plugin-react"]
   */
  jitPlugins?: string[];

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

  /**
   * Path to the sources directory, relative to workspace root.
   * `fe publish` uploads raw MFE source code here.
   * The `@fe/runtime` JIT bundler reads source files from here by default.
   * @default "sources"
   */
  sourcesDir?: string;
}
