import { describe, it, expect } from "bun:test";
import type { ImportMap } from "@fe/import-map";
import {
  createResolver,
  resolveSpecifier,
  isFESpecifier,
  extractPackageName,
} from "./resolver.ts";

describe("resolveSpecifier", () => {
  it("should resolve from top-level imports", () => {
    const importMap: ImportMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
        "fe:@myorg/app": "https://cdn.example.com/mfes/@myorg/app/1.0.0/index.js",
      },
    };

    const result = resolveSpecifier({ importMap }, "fe:state");
    expect(result.url).toBe("https://cdn.example.com/platform/state/1.0.0/index.js");
    expect(result.external).toBe(false);
  });

  it("should resolve external packages from imports", () => {
    const importMap: ImportMap = {
      imports: {
        react: "https://cdn.example.com/vendor/react/18.2.0/index.js",
      },
    };

    const result = resolveSpecifier({ importMap }, "react");
    expect(result.url).toBe("https://cdn.example.com/vendor/react/18.2.0/index.js");
    expect(result.external).toBe(true);
  });

  it("should resolve from scoped imports", () => {
    const importMap: ImportMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      },
      scopes: {
        "https://cdn.example.com/mfes/@myorg/app/1.0.0/": {
          "fe:state": "https://cdn.example.com/platform/state/2.0.0/index.js",
        },
      },
    };

    // Without parent URL, should use top-level
    const result1 = resolveSpecifier({ importMap }, "fe:state");
    expect(result1.url).toBe("https://cdn.example.com/platform/state/1.0.0/index.js");

    // With matching parent URL, should use scoped
    const result2 = resolveSpecifier({ importMap }, "fe:state", {
      parentUrl: "https://cdn.example.com/mfes/@myorg/app/1.0.0/component.js",
    });
    expect(result2.url).toBe("https://cdn.example.com/platform/state/2.0.0/index.js");
  });

  it("should use most specific scope", () => {
    const importMap: ImportMap = {
      scopes: {
        "https://cdn.example.com/mfes/": {
          "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
        },
        "https://cdn.example.com/mfes/@myorg/app/": {
          "fe:state": "https://cdn.example.com/platform/state/2.0.0/index.js",
        },
      },
    };

    const result = resolveSpecifier({ importMap }, "fe:state", {
      parentUrl: "https://cdn.example.com/mfes/@myorg/app/component.js",
    });

    expect(result.url).toBe("https://cdn.example.com/platform/state/2.0.0/index.js");
  });

  it("should handle prefix matching with trailing slashes", () => {
    const importMap: ImportMap = {
      imports: {
        "lodash/": "https://cdn.example.com/vendor/lodash/4.17.21/",
      },
    };

    const result = resolveSpecifier({ importMap }, "lodash/map");
    expect(result.url).toBe("https://cdn.example.com/vendor/lodash/4.17.21/map");
  });

  it("should return specifier as-is if not found and throwOnUnresolved is false", () => {
    const importMap: ImportMap = { imports: {} };

    const result = resolveSpecifier({ importMap }, "unknown");
    expect(result.url).toBe("unknown");
  });

  it("should throw if not found and throwOnUnresolved is true", () => {
    const importMap: ImportMap = { imports: {} };

    expect(() =>
      resolveSpecifier({ importMap }, "unknown", { throwOnUnresolved: true })
    ).toThrow("Cannot resolve specifier");
  });
});

describe("createResolver", () => {
  it("should create a resolver with resolve method", () => {
    const importMap: ImportMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      },
    };

    const resolver = createResolver(importMap);
    const result = resolver.resolve("fe:state");

    expect(result.url).toBe("https://cdn.example.com/platform/state/1.0.0/index.js");
  });

  it("should create a resolver with canResolve method", () => {
    const importMap: ImportMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      },
    };

    const resolver = createResolver(importMap);

    expect(resolver.canResolve("fe:state")).toBe(true);
    expect(resolver.canResolve("unknown")).toBe(false);
  });

  it("should pass options to resolve", () => {
    const importMap: ImportMap = {
      scopes: {
        "https://cdn.example.com/mfes/@myorg/app/": {
          "fe:state": "https://cdn.example.com/platform/state/2.0.0/index.js",
        },
      },
    };

    const resolver = createResolver(importMap);
    const result = resolver.resolve("fe:state", {
      parentUrl: "https://cdn.example.com/mfes/@myorg/app/component.js",
    });

    expect(result.url).toBe("https://cdn.example.com/platform/state/2.0.0/index.js");
  });
});

describe("isFESpecifier", () => {
  it("should return true for fe: specifiers", () => {
    expect(isFESpecifier("fe:state")).toBe(true);
    expect(isFESpecifier("fe:@myorg/app")).toBe(true);
  });

  it("should return false for non-fe: specifiers", () => {
    expect(isFESpecifier("react")).toBe(false);
    expect(isFESpecifier("./relative")).toBe(false);
    expect(isFESpecifier("https://example.com/module.js")).toBe(false);
  });
});

describe("extractPackageName", () => {
  it("should extract package name from fe: specifier", () => {
    expect(extractPackageName("fe:state")).toBe("state");
    expect(extractPackageName("fe:@myorg/app")).toBe("@myorg/app");
  });

  it("should throw for non-fe: specifiers", () => {
    expect(() => extractPackageName("react")).toThrow("Not a fe: specifier");
  });
});
