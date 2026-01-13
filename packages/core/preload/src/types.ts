/**
 * __fePreload runtime types
 */

/**
 * Module cache entry
 */
export interface ModuleCacheEntry {
  /** Module specifier */
  specifier: string;

  /** Resolved URL */
  url: string;

  /** Module exports */
  exports: any;

  /** Load timestamp */
  loadedAt: number;

  /** Loading state */
  state: "loading" | "loaded" | "error";

  /** Error if failed to load */
  error?: Error;
}

/**
 * Preload options
 */
export interface PreloadOptions {
  /** Timeout in milliseconds */
  timeout?: number;

  /** Whether to throw on error */
  throwOnError?: boolean;

  /** Custom error handler */
  onError?: (error: Error, specifier: string) => void;
}

/**
 * Preload result
 */
export interface PreloadResult<T = any> {
  /** Whether the load was successful */
  success: boolean;

  /** Module exports (if successful) */
  exports?: T;

  /** Error (if failed) */
  error?: Error;

  /** Specifier that was loaded */
  specifier: string;
}

/**
 * Global __fePreload function type
 */
export interface FEPreloadFunction {
  /**
   * Dynamically import a module
   * @param specifier - Module specifier (e.g., "fe:state")
   * @returns Promise resolving to module exports
   */
  (specifier: string): Promise<any>;

  /**
   * Preload a module without executing it
   * @param specifier - Module specifier
   * @param options - Preload options
   */
  preload(specifier: string, options?: PreloadOptions): Promise<void>;

  /**
   * Get the module cache
   */
  getCache(): Map<string, ModuleCacheEntry>;

  /**
   * Check if a module is loaded
   * @param specifier - Module specifier
   */
  isLoaded(specifier: string): boolean;

  /**
   * Clear the module cache
   */
  clearCache(): void;

  /**
   * Get statistics about loaded modules
   */
  getStats(): {
    total: number;
    loaded: number;
    loading: number;
    errors: number;
  };
}

/**
 * Global window extensions
 */
declare global {
  interface Window {
    __fePreload: FEPreloadFunction;
  }

  const __fePreload: FEPreloadFunction;
}
