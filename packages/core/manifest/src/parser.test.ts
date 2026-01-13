import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  parseManifest,
  parseManifestFile,
  stringifyManifest,
  writeManifestFile,
} from "./parser.ts";
import type { MfeManifest } from "./types.ts";

const TEST_DIR = join(import.meta.dir, ".test-manifests");

describe("parseManifest", () => {
  it("should parse valid JSON", () => {
    const json = JSON.stringify({
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
    });

    const manifest = parseManifest(json);
    expect(manifest.name).toBe("@myorg/my-mfe");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.main).toBe("./src/index.ts");
  });

  it("should throw for invalid JSON", () => {
    expect(() => parseManifest("not json")).toThrow("Failed to parse manifest");
  });

  it("should parse complex manifest", () => {
    const json = JSON.stringify({
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
      dependencies: {
        "fe:state": "^1.0.0",
      },
      routes: [
        {
          path: "/test",
          component: "./Test.tsx",
        },
      ],
    });

    const manifest = parseManifest(json);
    expect(manifest.dependencies).toBeDefined();
    expect(manifest.dependencies?.["fe:state"]).toBe("^1.0.0");
    expect(manifest.routes).toHaveLength(1);
  });
});

describe("stringifyManifest", () => {
  it("should stringify manifest with pretty formatting", () => {
    const manifest: MfeManifest = {
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
    };

    const json = stringifyManifest(manifest);
    expect(json).toContain("\n");
    expect(json).toContain("  ");
    expect(JSON.parse(json)).toEqual(manifest);
  });

  it("should stringify manifest without formatting", () => {
    const manifest: MfeManifest = {
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
    };

    const json = stringifyManifest(manifest, false);
    expect(json).not.toContain("\n");
    expect(JSON.parse(json)).toEqual(manifest);
  });
});

describe("parseManifestFile and writeManifestFile", () => {
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

  it("should write and read manifest file", async () => {
    const manifest: MfeManifest = {
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
      description: "Test MFE",
    };

    const filePath = join(TEST_DIR, "fe.json");
    await writeManifestFile(filePath, manifest);

    expect(existsSync(filePath)).toBe(true);

    const read = await parseManifestFile(filePath);
    expect(read).toEqual(manifest);
  });

  it("should throw for non-existent file", async () => {
    const filePath = join(TEST_DIR, "nonexistent.json");

    await expect(parseManifestFile(filePath)).rejects.toThrow("Failed to read manifest file");
  });

  it("should write pretty-formatted JSON", async () => {
    const manifest: MfeManifest = {
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
    };

    const filePath = join(TEST_DIR, "fe.json");
    await writeManifestFile(filePath, manifest);

    const file = Bun.file(filePath);
    const content = await file.text();

    expect(content).toContain("\n");
    expect(content).toContain("  ");
  });
});
