
# CLI Plugins

How to extend the `fe` CLI with plugins that swap adapters for artifact storage, config providers, and more.

## The Plugin Interface

```ts
import type { Plugin, CliContext } from "@fe/core";

export default {
  name: "my-plugin",
  setup(ctx: CliContext, hooks: Hooks): void | Promise<void> {
    // swap adapters, register commands, hook into lifecycle events
  }
} satisfies Plugin;
```

A plugin is an npm package that exports a `Plugin` object as its default export (or a named `plugin` export). The `setup` function receives the full `CliContext` and a `Hooks` instance.

## Registering a Plugin

Add the package name to `configs/fe.config.json`:

```json
{
  "plugins": ["@acme/fe-plugin-s3"]
}
```

Install it:

```bash
bun add -d @acme/fe-plugin-s3
```

The CLI loads all listed plugins after the built-in plugins, so external plugins can override any adapter the builtins set.

## What Plugins Can Do

### Swap Adapters

`CliContext.adapters` holds the five swappable subsystems:

| Adapter | Default implementation | What it does |
|---------|------------------------|--------------|
| `config` | `createJsonConfigProvider` | Reads `configs/fe.config.json` |
| `sourceStorage` | `createLocalSourceStorage` | Stores MFE source in `sources/` |
| `artifactStorage` | `createLocalArtifactStorage` | Stores built artifacts in `uploads/` |
| `manifest` | `createJsonManifestManager` | Reads/writes `platform.json` |
| `builder` | `createBunBuilder` | Runs `Bun.build()` |

Replace any adapter by assigning to `ctx.adapters.*` in `setup`:

```ts
setup(ctx) {
  ctx.adapters.artifactStorage = new S3ArtifactStorage("my-bucket");
}
```

### Register Commands

```ts
setup(ctx) {
  ctx.commands.set("deploy", {
    name: "deploy",
    description: "Deploy all published MFEs to production",
    usage: "deploy [--env staging|prod]",
    async run(args) {
      const config = await ctx.adapters.config.get();
      // ...
    }
  });
}
```

### Hook into Lifecycle Events

```ts
setup(ctx, hooks) {
  hooks.hook("publish:after", async (target, url, deps) => {
    await notifySlack(`Published ${target} at ${url}`);
  });
}
```

See `packages/core/AGENTS.md` for the full list of hook events.

## Reading Config from a Plugin

Always use `ctx.adapters.config.get()` — never import from CLI internals:

```ts
// correct
const feConfig = await ctx.adapters.config.get();

// wrong: this file does not exist
import { readFeConfig } from "@fe/cli/src/config";
```

A plugin that needs its own configuration can store it in `fe.config.json` using a namespaced key, or provide a separate config mechanism and read it in `setup`.

## Example: S3 Artifact Storage

```ts
import type { Plugin, ArtifactStorage } from "@fe/core";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

class S3ArtifactStorage implements ArtifactStorage {
  constructor(private bucket: string) {}

  async upload(slug: string, version: string, distDir: string): Promise<string> {
    // read dist/ files and upload to S3
    return `https://${this.bucket}.s3.amazonaws.com/${slug}/${version}/index.js`;
  }

  async exists(slug: string, version: string): Promise<boolean> {
    // HEAD request to check existence
    return false;
  }
}

export default {
  name: "acme-s3",
  setup(ctx) {
    ctx.adapters.artifactStorage = new S3ArtifactStorage(
      process.env.S3_BUCKET ?? "my-mfe-artifacts"
    );
  }
} satisfies Plugin;
```
