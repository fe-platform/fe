import { Hooks } from "@fe/core";
import type { CliContext, JitPlugin, Plugin } from "@fe/core";
import { loadExternalPlugins } from "./plugin-loader";

import { createBunBuilder } from "./adapters/bun-builder";
import { createJsonConfigProvider } from "./adapters/json-config-provider";

import { buildPlugin } from "./plugins/build";
import { createJsonManifestManager } from "./adapters/json-manifest-manager";
import { createLocalArtifactStorage } from "./adapters/local-artifact-storage";
import { createLocalSourceStorage } from "./adapters/local-source-storage";
import { adminPlugin } from "./plugins/admin";
import { publishPlugin } from "./plugins/publish";
import { devPlugin } from "./plugins/dev";
import { linkPlugin } from "./plugins/link";
import { servePlugin } from "./plugins/serve";
import { checkPlugin } from "./plugins/check";
import { newPlugin } from "./plugins/new";

const BUILTIN_PLUGINS: Plugin[] = [buildPlugin, servePlugin, devPlugin, linkPlugin, adminPlugin, publishPlugin, checkPlugin, newPlugin];

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
      sourceStorage: createLocalSourceStorage(root, feConfig.sourcesDir),
    },
    commands: new Map(),
    jitPlugins: [],
  };

  const hooks = new Hooks();

  const externalPlugins = await loadExternalPlugins(root, feConfig.plugins);

  for (const plugin of [...BUILTIN_PLUGINS, ...externalPlugins]) {
    await plugin.setup(ctx, hooks);
  }

  for (const name of feConfig.jitPlugins) {
    try {
      const mod = await import(name) as { default?: JitPlugin; jitPlugin?: JitPlugin };
      const jp = mod.default ?? mod.jitPlugin;
      if (!jp || typeof jp.transform !== "function") {
        throw new Error(`JIT plugin "${name}" does not export a valid JitPlugin object.`);
      }
      ctx.jitPlugins.push(jp);
    } catch (err) {
      throw new Error(`Failed to load JIT plugin "${name}": ${(err as Error).message}`);
    }
  }

  hooks.hook("build:options", (options) => {
    const transformed = ctx.jitPlugins.reduce((opts, jp) => jp.transform(opts), options);
    Object.assign(options, transformed);
  });

  return { ctx, hooks };
}
