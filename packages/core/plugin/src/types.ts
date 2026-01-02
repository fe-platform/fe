/**
 * Core plugin system types for the FE platform.
 * All plugins implement these interfaces to integrate with the platform.
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PlatformConfig {
  name: string;
  version: string;
  [key: string]: unknown;
}

export interface BuildContext {
  entryPoints: string[];
  outdir: string;
  platform: "browser" | "node";
  minify: boolean;
}

export interface BuildResult {
  success: boolean;
  outputs: string[];
  errors: Error[];
  warnings: string[];
}

export interface TransformContext {
  source: string;
  path: {
    absolute: string;
    relative: string;
    extname: string;
  };
}

export interface TransformResult {
  code: string;
  map?: string;
  type?: "js" | "css" | "json";
}

export interface ResolveContext {
  specifier: string;
  importer: string;
}

export interface ResolveResult {
  path: string;
  external?: boolean;
}

export interface PublishContext {
  packageName: string;
  version: string;
  files: string[];
}

export interface DevServerContext {
  port: number;
  host: string;
  root: string;
}

export type HookCallback<T> = (context: T) => Promise<void | T> | void | T;

export interface Hook<T> {
  tap(name: string, callback: HookCallback<T>): void;
  call(context: T): Promise<T>;
}

export interface PluginHooks {
  onBuildStart: Hook<BuildContext>;
  onBuildEnd: Hook<BuildResult>;
  onTransform: Hook<TransformContext>;
  onResolve: Hook<ResolveContext>;
  onPublish: Hook<PublishContext>;
  onDevServerStart: Hook<DevServerContext>;
}

export interface PluginContext {
  hooks: PluginHooks;
  config: PlatformConfig;
  logger: Logger;
}

export interface Plugin<TConfig = unknown> {
  name: string;
  version: string;
  config?: TConfig;
  setup: (context: PluginContext) => Promise<void> | void;
  teardown?: () => Promise<void> | void;
}
