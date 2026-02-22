---
sidebar_position: 1
---

# @fe/core

`@fe/core` is the shared type contract for the fe platform. It contains no runtime logic — only TypeScript interfaces and the `Hooks` class. Both `@fe/cli` and external plugins import from here.

## `FeConfig`

The CLI configuration schema. Read via `ConfigProvider`; the default implementation reads `configs/fe.config.json`.

```ts
interface FeConfig {
  plugins?:      string[];   // npm packages to load as CLI plugins (default: [])
  manifestPath?: string;     // path to platform.json (default: "configs/platform.json")
  uploadsDir?:   string;     // artifact directory (default: "uploads")
  sourcesDir?:   string;     // source upload directory (default: "sources")
  shellDir?:     string;     // host application directory (default: "shell")
}
```

All fields are optional. The CLI merges defaults for any absent fields.

## Adapter Interfaces

### `ConfigProvider`

```ts
interface ConfigProvider {
  get(): Promise<Required<FeConfig>>;
}
```

Returns the CLI config with all defaults applied. Stored at `ctx.adapters.config`. Plugins may swap this to pull config from environment variables, remote APIs, or any other source.

### `SourceStorage`

```ts
interface SourceStorage {
  upload(slug: string, version: string, srcDir: string): Promise<string>;
  fetchFile(slug: string, version: string, relativePath: string): Promise<string | null>;
  listFiles(slug: string, version: string): Promise<string[]>;
}
```

Used by `fe publish` to store raw MFE source and by the JIT bundler to retrieve it for on-demand compilation.

### `ArtifactStorage`

```ts
interface ArtifactStorage {
  upload(slug: string, version: string, distDir: string): Promise<string>;
  exists(slug: string, version: string): Promise<boolean>;
}
```

Used by `fe admin upload` for pre-built artifact uploads.

### `ManifestManager`

```ts
interface ManifestManager {
  read(): Promise<PlatformConfig>;
  write(config: PlatformConfig): Promise<void>;
  registerPackage(specifier: string, version: string, entry: PackageVersion): Promise<void>;
}
```

Reads and writes `platform.json`. `registerPackage` adds or updates a single version entry in the packages section without affecting routes.

### `Builder`

```ts
interface Builder {
  build(options: BuildOptions): Promise<BuildResult>;
}
```

Wraps `Bun.build()`. Swappable by plugins for testing or custom bundling.

## `CliContext`

The object passed to every plugin's `setup` function:

```ts
interface CliContext {
  root: string;
  adapters: {
    config:          ConfigProvider;
    sourceStorage:   SourceStorage;
    artifactStorage: ArtifactStorage;
    manifest:        ManifestManager;
    builder:         Builder;
  };
  commands: Map<string, CommandDef>;
}

interface CommandDef {
  name: string;
  description: string;
  usage: string;
  run(args: string[]): Promise<void>;
}
```

`root` is the absolute path of the directory from which `fe` was invoked. All relative paths in adapters are resolved against it.

## `Plugin`

```ts
interface Plugin {
  name: string;
  setup(ctx: CliContext, hooks: Hooks): void | Promise<void>;
}
```

`setup` is called once during CLI bootstrap. Builtin plugins run first; external plugins run after and may replace any adapter.

## `Hooks`

```ts
class Hooks {
  hook(event: keyof HookMap, handler: ...): void
  callHook(event, ...args): Promise<void>
  waterfall<T>(event, value: T): Promise<T>
}
```

`waterfall` passes a value through each registered handler in turn, allowing handlers to transform it. The `build:options` hook uses this pattern.

Key lifecycle events:

| Event | When it fires |
|-------|---------------|
| `build:before` | Before a target is built |
| `build:options` (waterfall) | To transform `BuildOptions` before `Bun.build` |
| `build:after` | After a successful build |
| `serve:start` | When `fe serve` begins listening |
| `dev:start` | When `fe dev` begins watching |
| `dev:rebuild` | After each rebuild in dev mode |
| `publish:before` | Before source upload |
| `publish:after` | After manifest registration |

## `PlatformConfig` and `PackageVersion`

```ts
interface PlatformConfig {
  routes:   Record<string, string>;
  packages: Record<string, { versions: Record<string, PackageVersion> }>;
  devtools?: string;
}

interface PackageVersion {
  url:  string;
  deps: Record<string, string>;
}
```

These types are shared between the CLI (which writes `platform.json`) and any tool that needs to read or validate the manifest. See [Platform Config](../architecture/platform-config) for the full schema documentation.
