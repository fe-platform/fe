/**
 * File-based config provider (file://)
 * Reads and writes JSON config files from the local filesystem.
 */

import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { ConfigProvider, ConfigValue, ConfigObject } from "./types.ts";
import { getByPath, setByPath, validateConfigValue } from "./utils.ts";

export interface FileProviderOptions {
  basePath: string;
}

/**
 * File-based configuration provider
 * Stores config as JSON files in a directory structure
 */
export class FileProvider implements ConfigProvider {
  private basePath: string;

  constructor(options: FileProviderOptions) {
    this.basePath = options.basePath;
  }

  async get(key: string): Promise<ConfigValue | undefined> {
    const [namespace, ...rest] = key.split(".");
    if (!namespace) {
      return undefined;
    }

    const config = await this.getAll(namespace);
    if (!config) {
      return undefined;
    }

    if (rest.length === 0) {
      return config;
    }

    return getByPath(config, rest.join("."));
  }

  async set(key: string, value: ConfigValue): Promise<void> {
    const [namespace, ...rest] = key.split(".");
    if (!namespace) {
      throw new Error("Invalid key: must include namespace");
    }

    validateConfigValue(value);

    const config = (await this.getAll(namespace)) || {};

    if (rest.length === 0) {
      throw new Error("Cannot set entire namespace with set(), use setAll()");
    }

    setByPath(config, rest.join("."), value);
    await this.setAll(namespace, config);
  }

  async getAll(namespace: string): Promise<ConfigObject | undefined> {
    const filePath = this.getFilePath(namespace);

    if (!existsSync(filePath)) {
      return undefined;
    }

    try {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content) as ConfigObject;
    } catch (error) {
      throw new Error(`Failed to read config ${namespace}: ${error}`);
    }
  }

  async setAll(namespace: string, value: ConfigObject): Promise<void> {
    validateConfigValue(value);

    const filePath = this.getFilePath(namespace);
    const dir = dirname(filePath);

    // Ensure directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    try {
      const content = JSON.stringify(value, null, 2);
      await writeFile(filePath, content, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write config ${namespace}: ${error}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return existsSync(this.basePath);
  }

  private getFilePath(namespace: string): string {
    return join(this.basePath, `${namespace}.json`);
  }
}

/**
 * Create a file-based config provider from a URI
 * @param uri - file:// URI (e.g., "file:///path/to/config")
 * @returns FileProvider instance
 */
export function createFileProvider(uri: string): FileProvider {
  const match = uri.match(/^file:\/\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid file:// URI: ${uri}`);
  }

  return new FileProvider({ basePath: match[1] });
}
