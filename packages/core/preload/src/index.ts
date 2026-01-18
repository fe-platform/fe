/**
 * @fe/preload - __fePreload runtime for dynamic imports
 *
 * Provides the __fePreload runtime that handles dynamic imports in the browser.
 * Dynamic import() calls are rewritten to __fePreload() during build.
 */

export * from "./types.ts";
export * from "./runtime.ts";
