/**
 * __fePreload runtime implementation
 * Handles dynamic imports and module preloading
 */

import type {
  ModuleCacheEntry,
  PreloadOptions,
  PreloadResult,
  FEPreloadFunction,
} from "./types.ts";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Create the __fePreload runtime
 * @returns __fePreload function
 */
export function createPreloadRuntime(): FEPreloadFunction {
  const moduleCache = new Map<string, ModuleCacheEntry>();
  const loadingPromises = new Map<string, Promise<any>>();

  /**
   * Main preload function - dynamically imports a module
   */
  async function __fePreload(specifier: string): Promise<any> {
    // Check cache first
    const cached = moduleCache.get(specifier);
    if (cached) {
      if (cached.state === "loaded") {
        return cached.exports;
      }
      if (cached.state === "error") {
        throw cached.error;
      }
    }

    // Check if already loading
    if (loadingPromises.has(specifier)) {
      return loadingPromises.get(specifier);
    }

    // Start loading
    const loadPromise = loadModule(specifier);
    loadingPromises.set(specifier, loadPromise);

    try {
      const exports = await loadPromise;
      return exports;
    } finally {
      loadingPromises.delete(specifier);
    }
  }

  /**
   * Load a module
   */
  async function loadModule(specifier: string): Promise<any> {
    // Create cache entry
    const entry: ModuleCacheEntry = {
      specifier,
      url: specifier, // Import maps handle resolution
      exports: null,
      loadedAt: Date.now(),
      state: "loading",
    };
    moduleCache.set(specifier, entry);

    try {
      // Use native dynamic import - import maps will resolve the specifier
      const module = await import(/* @vite-ignore */ specifier);

      entry.exports = module;
      entry.state = "loaded";
      entry.loadedAt = Date.now();

      return module;
    } catch (error) {
      entry.state = "error";
      entry.error = error as Error;
      throw error;
    }
  }

  /**
   * Preload a module without executing it
   */
  async function preload(
    specifier: string,
    options: PreloadOptions = {}
  ): Promise<void> {
    const { timeout = DEFAULT_TIMEOUT, throwOnError = false, onError } = options;

    try {
      await Promise.race([
        __fePreload(specifier),
        createTimeout(timeout, specifier),
      ]);
    } catch (error) {
      if (onError) {
        onError(error as Error, specifier);
      }
      if (throwOnError) {
        throw error;
      }
    }
  }

  /**
   * Get the module cache
   */
  function getCache(): Map<string, ModuleCacheEntry> {
    return new Map(moduleCache);
  }

  /**
   * Check if a module is loaded
   */
  function isLoaded(specifier: string): boolean {
    const entry = moduleCache.get(specifier);
    return entry?.state === "loaded";
  }

  /**
   * Clear the module cache
   */
  function clearCache(): void {
    moduleCache.clear();
    loadingPromises.clear();
  }

  /**
   * Get statistics about loaded modules
   */
  function getStats() {
    let loaded = 0;
    let loading = 0;
    let errors = 0;

    for (const entry of moduleCache.values()) {
      if (entry.state === "loaded") loaded++;
      else if (entry.state === "loading") loading++;
      else if (entry.state === "error") errors++;
    }

    return {
      total: moduleCache.size,
      loaded,
      loading,
      errors,
    };
  }

  // Attach methods to the function
  __fePreload.preload = preload;
  __fePreload.getCache = getCache;
  __fePreload.isLoaded = isLoaded;
  __fePreload.clearCache = clearCache;
  __fePreload.getStats = getStats;

  return __fePreload as FEPreloadFunction;
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number, specifier: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout loading module: ${specifier} (${ms}ms)`));
    }, ms);
  });
}

/**
 * Install __fePreload as global
 */
export function installPreloadRuntime(): void {
  if (typeof window === "undefined") {
    throw new Error("__fePreload can only be installed in browser environment");
  }

  if (window.__fePreload) {
    console.warn("__fePreload already installed");
    return;
  }

  window.__fePreload = createPreloadRuntime();
}

/**
 * Batch preload multiple modules
 * @param specifiers - Array of specifiers to preload
 * @param options - Preload options
 * @returns Promise resolving to array of results
 */
export async function batchPreload(
  specifiers: string[],
  options: PreloadOptions = {}
): Promise<PreloadResult[]> {
  const results = await Promise.allSettled(
    specifiers.map(async (specifier) => {
      try {
        const exports = await window.__fePreload(specifier);
        return { success: true, exports, specifier } as PreloadResult;
      } catch (error) {
        return {
          success: false,
          error: error as Error,
          specifier,
        } as PreloadResult;
      }
    })
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      success: false,
      error: result.reason,
      specifier: "unknown",
    };
  });
}
