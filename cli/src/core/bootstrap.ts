import { join } from "path";
import { Hooks } from "./hooks";
import type { CliContext } from "./context";
import type { Plugin } from "./plugin";

// Default adapters
import { createLocalArtifactStorage } from "../adapters/local-artifact-storage";
import { createJsonManifestManager } from "../adapters/json-manifest-manager";
import { createBunBuilder } from "../adapters/bun-builder";

// Built-in plugins
import { buildPlugin } from "../plugins/build";
import { servePlugin } from "../plugins/serve";
import { devPlugin } from "../plugins/dev";
import { linkPlugin } from "../plugins/link";
import { adminPlugin } from "../plugins/admin";

const BUILTIN_PLUGINS: Plugin[] = [
  buildPlugin,
  servePlugin,
  devPlugin,
  linkPlugin,
  adminPlugin,
];

export async function bootstrap(extraPlugins: Plugin[] = []): Promise<{
  ctx: CliContext;
  hooks: Hooks;
}> {
  const root = join(import.meta.dir, "..", "..", "..");

  const ctx: CliContext = {
    root,
    adapters: {
      artifactStorage: createLocalArtifactStorage(root),
      manifest: createJsonManifestManager(root),
      builder: createBunBuilder(),
    },
    commands: new Map(),
  };

  const hooks = new Hooks();

  for (const plugin of [...BUILTIN_PLUGINS, ...extraPlugins]) {
    await plugin.setup(ctx, hooks);
  }

  return { ctx, hooks };
}
