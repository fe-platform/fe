/**
 * Utility functions for config manipulation
 */

import type { ConfigValue, ConfigObject } from "./types.ts";

/**
 * Get a value from an object using dot notation path
 * @param obj - The source object
 * @param path - Dot-separated path (e.g., "registry.url")
 * @returns The value at the path or undefined
 */
export function getByPath(obj: ConfigObject, path: string): ConfigValue | undefined {
  const keys = path.split(".");
  let current: ConfigValue = obj;

  for (const key of keys) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return undefined;
    }
    current = current[key];
    if (current === undefined) {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a value in an object using dot notation path
 * @param obj - The target object
 * @param path - Dot-separated path
 * @param value - The value to set
 */
export function setByPath(obj: ConfigObject, path: string, value: ConfigValue): void {
  const keys = path.split(".");
  const lastKey = keys.pop();
  if (!lastKey) {
    throw new Error("Invalid path: cannot be empty");
  }

  let current: ConfigValue = obj;
  for (const key of keys) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      throw new Error(`Cannot set path ${path}: intermediate value is not an object`);
    }

    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }

  if (typeof current !== "object" || current === null || Array.isArray(current)) {
    throw new Error(`Cannot set path ${path}: parent is not an object`);
  }

  current[lastKey] = value;
}

/**
 * Parse a config provider URI
 * @param uri - Provider URI (e.g., "file:///path/to/config", "s3://bucket/path")
 * @returns Parsed components
 */
export function parseProviderUri(uri: string): {
  scheme: string;
  path: string;
  host?: string;
} {
  // Match scheme://[host][path]
  const match = uri.match(/^([a-z0-9]+):\/\/(.*)$/);
  if (!match) {
    throw new Error(`Invalid provider URI: ${uri}`);
  }

  const [, scheme, rest] = match;

  // Split host and path
  const slashIndex = rest.indexOf("/");
  if (slashIndex === -1) {
    // No path, only host (or empty)
    return {
      scheme,
      host: rest || undefined,
      path: "/",
    };
  }

  const host = rest.substring(0, slashIndex);
  const path = rest.substring(slashIndex);

  return {
    scheme,
    host: host || undefined,
    path: path || "/",
  };
}

/**
 * Validate that a value is valid JSON-serializable config
 * @param value - The value to validate
 * @returns true if valid, throws otherwise
 */
export function validateConfigValue(value: unknown): value is ConfigValue {
  if (value === null || value === undefined) {
    return true;
  }

  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(validateConfigValue);
  }

  if (type === "object") {
    return Object.values(value as Record<string, unknown>).every(validateConfigValue);
  }

  throw new Error(`Invalid config value type: ${type}`);
}
