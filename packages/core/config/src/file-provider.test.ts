import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FileProvider, createFileProvider } from "./file-provider.ts";

const TEST_DIR = join(import.meta.dir, ".test-config");

describe("FileProvider", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("getAll / setAll", () => {
    it("should return undefined for non-existent namespace", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      const result = await provider.getAll("platform");
      expect(result).toBeUndefined();
    });

    it("should write and read config", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      const config = { name: "test-platform", version: "1.0.0" };

      await provider.setAll("platform", config);
      const result = await provider.getAll("platform");

      expect(result).toEqual(config);
    });

    it("should create directory if it doesn't exist", async () => {
      const nestedDir = join(TEST_DIR, "nested", "path");
      const provider = new FileProvider({ basePath: nestedDir });

      await provider.setAll("platform", { name: "test" });

      expect(existsSync(nestedDir)).toBe(true);
      const result = await provider.getAll("platform");
      expect(result).toEqual({ name: "test" });
    });

    it("should overwrite existing config", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });

      await provider.setAll("platform", { name: "old" });
      await provider.setAll("platform", { name: "new", version: "2.0.0" });

      const result = await provider.getAll("platform");
      expect(result).toEqual({ name: "new", version: "2.0.0" });
    });
  });

  describe("get / set", () => {
    it("should get top-level value", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      await provider.setAll("platform", { name: "test", version: "1.0.0" });

      const result = await provider.get("platform.name");
      expect(result).toBe("test");
    });

    it("should get nested value", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      await provider.setAll("platform", {
        registry: { url: "https://example.com" },
      });

      const result = await provider.get("platform.registry.url");
      expect(result).toBe("https://example.com");
    });

    it("should return undefined for missing key", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      await provider.setAll("platform", { name: "test" });

      const result = await provider.get("platform.missing");
      expect(result).toBeUndefined();
    });

    it("should set nested value", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      await provider.setAll("platform", { name: "test" });

      await provider.set("platform.version", "2.0.0");

      const result = await provider.getAll("platform");
      expect(result).toEqual({ name: "test", version: "2.0.0" });
    });

    it("should create nested structure", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });

      await provider.setAll("platform", {});
      await provider.set("platform.registry.url", "https://example.com");

      const result = await provider.get("platform.registry.url");
      expect(result).toBe("https://example.com");
    });

    it("should throw when setting entire namespace via set", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });

      await expect(
        provider.set("platform", { name: "test" })
      ).rejects.toThrow("use setAll()");
    });

    it("should throw for invalid key", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });

      await expect(provider.set("", "value")).rejects.toThrow("Invalid key");
    });
  });

  describe("isAvailable", () => {
    it("should return true when base path exists", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });
      expect(await provider.isAvailable()).toBe(true);
    });

    it("should return false when base path doesn't exist", async () => {
      const provider = new FileProvider({ basePath: join(TEST_DIR, "nonexistent") });
      expect(await provider.isAvailable()).toBe(false);
    });
  });

  describe("validateConfigValue", () => {
    it("should reject non-JSON values", async () => {
      const provider = new FileProvider({ basePath: TEST_DIR });

      await expect(
        provider.set("platform.func", (() => {}) as any)
      ).rejects.toThrow("Invalid config value type");
    });
  });
});

describe("createFileProvider", () => {
  it("should create provider from file:// URI", () => {
    const provider = createFileProvider("file:///path/to/config");
    expect(provider).toBeInstanceOf(FileProvider);
  });

  it("should throw for invalid URI", () => {
    expect(() => createFileProvider("invalid://uri")).toThrow("Invalid file:// URI");
  });

  it("should throw for non-file scheme", () => {
    expect(() => createFileProvider("s3://bucket/path")).toThrow("Invalid file:// URI");
  });
});
