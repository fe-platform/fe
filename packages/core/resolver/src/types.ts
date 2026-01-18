/**
 * Resolver types for fe: specifier resolution
 */

import type { ImportMap } from "@fe/import-map";

/**
 * Resolution context
 */
export interface ResolverContext {
  /** The import map to use for resolution */
  importMap: ImportMap;

  /** Base URL for relative resolution */
  baseUrl?: string;
}

/**
 * Resolution result
 */
export interface ResolveResult {
  /** The resolved URL */
  url: string;

  /** Whether this is an external (non-fe:) specifier */
  external: boolean;

  /** The original specifier */
  specifier: string;
}

/**
 * Resolution options
 */
export interface ResolveOptions {
  /** Parent URL for scoped resolution */
  parentUrl?: string;

  /** Whether to throw on unresolved specifiers */
  throwOnUnresolved?: boolean;
}
