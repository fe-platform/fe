# @fe/manifest

MFE manifest parsing and validation for the FE platform.

## Purpose

Provides types, parser, and validator for `fe.json` manifests that describe MFE metadata, dependencies, permissions, routes, and capabilities.

## Usage

### Parsing a Manifest

```typescript
import { parseManifest, parseManifestFile } from "@fe/manifest";

// From string
const manifest = parseManifest(jsonString);

// From file
const manifest = await parseManifestFile("./fe.json");
```

### Validating a Manifest

```typescript
import { validateManifest, assertValidManifest } from "@fe/manifest";

// Get validation result
const result = validateManifest(manifest);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}

// Assert valid (throws on error)
assertValidManifest(manifest);
```

### Writing a Manifest

```typescript
import { writeManifestFile, stringifyManifest } from "@fe/manifest";
import type { MfeManifest } from "@fe/manifest";

const manifest: MfeManifest = {
  name: "@myorg/my-mfe",
  version: "1.0.0",
  main: "./src/index.ts",
  description: "My micro-frontend",
};

// Write to file
await writeManifestFile("./fe.json", manifest);

// Get JSON string
const json = stringifyManifest(manifest);
```

## Manifest Structure

### Minimal Example

```json
{
  "name": "@myorg/my-mfe",
  "version": "1.0.0",
  "main": "./src/index.ts"
}
```

### Complete Example

```json
{
  "name": "@myorg/dashboard",
  "version": "2.1.0",
  "description": "User dashboard MFE",
  "main": "./src/index.tsx",
  "framework": "react",
  "dependencies": {
    "fe:state": "^1.0.0",
    "fe:routing": "^1.0.0",
    "fe:net": "^1.0.0",
    "@myorg/shared-ui": "^3.0.0"
  },
  "permissions": {
    "state": {
      "owns": ["user", "dashboard"],
      "reads": ["app", "auth"]
    },
    "network": {
      "domains": ["api.example.com"],
      "paths": ["/api/users/*", "/api/dashboard/*"]
    },
    "storage": {
      "localStorage": true,
      "cookies": ["user_prefs"]
    }
  },
  "routes": [
    {
      "path": "/dashboard",
      "component": "./components/Dashboard.tsx",
      "meta": {
        "title": "Dashboard",
        "requiresAuth": true
      }
    },
    {
      "path": "/profile",
      "component": "./components/Profile.tsx",
      "meta": {
        "title": "Profile",
        "requiresAuth": true
      }
    }
  ],
  "capabilities": [
    {
      "id": "view-dashboard",
      "name": "View Dashboard",
      "description": "Display user dashboard with widgets",
      "intents": ["view", "dashboard", "analytics"],
      "examples": ["show my dashboard", "open analytics"]
    }
  ],
  "ai": {
    "keywords": ["dashboard", "analytics", "user-data"],
    "summary": "Provides user dashboard with analytics and profile management",
    "useCases": [
      "View user statistics",
      "Manage user profile",
      "Access analytics"
    ]
  }
}
```

## Required Fields

- `name` - Scoped package name (e.g., `@myorg/my-mfe`)
- `version` - Semantic version (e.g., `1.0.0`)
- `main` - Entry point path (must be `.ts` or `.tsx`)

## Optional Fields

- `description` - Human-readable description
- `framework` - Framework used (react, vue, svelte, etc.)
- `dependencies` - Platform packages and other MFEs this depends on
- `permissions` - Required permissions (state, network, storage, APIs)
- `routes` - Routes exposed by this MFE
- `capabilities` - Capabilities this MFE provides
- `ai` - AI context for catalog discovery
- `metadata` - Custom metadata

## Validation Rules

1. Package name must be scoped (`@org/name`)
2. Version must be valid semver (`1.0.0`, `1.0.0-alpha.1`, `1.0.0+build.123`)
3. Main entry must end with `.ts` or `.tsx`
4. All dependency values must be strings
5. Routes must have `path` and `component`
6. Capabilities must have `id`, `name`, and `description`
