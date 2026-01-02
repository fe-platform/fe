import type { Plugin, PluginContext, PluginHooks, PlatformConfig } from "./types.ts";
import { createHook } from "./hook.ts";
import { createLogger } from "./logger.ts";

/**
 * Plugin manager state
 */
interface PluginManagerState {
  plugins: Plugin[];
  hooks: PluginHooks;
  config: PlatformConfig;
}

/**
 * Creates a new plugin manager instance.
 */
export function createPluginManager(config: PlatformConfig): {
  register: (plugin: Plugin) => Promise<void>;
  teardown: () => Promise<void>;
  getHooks: () => PluginHooks;
  getPlugins: () => readonly Plugin[];
} {
  const state: PluginManagerState = {
    plugins: [],
    config,
    hooks: {
      onBuildStart: createHook(),
      onBuildEnd: createHook(),
      onTransform: createHook(),
      onResolve: createHook(),
      onPublish: createHook(),
      onDevServerStart: createHook(),
    },
  };

  /**
   * Register a plugin with the manager.
   */
  async function register(plugin: Plugin): Promise<void> {
    const logger = createLogger(plugin.name);

    try {
      const context: PluginContext = {
        hooks: state.hooks,
        config: state.config,
        logger,
      };

      await plugin.setup(context);
      state.plugins.push(plugin);
      logger.info(`Plugin registered: ${plugin.name}@${plugin.version}`);
    } catch (error) {
      logger.error(`Failed to register plugin: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * Teardown all registered plugins.
   */
  async function teardown(): Promise<void> {
    for (const plugin of state.plugins) {
      if (plugin.teardown) {
        try {
          await plugin.teardown();
        } catch (error) {
          const logger = createLogger(plugin.name);
          logger.error(`Error during plugin teardown`, error);
        }
      }
    }
    state.plugins = [];
  }

  /**
   * Get the plugin hooks for external use.
   */
  function getHooks(): PluginHooks {
    return state.hooks;
  }

  /**
   * Get all registered plugins.
   */
  function getPlugins(): readonly Plugin[] {
    return state.plugins;
  }

  return {
    register,
    teardown,
    getHooks,
    getPlugins,
  };
}
