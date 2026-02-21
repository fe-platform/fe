export type ImportMap = { imports: Record<string, string> };

export interface PackageVersion {
  url: string;
  deps: Record<string, string>; // specifier -> semver range (e.g. "^1.0.0")
}

export interface PackageEntry {
  versions: Record<string, PackageVersion>;
}

export interface PlatformConfig {
  routes: Record<string, string>; // path -> "specifier@version"
  packages: Record<string, PackageEntry>;
  devtools?: string; // "specifier@version" — optional, opt-in per environment
}

export interface BuildOptions {
  entrypoints: string[];
  outdir: string;
  format: "esm";
  target: "browser";
  external: string[];
  naming?: string;
}

export interface BuildResult {
  success: boolean;
  logs: unknown[];
}
