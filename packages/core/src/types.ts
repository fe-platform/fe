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
}

export interface BuildOptions {
  entrypoints: string[];
  outdir: string;
  format: "esm";
  target: "browser";
  external: string[];
  naming?: string;
  /** Absolute path to the package root (for framework detection). */
  rootDir?: string;
}

export interface BuildResult {
  success: boolean;
  logs: unknown[];
}
