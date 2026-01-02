import { describe, it, expect, mock } from "bun:test";
import { createPluginManager } from "./plugin-manager.ts";
import type { Plugin } from "./types.ts";

describe("createPluginManager", () => {
  it("should register a plugin", async () => {
    const manager = createPluginManager({ name: "test", version: "1.0.0" });
    const setupMock = mock(() => {});

    const plugin: Plugin = {
      name: "test-plugin",
      version: "1.0.0",
      setup: setupMock,
    };

    await manager.register(plugin);

    expect(setupMock).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toHaveLength(1);
    expect(manager.getPlugins()[0]).toBe(plugin);
  });

  it("should provide hooks to plugins", async () => {
    const manager = createPluginManager({ name: "test", version: "1.0.0" });
    let capturedHooks;

    const plugin: Plugin = {
      name: "test-plugin",
      version: "1.0.0",
      setup: (context) => {
        capturedHooks = context.hooks;
      },
    };

    await manager.register(plugin);

    expect(capturedHooks).toBeDefined();
    expect(capturedHooks.onBuildStart).toBeDefined();
  });

  it("should teardown plugins", async () => {
    const manager = createPluginManager({ name: "test", version: "1.0.0" });
    const teardownMock = mock(() => {});

    const plugin: Plugin = {
      name: "test-plugin",
      version: "1.0.0",
      setup: () => {},
      teardown: teardownMock,
    };

    await manager.register(plugin);
    await manager.teardown();

    expect(teardownMock).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toHaveLength(0);
  });
});
