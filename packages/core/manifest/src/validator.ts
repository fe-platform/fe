/**
 * Manifest validator - validates fe.json structure and content
 */

import type {
  MfeManifest,
  ManifestValidationError,
  ManifestValidationResult,
} from "./types.ts";

/**
 * Validate a manifest
 * @param manifest - Manifest to validate
 * @returns Validation result with errors
 */
export function validateManifest(manifest: unknown): ManifestValidationResult {
  const errors: ManifestValidationError[] = [];

  if (typeof manifest !== "object" || manifest === null) {
    errors.push({
      field: "manifest",
      message: "Manifest must be an object",
      value: manifest,
    });
    return { valid: false, errors };
  }

  const m = manifest as Partial<MfeManifest>;

  // Required: name
  if (typeof m.name !== "string") {
    errors.push({
      field: "name",
      message: "name is required and must be a string",
      value: m.name,
    });
  } else if (!isValidPackageName(m.name)) {
    errors.push({
      field: "name",
      message: "name must be a valid scoped package name (e.g., @org/package)",
      value: m.name,
    });
  }

  // Required: version
  if (typeof m.version !== "string") {
    errors.push({
      field: "version",
      message: "version is required and must be a string",
      value: m.version,
    });
  } else if (!isValidVersion(m.version)) {
    errors.push({
      field: "version",
      message: "version must be a valid semantic version (e.g., 1.0.0)",
      value: m.version,
    });
  }

  // Required: main
  if (typeof m.main !== "string") {
    errors.push({
      field: "main",
      message: "main is required and must be a string",
      value: m.main,
    });
  } else if (!m.main.endsWith(".ts") && !m.main.endsWith(".tsx")) {
    errors.push({
      field: "main",
      message: "main must point to a .ts or .tsx file",
      value: m.main,
    });
  }

  // Optional: description
  if (m.description !== undefined && typeof m.description !== "string") {
    errors.push({
      field: "description",
      message: "description must be a string",
      value: m.description,
    });
  }

  // Optional: framework
  if (m.framework !== undefined && typeof m.framework !== "string") {
    errors.push({
      field: "framework",
      message: "framework must be a string",
      value: m.framework,
    });
  }

  // Optional: dependencies
  if (m.dependencies !== undefined) {
    if (typeof m.dependencies !== "object" || m.dependencies === null) {
      errors.push({
        field: "dependencies",
        message: "dependencies must be an object",
        value: m.dependencies,
      });
    } else {
      for (const [key, value] of Object.entries(m.dependencies)) {
        if (typeof value !== "string") {
          errors.push({
            field: `dependencies.${key}`,
            message: "dependency version must be a string",
            value,
          });
        }
      }
    }
  }

  // Optional: permissions
  if (m.permissions !== undefined) {
    if (typeof m.permissions !== "object" || m.permissions === null) {
      errors.push({
        field: "permissions",
        message: "permissions must be an object",
        value: m.permissions,
      });
    }
  }

  // Optional: routes
  if (m.routes !== undefined) {
    if (!Array.isArray(m.routes)) {
      errors.push({
        field: "routes",
        message: "routes must be an array",
        value: m.routes,
      });
    } else {
      m.routes.forEach((route, index) => {
        if (typeof route.path !== "string") {
          errors.push({
            field: `routes[${index}].path`,
            message: "route path must be a string",
            value: route.path,
          });
        }
        if (typeof route.component !== "string") {
          errors.push({
            field: `routes[${index}].component`,
            message: "route component must be a string",
            value: route.component,
          });
        }
      });
    }
  }

  // Optional: capabilities
  if (m.capabilities !== undefined) {
    if (!Array.isArray(m.capabilities)) {
      errors.push({
        field: "capabilities",
        message: "capabilities must be an array",
        value: m.capabilities,
      });
    } else {
      m.capabilities.forEach((cap, index) => {
        if (typeof cap.id !== "string") {
          errors.push({
            field: `capabilities[${index}].id`,
            message: "capability id must be a string",
            value: cap.id,
          });
        }
        if (typeof cap.name !== "string") {
          errors.push({
            field: `capabilities[${index}].name`,
            message: "capability name must be a string",
            value: cap.name,
          });
        }
        if (typeof cap.description !== "string") {
          errors.push({
            field: `capabilities[${index}].description`,
            message: "capability description must be a string",
            value: cap.description,
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a string is a valid scoped package name
 */
function isValidPackageName(name: string): boolean {
  return /^@[a-z0-9-]+\/[a-z0-9-]+$/.test(name);
}

/**
 * Check if a string is a valid semantic version
 */
function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/.test(version);
}

/**
 * Assert that a manifest is valid, throwing if not
 * @param manifest - Manifest to validate
 * @throws Error with validation errors
 */
export function assertValidManifest(manifest: unknown): asserts manifest is MfeManifest {
  const result = validateManifest(manifest);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
    throw new Error(`Invalid manifest:\n${errorMessages}`);
  }
}
