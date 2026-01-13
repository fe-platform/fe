/**
 * Manifest parser - reads and parses fe.json files
 */

import type { MfeManifest } from "./types.ts";

/**
 * Parse a manifest from JSON string
 * @param content - JSON string content
 * @returns Parsed manifest
 * @throws Error if JSON is invalid
 */
export function parseManifest(content: string): MfeManifest {
  try {
    const manifest = JSON.parse(content);
    return manifest as MfeManifest;
  } catch (error) {
    throw new Error(`Failed to parse manifest: ${error}`);
  }
}

/**
 * Parse a manifest from a file
 * @param path - Path to fe.json
 * @returns Parsed manifest
 */
export async function parseManifestFile(path: string): Promise<MfeManifest> {
  try {
    const file = Bun.file(path);
    const content = await file.text();
    return parseManifest(content);
  } catch (error) {
    throw new Error(`Failed to read manifest file ${path}: ${error}`);
  }
}

/**
 * Stringify a manifest to JSON
 * @param manifest - Manifest object
 * @param pretty - Whether to format with indentation
 * @returns JSON string
 */
export function stringifyManifest(manifest: MfeManifest, pretty = true): string {
  return JSON.stringify(manifest, null, pretty ? 2 : 0);
}

/**
 * Write a manifest to a file
 * @param path - Path to fe.json
 * @param manifest - Manifest object
 */
export async function writeManifestFile(path: string, manifest: MfeManifest): Promise<void> {
  const content = stringifyManifest(manifest);
  await Bun.write(path, content);
}
