/**
 * Import map generator - generates import maps from configuration
 */

import type {
  ImportMap,
  ImportMapConfig,
  ImportMapGeneratorOptions,
  MfeEntry,
  PlatformEntry,
  ExternalEntry,
} from "./types.ts";

/**
 * Generate an import map from configuration
 * @param config - Import map configuration
 * @param options - Generator options
 * @returns Generated import map
 */
export function generateImportMap(
  config: ImportMapConfig,
  options: ImportMapGeneratorOptions = {}
): ImportMap {
  const { trailingSlash = true, urlBuilder } = options;
  const imports: Record<string, string> = {};
  const scopes: Record<string, Record<string, string>> = {};

  // Add platform packages
  if (config.platform) {
    for (const entry of config.platform) {
      const url = urlBuilder
        ? urlBuilder(entry)
        : buildPlatformUrl(config.cdnUrl, entry);

      imports[entry.specifier] = url;
    }
  }

  // Add externals (e.g., React, Vue)
  if (config.externals) {
    for (const entry of config.externals) {
      const url = urlBuilder
        ? urlBuilder(entry)
        : buildExternalUrl(config.cdnUrl, entry);

      imports[entry.name] = url;
    }
  }

  // Add MFEs
  for (const mfe of config.mfes) {
    const mfeUrl = urlBuilder
      ? urlBuilder(mfe)
      : buildMfeUrl(config.cdnUrl, mfe);

    // Add MFE to imports
    const specifier = `fe:${mfe.name}`;
    imports[specifier] = mfeUrl;

    // Add scoped dependencies if any
    if (mfe.dependencies && Object.keys(mfe.dependencies).length > 0) {
      const scopeBase = getScopeBase(mfeUrl);
      const scopeUrl = trailingSlash && !scopeBase.endsWith("/")
        ? `${scopeBase}/`
        : scopeBase;

      scopes[scopeUrl] = scopes[scopeUrl] || {};

      for (const [depName, depVersion] of Object.entries(mfe.dependencies)) {
        if (depName.startsWith("fe:")) {
          // Platform package or other MFE
          const depUrl = buildMfeOrPlatformUrl(config.cdnUrl, depName, depVersion);
          scopes[scopeUrl][depName] = depUrl;
        } else {
          // External library
          const depUrl = buildExternalUrl(config.cdnUrl, {
            name: depName,
            version: depVersion,
          });
          scopes[scopeUrl][depName] = depUrl;
        }
      }
    }
  }

  const importMap: ImportMap = {
    imports,
  };

  if (Object.keys(scopes).length > 0) {
    importMap.scopes = scopes;
  }

  return importMap;
}

/**
 * Build URL for a platform package
 */
function buildPlatformUrl(cdnUrl: string, entry: PlatformEntry): string {
  if (entry.url) {
    return entry.url.startsWith("http") ? entry.url : `${cdnUrl}${entry.url}`;
  }

  // Extract package name from specifier (fe:state -> state)
  const packageName = entry.specifier.replace(/^fe:/, "");
  return `${cdnUrl}/platform/${packageName}/${entry.version}/index.js`;
}

/**
 * Build URL for an external library
 */
function buildExternalUrl(
  cdnUrl: string,
  entry: ExternalEntry
): string {
  if (entry.url) {
    return entry.url.startsWith("http") ? entry.url : `${cdnUrl}${entry.url}`;
  }

  return `${cdnUrl}/vendor/${entry.name}/${entry.version}/index.js`;
}

/**
 * Build URL for an MFE
 */
function buildMfeUrl(cdnUrl: string, entry: MfeEntry): string {
  if (entry.url) {
    return entry.url.startsWith("http") ? entry.url : `${cdnUrl}${entry.url}`;
  }

  return `${cdnUrl}/mfes/${entry.name}/${entry.version}/index.js`;
}

/**
 * Build URL for MFE or platform package by specifier
 */
function buildMfeOrPlatformUrl(
  cdnUrl: string,
  specifier: string,
  version: string
): string {
  if (specifier.startsWith("fe:@")) {
    // MFE reference
    const packageName = specifier.replace(/^fe:/, "");
    return `${cdnUrl}/mfes/${packageName}/${version}/index.js`;
  } else if (specifier.startsWith("fe:")) {
    // Platform package
    const packageName = specifier.replace(/^fe:/, "");
    return `${cdnUrl}/platform/${packageName}/${version}/index.js`;
  }

  throw new Error(`Invalid fe: specifier: ${specifier}`);
}

/**
 * Get the scope base URL from an MFE URL
 * Extracts the directory containing the MFE
 */
function getScopeBase(url: string): string {
  const lastSlash = url.lastIndexOf("/");
  return url.substring(0, lastSlash);
}

/**
 * Serialize an import map to JSON string
 * @param importMap - Import map to serialize
 * @param pretty - Whether to pretty-print
 * @returns JSON string
 */
export function serializeImportMap(importMap: ImportMap, pretty = true): string {
  return JSON.stringify(importMap, null, pretty ? 2 : 0);
}

/**
 * Generate import map HTML script tag
 * @param importMap - Import map to embed
 * @returns HTML script tag string
 */
export function generateImportMapScript(importMap: ImportMap): string {
  const json = serializeImportMap(importMap);
  return `<script type="importmap">\n${json}\n</script>`;
}
