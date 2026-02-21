import type { Plugin } from "@fe/core";

/**
 * Dynamically import each plugin listed in fe.config.json["plugins"].
 * Each plugin package must export a default `Plugin` object or a
 * `plugin` named export.
 */
export async function loadExternalPlugins(root: string, pluginNames: string[]): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  for (const name of pluginNames) {
    try {
      const mod = await import(name) as { default?: Plugin; plugin?: Plugin };
      const plugin = mod.default ?? mod.plugin;
      if (!plugin || typeof plugin.setup !== "function") {
        throw new Error(`Plugin "${name}" does not export a valid Plugin object.`);
      }
      plugins.push(plugin);
    } catch (err) {
      throw new Error(`Failed to load plugin "${name}" from node_modules: ${(err as Error).message}`);
    }
  }
  return plugins;
}
