import { describe, it, expect, beforeEach } from "bun:test";
import { createPreloadRuntime } from "./runtime.ts";

describe("createPreloadRuntime", () => {
  let __fePreload: ReturnType<typeof createPreloadRuntime>;

  beforeEach(() => {
    __fePreload = createPreloadRuntime();
  });

  describe("getCache", () => {
    it("should return empty cache initially", () => {
      const cache = __fePreload.getCache();
      expect(cache.size).toBe(0);
    });
  });

  describe("isLoaded", () => {
    it("should return false for unloaded module", () => {
      expect(__fePreload.isLoaded("fe:state")).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return zero stats initially", () => {
      const stats = __fePreload.getStats();
      expect(stats).toEqual({
        total: 0,
        loaded: 0,
        loading: 0,
        errors: 0,
      });
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", () => {
      __fePreload.clearCache();
      const cache = __fePreload.getCache();
      expect(cache.size).toBe(0);
    });
  });
});

// Note: Full integration tests for __fePreload() would require a browser environment
// with import maps. These tests verify the API surface and basic functionality.
describe("__fePreload API", () => {
  it("should have preload method", () => {
    const __fePreload = createPreloadRuntime();
    expect(typeof __fePreload.preload).toBe("function");
  });

  it("should have getCache method", () => {
    const __fePreload = createPreloadRuntime();
    expect(typeof __fePreload.getCache).toBe("function");
  });

  it("should have isLoaded method", () => {
    const __fePreload = createPreloadRuntime();
    expect(typeof __fePreload.isLoaded).toBe("function");
  });

  it("should have clearCache method", () => {
    const __fePreload = createPreloadRuntime();
    expect(typeof __fePreload.clearCache).toBe("function");
  });

  it("should have getStats method", () => {
    const __fePreload = createPreloadRuntime();
    expect(typeof __fePreload.getStats).toBe("function");
  });

  it("should be callable as a function", () => {
    const __fePreload = createPreloadRuntime();
    expect(typeof __fePreload).toBe("function");
  });
});
