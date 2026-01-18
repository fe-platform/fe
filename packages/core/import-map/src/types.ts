/**
 * Import map types for the FE platform
 * Based on WICG Import Maps specification
 */

/**
 * Import map structure
 * @see https://github.com/WICG/import-maps
 */
export interface ImportMap {
  /** Top-level import mappings */
  imports?: ImportMapEntries;

  /** Scoped import mappings */
  scopes?: ImportMapScopes;

  /** Integrity metadata (optional) */
  integrity?: IntegrityMetadata;
}

/**
 * Import mapping entries (specifier -> URL)
 */
export interface ImportMapEntries {
  [specifier: string]: string;
}

/**
 * Scoped mappings (scope URL -> mappings)
 */
export interface ImportMapScopes {
  [scopeUrl: string]: ImportMapEntries;
}

/**
 * Integrity metadata for subresource integrity
 */
export interface IntegrityMetadata {
  [url: string]: string;
}

/**
 * Configuration for generating an import map
 */
export interface ImportMapConfig {
  /** Base CDN URL */
  cdnUrl: string;

  /** Environment name */
  environment?: string;

  /** MFE entries to include */
  mfes: MfeEntry[];

  /** Platform package entries */
  platform?: PlatformEntry[];

  /** External library entries */
  externals?: ExternalEntry[];
}

/**
 * MFE entry for import map generation
 */
export interface MfeEntry {
  /** Package name (e.g., "@myorg/my-mfe") */
  name: string;

  /** Version */
  version: string;

  /** Entry point URL (relative to CDN or absolute) */
  url?: string;

  /** Dependencies to include in scope */
  dependencies?: Record<string, string>;
}

/**
 * Platform package entry
 */
export interface PlatformEntry {
  /** Platform package specifier (e.g., "fe:state") */
  specifier: string;

  /** Version */
  version: string;

  /** URL (relative to CDN or absolute) */
  url?: string;
}

/**
 * External library entry
 */
export interface ExternalEntry {
  /** Package name (e.g., "react") */
  name: string;

  /** Version */
  version: string;

  /** URL (relative to CDN or absolute) */
  url?: string;
}

/**
 * Options for import map generation
 */
export interface ImportMapGeneratorOptions {
  /** Whether to include integrity hashes */
  includeIntegrity?: boolean;

  /** Whether to use trailing slashes for directory mappings */
  trailingSlash?: boolean;

  /** Custom URL builder function */
  urlBuilder?: (entry: MfeEntry | PlatformEntry | ExternalEntry) => string;
}
