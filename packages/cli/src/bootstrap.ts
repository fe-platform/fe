import { Hooks } from "@fe/core";
import type { CliContext, Plugin } from "@fe/core";
import { loadExternalPlugins } from "./plugin-loader";

import { createBunBuilder } from "./adapters/bun-builder";
import { createJsonConfigProvider } from "./adapters/json-config-provider";

import { buildPlugin } from "./plugins/build";
import { createJsonManifestManager } from "./adapters/json-manifest-manager";
import { createLocalArtifactStorage } from "./adapters/local-artifact-storage";
import { adminPlugin } from "./plugins/admin";
import { devPlugin } from "./plugins/dev";
import { linkPlugin } from "./plugins/link";
import { servePlugin } from "./plugins/serve";
import { checkPlugin } from "./plugins/check";

const BUILTIN_PLUGINS: Plugin[] = [buildPlugin, servePlugin, devPlugin, linkPlugin, adminPlugin, checkPlugin];

export async function bootstrap(root: string): Promise<{ ctx: CliContext; hooks: Hooks }> {
  const configProvider = createJsonConfigProvider(root);
  const feConfig = await configProvider.get();

  const ctx: CliContext = {
    root,
    adapters: {
      config: configProvider,
      artifactStorage: createLocalArtifactStorage(root, feConfig.uploadsDir),
      manifest: createJsonManifestManager(root, feConfig.manifestPath),
      builder: createBunBuilder(),
    },
    commands: new Map(),
  };

  const hooks = new Hooks();

  const externalPlugins = await loadExternalPlugins(root, feConfig.plugins);

  for (const plugin of [...BUILTIN_PLUGINS, ...externalPlugins]) {
    await plugin.setup(ctx, hooks);
  }

  return { ctx, hooks };
}
