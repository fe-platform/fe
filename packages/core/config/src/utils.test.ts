import { describe, it, expect } from "bun:test";
import { getByPath, setByPath, parseProviderUri, validateConfigValue } from "./utils.ts";

describe("getByPath", () => {
  it("should get top-level value", () => {
    const obj = { name: "test" };
    expect(getByPath(obj, "name")).toBe("test");
  });

  it("should get nested value", () => {
    const obj = { registry: { url: "https://example.com" } };
    expect(getByPath(obj, "registry.url")).toBe("https://example.com");
  });

  it("should return undefined for missing path", () => {
    const obj = { name: "test" };
    expect(getByPath(obj, "missing")).toBeUndefined();
  });

  it("should return undefined for nested missing path", () => {
    const obj = { registry: { url: "https://example.com" } };
    expect(getByPath(obj, "registry.missing")).toBeUndefined();
  });

  it("should return undefined when intermediate value is not an object", () => {
    const obj = { name: "test" };
    expect(getByPath(obj, "name.nested")).toBeUndefined();
  });
});

describe("setByPath", () => {
  it("should set top-level value", () => {
    const obj = {};
    setByPath(obj, "name", "test");
    expect(obj).toEqual({ name: "test" });
  });

  it("should set nested value", () => {
    const obj = {};
    setByPath(obj, "registry.url", "https://example.com");
    expect(obj).toEqual({ registry: { url: "https://example.com" } });
  });

  it("should update existing value", () => {
    const obj = { name: "old" };
    setByPath(obj, "name", "new");
    expect(obj).toEqual({ name: "new" });
  });

  it("should throw for empty path", () => {
    const obj = {};
    expect(() => setByPath(obj, "", "value")).toThrow("Invalid path");
  });

  it("should throw when intermediate value is not an object", () => {
    const obj = { name: "test" };
    expect(() => setByPath(obj, "name.nested", "value")).toThrow("not an object");
  });
});

describe("parseProviderUri", () => {
  it("should parse file:// URI", () => {
    const result = parseProviderUri("file:///path/to/config");
    expect(result.scheme).toBe("file");
    expect(result.path).toBe("/path/to/config");
  });

  it("should parse s3:// URI with host", () => {
    const result = parseProviderUri("s3://bucket/path");
    expect(result.scheme).toBe("s3");
    expect(result.host).toBe("bucket");
    expect(result.path).toBe("/path");
  });

  it("should parse http:// URI", () => {
    const result = parseProviderUri("http://example.com/config");
    expect(result.scheme).toBe("http");
    expect(result.host).toBe("example.com");
    expect(result.path).toBe("/config");
  });

  it("should throw for invalid URI", () => {
    expect(() => parseProviderUri("invalid")).toThrow("Invalid provider URI");
  });
});

describe("validateConfigValue", () => {
  it("should allow null", () => {
    expect(validateConfigValue(null)).toBe(true);
  });

  it("should allow string", () => {
    expect(validateConfigValue("test")).toBe(true);
  });

  it("should allow number", () => {
    expect(validateConfigValue(42)).toBe(true);
  });

  it("should allow boolean", () => {
    expect(validateConfigValue(true)).toBe(true);
  });

  it("should allow array", () => {
    expect(validateConfigValue([1, 2, 3])).toBe(true);
  });

  it("should allow object", () => {
    expect(validateConfigValue({ key: "value" })).toBe(true);
  });

  it("should allow nested structures", () => {
    expect(
      validateConfigValue({
        name: "test",
        items: [1, 2, { nested: true }],
        meta: { count: 5 },
      })
    ).toBe(true);
  });

  it("should reject function", () => {
    expect(() => validateConfigValue(() => {})).toThrow("Invalid config value type");
  });

  it("should reject symbol", () => {
    expect(() => validateConfigValue(Symbol("test"))).toThrow("Invalid config value type");
  });
});
