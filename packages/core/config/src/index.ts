/**
 * @fe/config - Configuration provider abstraction for the FE platform
 *
 * Provides a unified interface for reading and writing platform configuration
 * from various backends (file://, s3://, consul://, etc.)
 *
 * Phase 1 includes file:// provider only.
 * Phase 13 will add remote providers.
 */

export * from "./types.ts";
export * from "./utils.ts";
export * from "./file-provider.ts";
