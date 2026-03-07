export type ImportMap = { imports: Record<string, string> };

export interface PackageVersion {
  url: string;
  deps: Record<string, string>;
}

export interface PackageEntry {
  versions: Record<string, PackageVersion>;
}

export interface PlatformConfig {
  routes: Record<string, string>;
  packages: Record<string, PackageEntry>;
  devtools?: string;
  /**
   * Specifier@version strings to preload on platform initialisation.
   * Preloading resolves the dep graph, injects the import map, and queues a
   * `<link rel="modulepreload">` hint so the browser fetches the module early.
   * @example ["@acme/fe.mfe-b@1.0.0", "@acme/fe.mfe-a@1.0.0"]
   */
  preload?: string[];
}

export interface BuildOptions {
  entrypoints: string[];
  outdir?: string;
  format: "esm";
  target: "browser";
  external: string[];
  naming?: string;
  /** Absolute path to the package root (for framework detection). */
  rootDir?: string;
  /** Bun build plugins. When set, the compiler skips framework auto-detection. */
  plugins?: unknown[];
}

export interface BuildResult {
  success: boolean;
  logs: unknown[];
}
