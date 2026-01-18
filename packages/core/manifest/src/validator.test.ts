import { describe, it, expect } from "bun:test";
import { validateManifest, assertValidManifest } from "./validator.ts";
import type { MfeManifest } from "./types.ts";

describe("validateManifest", () => {
  const validManifest: MfeManifest = {
    name: "@myorg/my-mfe",
    version: "1.0.0",
    main: "./src/index.ts",
  };

  it("should validate a minimal valid manifest", () => {
    const result = validateManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate a complete valid manifest", () => {
    const manifest: MfeManifest = {
      ...validManifest,
      description: "Test MFE",
      framework: "react",
      dependencies: {
        "fe:state": "^1.0.0",
        "fe:routing": "^1.0.0",
      },
      permissions: {
        state: {
          owns: ["user"],
          reads: ["app"],
        },
      },
      routes: [
        {
          path: "/test",
          component: "./components/Test.tsx",
        },
      ],
      capabilities: [
        {
          id: "test-cap",
          name: "Test Capability",
          description: "A test capability",
        },
      ],
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject non-object manifest", () => {
    const result = validateManifest("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "manifest",
      message: "Manifest must be an object",
      value: "not an object",
    });
  });

  it("should reject missing name", () => {
    const manifest = { ...validManifest };
    delete (manifest as any).name;

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "name")).toBe(true);
  });

  it("should reject invalid package name", () => {
    const manifest = { ...validManifest, name: "invalid-name" };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "name" && e.message.includes("scoped"))).toBe(
      true
    );
  });

  it("should reject missing version", () => {
    const manifest = { ...validManifest };
    delete (manifest as any).version;

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "version")).toBe(true);
  });

  it("should reject invalid version", () => {
    const manifest = { ...validManifest, version: "not-semver" };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "version")).toBe(true);
  });

  it("should accept prerelease versions", () => {
    const manifest = { ...validManifest, version: "1.0.0-alpha.1" };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
  });

  it("should accept build metadata in versions", () => {
    const manifest = { ...validManifest, version: "1.0.0+build.123" };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
  });

  it("should reject missing main", () => {
    const manifest = { ...validManifest };
    delete (manifest as any).main;

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "main")).toBe(true);
  });

  it("should reject main without .ts/.tsx extension", () => {
    const manifest = { ...validManifest, main: "./src/index.js" };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "main" && e.message.includes(".ts"))).toBe(true);
  });

  it("should accept .tsx main", () => {
    const manifest = { ...validManifest, main: "./src/index.tsx" };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
  });

  it("should reject invalid description type", () => {
    const manifest = { ...validManifest, description: 123 as any };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "description")).toBe(true);
  });

  it("should reject non-object dependencies", () => {
    const manifest = { ...validManifest, dependencies: "invalid" as any };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "dependencies")).toBe(true);
  });

  it("should reject non-string dependency values", () => {
    const manifest = {
      ...validManifest,
      dependencies: { "fe:state": 123 as any },
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "dependencies.fe:state")).toBe(true);
  });

  it("should reject non-array routes", () => {
    const manifest = { ...validManifest, routes: "invalid" as any };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "routes")).toBe(true);
  });

  it("should reject route without path", () => {
    const manifest = {
      ...validManifest,
      routes: [{ component: "./Test.tsx" } as any],
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "routes[0].path")).toBe(true);
  });

  it("should reject route without component", () => {
    const manifest = {
      ...validManifest,
      routes: [{ path: "/test" } as any],
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "routes[0].component")).toBe(true);
  });

  it("should reject non-array capabilities", () => {
    const manifest = { ...validManifest, capabilities: "invalid" as any };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "capabilities")).toBe(true);
  });

  it("should reject capability without required fields", () => {
    const manifest = {
      ...validManifest,
      capabilities: [{ id: "test" } as any],
    };

    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.startsWith("capabilities[0]"))).toBe(true);
  });
});

describe("assertValidManifest", () => {
  it("should not throw for valid manifest", () => {
    const manifest: MfeManifest = {
      name: "@myorg/my-mfe",
      version: "1.0.0",
      main: "./src/index.ts",
    };

    expect(() => assertValidManifest(manifest)).not.toThrow();
  });

  it("should throw for invalid manifest", () => {
    const manifest = { name: "invalid" };

    expect(() => assertValidManifest(manifest)).toThrow("Invalid manifest");
  });

  it("should include error details in thrown error", () => {
    const manifest = { name: "invalid" };

    try {
      assertValidManifest(manifest);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain("name");
      expect((error as Error).message).toContain("version");
      expect((error as Error).message).toContain("main");
    }
  });
});
