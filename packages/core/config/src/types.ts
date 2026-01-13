/**
 * Configuration types for the FE platform.
 * All configuration is JSON-only as per ADR-018.
 */

/**
 * Platform configuration (platform.json)
 * Defines core platform settings and metadata.
 */
export interface PlatformConfig {
  name: string;
  version: string;
  org: string;
  registry?: {
    url: string;
    source?: string;
    build?: string;
  };
  [key: string]: unknown;
}

/**
 * Environment configuration (environments.json)
 * Defines deployment environments and their settings.
 */
export interface Environment {
  name: string;
  url: string;
  cdnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface EnvironmentsConfig {
  environments: Environment[];
}

/**
 * Rollout configuration (rollout.json)
 * Tracks rollout state per MFE and environment.
 */
export interface RolloutState {
  mfeName: string;
  environment: string;
  rolledOut: string;
  rollingOut?: {
    version: string;
    percentage: number;
  };
}

export interface RolloutConfig {
  states: RolloutState[];
}

/**
 * Governance configuration (governance.json)
 * Defines scoring thresholds and permission rules.
 */
export interface GovernanceConfig {
  scoring?: {
    bundleSize?: {
      maxKb: number;
      weight: number;
    };
    coverage?: {
      minPercent: number;
      weight: number;
    };
    accessibility?: {
      minScore: number;
      weight: number;
    };
  };
  permissions?: {
    allowedScopes?: string[];
    checksumVerification?: boolean;
  };
}

/**
 * Generic config value type
 */
export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray;
export interface ConfigObject {
  [key: string]: ConfigValue;
}
export type ConfigArray = ConfigValue[];

/**
 * ConfigProvider interface - abstraction for config storage
 * Implementations: file://, s3://, consul://, etcd://, postgres://, http://
 */
export interface ConfigProvider {
  /**
   * Retrieve a configuration value by key path
   * @param key - Dot-separated path (e.g., "platform.name")
   * @returns The configuration value or undefined if not found
   */
  get(key: string): Promise<ConfigValue | undefined>;

  /**
   * Set a configuration value by key path
   * @param key - Dot-separated path
   * @param value - The value to set
   */
  set(key: string, value: ConfigValue): Promise<void>;

  /**
   * Get the entire configuration object for a namespace
   * @param namespace - The config namespace (e.g., "platform", "environments")
   * @returns The configuration object
   */
  getAll(namespace: string): Promise<ConfigObject | undefined>;

  /**
   * Set the entire configuration object for a namespace
   * @param namespace - The config namespace
   * @param value - The configuration object
   */
  setAll(namespace: string, value: ConfigObject): Promise<void>;

  /**
   * Check if the provider is available and accessible
   */
  isAvailable(): Promise<boolean>;

  /**
   * Close any resources held by the provider
   */
  close?(): Promise<void>;
}

/**
 * Config provider URI schemes
 */
export type ConfigProviderScheme = "file" | "s3" | "consul" | "etcd" | "postgres" | "http" | "https";

/**
 * Options for creating a config provider
 */
export interface ConfigProviderOptions {
  uri: string;
  basePath?: string;
  timeout?: number;
  [key: string]: unknown;
}
