/**
 * fe: specifier resolver
 * Resolves import specifiers using import maps
 */

import type { ImportMap } from "@fe/import-map";
import type { ResolverContext, ResolveResult, ResolveOptions } from "./types.ts";

/**
 * Create a resolver with an import map
 * @param importMap - The import map to use
 * @param baseUrl - Base URL for resolution
 * @returns Resolver function
 */
export function createResolver(importMap: ImportMap, baseUrl?: string) {
  const context: ResolverContext = { importMap, baseUrl };

  return {
    /**
     * Resolve a specifier to a URL
     * @param specifier - The specifier to resolve
     * @param options - Resolution options
     * @returns Resolution result
     */
    resolve(specifier: string, options: ResolveOptions = {}): ResolveResult {
      return resolveSpecifier(context, specifier, options);
    },

    /**
     * Check if a specifier can be resolved
     * @param specifier - The specifier to check
     * @param options - Resolution options
     * @returns true if resolvable
     */
    canResolve(specifier: string, options: ResolveOptions = {}): boolean {
      try {
        resolveSpecifier(context, specifier, { ...options, throwOnUnresolved: true });
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Resolve a specifier using import map
 * Implements the import map resolution algorithm
 */
export function resolveSpecifier(
  context: ResolverContext,
  specifier: string,
  options: ResolveOptions = {}
): ResolveResult {
  const { importMap } = context;
  const { parentUrl, throwOnUnresolved = false } = options;

  // Try scoped resolution first if we have a parent URL
  if (parentUrl && importMap.scopes) {
    const scopeUrl = getScopeUrl(parentUrl, importMap.scopes);
    if (scopeUrl) {
      const resolved = resolveFromScope(importMap.scopes[scopeUrl], specifier);
      if (resolved) {
        return createResult(specifier, resolved);
      }
    }
  }

  // Try top-level imports
  if (importMap.imports) {
    const resolved = resolveFromImports(importMap.imports, specifier);
    if (resolved) {
      return createResult(specifier, resolved);
    }
  }

  // Not found in import map
  if (throwOnUnresolved) {
    throw new Error(`Cannot resolve specifier: ${specifier}`);
  }

  // Return the specifier as-is (could be a relative/absolute URL)
  return createResult(specifier, specifier);
}

/**
 * Find the most specific scope URL for a parent URL
 */
function getScopeUrl(
  parentUrl: string,
  scopes: Record<string, Record<string, string>>
): string | undefined {
  // Find all matching scopes
  const matchingScopes = Object.keys(scopes).filter((scope) =>
    parentUrl.startsWith(scope)
  );

  if (matchingScopes.length === 0) {
    return undefined;
  }

  // Return the longest (most specific) match
  return matchingScopes.sort((a, b) => b.length - a.length)[0];
}

/**
 * Resolve from a scope or imports object
 */
function resolveFromImports(
  imports: Record<string, string>,
  specifier: string
): string | undefined {
  // Exact match
  if (specifier in imports) {
    return imports[specifier];
  }

  // Prefix match (for trailing slash mappings)
  for (const [key, value] of Object.entries(imports)) {
    if (key.endsWith("/") && specifier.startsWith(key)) {
      const suffix = specifier.substring(key.length);
      return value.endsWith("/") ? value + suffix : value + "/" + suffix;
    }
  }

  return undefined;
}

/**
 * Resolve from a scope
 */
function resolveFromScope(
  scope: Record<string, string>,
  specifier: string
): string | undefined {
  return resolveFromImports(scope, specifier);
}

/**
 * Create a resolution result
 */
function createResult(specifier: string, url: string): ResolveResult {
  return {
    specifier,
    url,
    external: !specifier.startsWith("fe:"),
  };
}

/**
 * Batch resolve multiple specifiers
 * @param context - Resolver context
 * @param specifiers - Array of specifiers to resolve
 * @param options - Resolution options
 * @returns Array of resolution results
 */
export function resolveMany(
  context: ResolverContext,
  specifiers: string[],
  options: ResolveOptions = {}
): ResolveResult[] {
  return specifiers.map((specifier) => resolveSpecifier(context, specifier, options));
}

/**
 * Check if a specifier is a fe: specifier
 * @param specifier - The specifier to check
 * @returns true if it's a fe: specifier
 */
export function isFESpecifier(specifier: string): boolean {
  return specifier.startsWith("fe:");
}

/**
 * Extract package name from fe: specifier
 * @param specifier - The fe: specifier
 * @returns Package name without fe: prefix
 */
export function extractPackageName(specifier: string): string {
  if (!isFESpecifier(specifier)) {
    throw new Error(`Not a fe: specifier: ${specifier}`);
  }
  return specifier.substring(3); // Remove "fe:"
}
