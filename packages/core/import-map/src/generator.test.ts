import { describe, it, expect } from "bun:test";
import {
  generateImportMap,
  serializeImportMap,
  generateImportMapScript,
} from "./generator.ts";
import type { ImportMapConfig } from "./types.ts";

describe("generateImportMap", () => {
  const baseCdnUrl = "https://cdn.example.com";

  it("should generate import map with MFEs only", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [
        { name: "@myorg/app1", version: "1.0.0" },
        { name: "@myorg/app2", version: "2.1.0" },
      ],
    };

    const importMap = generateImportMap(config);

    expect(importMap.imports).toEqual({
      "fe:@myorg/app1": `${baseCdnUrl}/mfes/@myorg/app1/1.0.0/index.js`,
      "fe:@myorg/app2": `${baseCdnUrl}/mfes/@myorg/app2/2.1.0/index.js`,
    });
  });

  it("should generate import map with platform packages", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [],
      platform: [
        { specifier: "fe:state", version: "1.0.0" },
        { specifier: "fe:routing", version: "1.2.0" },
      ],
    };

    const importMap = generateImportMap(config);

    expect(importMap.imports).toEqual({
      "fe:state": `${baseCdnUrl}/platform/state/1.0.0/index.js`,
      "fe:routing": `${baseCdnUrl}/platform/routing/1.2.0/index.js`,
    });
  });

  it("should generate import map with externals", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [],
      externals: [
        { name: "react", version: "18.2.0" },
        { name: "react-dom", version: "18.2.0" },
      ],
    };

    const importMap = generateImportMap(config);

    expect(importMap.imports).toEqual({
      react: `${baseCdnUrl}/vendor/react/18.2.0/index.js`,
      "react-dom": `${baseCdnUrl}/vendor/react-dom/18.2.0/index.js`,
    });
  });

  it("should generate scoped dependencies for MFE", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [
        {
          name: "@myorg/app1",
          version: "1.0.0",
          dependencies: {
            "fe:state": "1.0.0",
            react: "18.2.0",
          },
        },
      ],
    };

    const importMap = generateImportMap(config);

    expect(importMap.imports?.["fe:@myorg/app1"]).toBe(
      `${baseCdnUrl}/mfes/@myorg/app1/1.0.0/index.js`
    );

    expect(importMap.scopes).toBeDefined();
    const scopeUrl = `${baseCdnUrl}/mfes/@myorg/app1/1.0.0/`;
    expect(importMap.scopes?.[scopeUrl]).toEqual({
      "fe:state": `${baseCdnUrl}/platform/state/1.0.0/index.js`,
      react: `${baseCdnUrl}/vendor/react/18.2.0/index.js`,
    });
  });

  it("should handle custom URLs", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [
        {
          name: "@myorg/app1",
          version: "1.0.0",
          url: "https://custom.cdn.com/app1.js",
        },
      ],
    };

    const importMap = generateImportMap(config);

    expect(importMap.imports?.["fe:@myorg/app1"]).toBe("https://custom.cdn.com/app1.js");
  });

  it("should handle relative custom URLs", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [
        {
          name: "@myorg/app1",
          version: "1.0.0",
          url: "/custom/path/app1.js",
        },
      ],
    };

    const importMap = generateImportMap(config);

    expect(importMap.imports?.["fe:@myorg/app1"]).toBe(`${baseCdnUrl}/custom/path/app1.js`);
  });

  it("should use custom URL builder", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [{ name: "@myorg/app1", version: "1.0.0" }],
    };

    const importMap = generateImportMap(config, {
      urlBuilder: (entry) => `https://custom.com/${entry.name}/${entry.version}.js`,
    });

    expect(importMap.imports?.["fe:@myorg/app1"]).toBe(
      "https://custom.com/@myorg/app1/1.0.0.js"
    );
  });

  it("should omit trailing slash when option is false", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      mfes: [
        {
          name: "@myorg/app1",
          version: "1.0.0",
          dependencies: { react: "18.2.0" },
        },
      ],
    };

    const importMap = generateImportMap(config, { trailingSlash: false });

    const scopeUrl = `${baseCdnUrl}/mfes/@myorg/app1/1.0.0`;
    expect(importMap.scopes?.[scopeUrl]).toBeDefined();
  });

  it("should generate complete import map", () => {
    const config: ImportMapConfig = {
      cdnUrl: baseCdnUrl,
      environment: "production",
      platform: [
        { specifier: "fe:state", version: "1.0.0" },
        { specifier: "fe:routing", version: "1.0.0" },
      ],
      externals: [{ name: "react", version: "18.2.0" }],
      mfes: [
        {
          name: "@myorg/app1",
          version: "1.0.0",
          dependencies: {
            "fe:state": "1.0.0",
            react: "18.2.0",
          },
        },
        {
          name: "@myorg/app2",
          version: "2.0.0",
          dependencies: {
            "fe:@myorg/app1": "1.0.0",
          },
        },
      ],
    };

    const importMap = generateImportMap(config);

    // Check all imports are present
    expect(importMap.imports?.["fe:state"]).toBeDefined();
    expect(importMap.imports?.["fe:routing"]).toBeDefined();
    expect(importMap.imports?.react).toBeDefined();
    expect(importMap.imports?.["fe:@myorg/app1"]).toBeDefined();
    expect(importMap.imports?.["fe:@myorg/app2"]).toBeDefined();

    // Check scopes
    expect(importMap.scopes).toBeDefined();
    expect(Object.keys(importMap.scopes!).length).toBe(2);
  });
});

describe("serializeImportMap", () => {
  it("should serialize with pretty formatting", () => {
    const importMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      },
    };

    const json = serializeImportMap(importMap);

    expect(json).toContain("\n");
    expect(json).toContain("  ");
    expect(JSON.parse(json)).toEqual(importMap);
  });

  it("should serialize without formatting", () => {
    const importMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      },
    };

    const json = serializeImportMap(importMap, false);

    expect(json).not.toContain("\n");
    expect(JSON.parse(json)).toEqual(importMap);
  });
});

describe("generateImportMapScript", () => {
  it("should generate script tag with import map", () => {
    const importMap = {
      imports: {
        "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      },
    };

    const script = generateImportMapScript(importMap);

    expect(script).toContain('<script type="importmap">');
    expect(script).toContain("</script>");
    expect(script).toContain('"imports"');
    expect(script).toContain('"fe:state"');
  });

  it("should produce valid HTML script tag", () => {
    const importMap = {
      imports: { test: "https://example.com/test.js" },
    };

    const script = generateImportMapScript(importMap);

    // Should start and end correctly
    expect(script.startsWith('<script type="importmap">')).toBe(true);
    expect(script.endsWith("</script>")).toBe(true);

    // Should contain valid JSON
    const jsonMatch = script.match(/<script type="importmap">\n(.*)\n<\/script>/s);
    expect(jsonMatch).toBeTruthy();
    if (jsonMatch) {
      expect(() => JSON.parse(jsonMatch[1])).not.toThrow();
    }
  });
});
