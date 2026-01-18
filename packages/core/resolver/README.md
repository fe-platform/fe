# @fe/resolver

fe: specifier resolution using import maps.

## Purpose

Resolves `fe:` import specifiers to URLs using import maps. Implements the [WICG Import Maps resolution algorithm](https://github.com/WICG/import-maps#resolution).

Useful for:
- Build-time resolution during bundling
- Node.js environments that don't natively support import maps
- Testing and validation

## Usage

### Creating a Resolver

```typescript
import { createResolver } from "@fe/resolver";
import type { ImportMap } from "@fe/import-map";

const importMap: ImportMap = {
  imports: {
    "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
    "fe:@myorg/app": "https://cdn.example.com/mfes/@myorg/app/1.0.0/index.js",
  },
};

const resolver = createResolver(importMap);
```

### Resolving Specifiers

```typescript
// Resolve a specifier
const result = resolver.resolve("fe:state");
console.log(result.url);
// "https://cdn.example.com/platform/state/1.0.0/index.js"

console.log(result.external);
// false (it's a fe: specifier)
```

### Scoped Resolution

```typescript
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

const resolver = createResolver(importMap);

// Resolve with parent URL to use scoped mapping
const result = resolver.resolve("fe:state", {
  parentUrl: "https://cdn.example.com/mfes/@myorg/app/1.0.0/component.js",
});

console.log(result.url);
// "https://cdn.example.com/platform/state/2.0.0/index.js" (scoped version)
```

### Checking if a Specifier Can Be Resolved

```typescript
if (resolver.canResolve("fe:state")) {
  console.log("Can resolve fe:state");
}

if (!resolver.canResolve("unknown-module")) {
  console.log("Cannot resolve unknown-module");
}
```

### Direct Resolution (Without Creating Resolver)

```typescript
import { resolveSpecifier } from "@fe/resolver";

const result = resolveSpecifier(
  { importMap },
  "fe:state",
  { throwOnUnresolved: true }
);
```

### Utility Functions

```typescript
import { isFESpecifier, extractPackageName } from "@fe/resolver";

// Check if a specifier is a fe: specifier
if (isFESpecifier("fe:state")) {
  console.log("This is a fe: specifier");
}

// Extract package name from fe: specifier
const packageName = extractPackageName("fe:@myorg/app");
console.log(packageName);
// "@myorg/app"
```

## Resolution Algorithm

The resolver implements the import map resolution algorithm:

1. **Scoped resolution**: If a `parentUrl` is provided, find the most specific matching scope and try to resolve from there
2. **Top-level resolution**: If not found in scope, try resolving from top-level `imports`
3. **Prefix matching**: Support trailing-slash mappings (e.g., `lodash/` → `https://cdn.example.com/lodash/`)
4. **Fallback**: If not found and `throwOnUnresolved` is false, return the specifier as-is

### Most Specific Scope

When multiple scopes match a parent URL, the longest (most specific) scope wins:

```typescript
const importMap: ImportMap = {
  scopes: {
    "https://cdn.example.com/mfes/": { /* ... */ },
    "https://cdn.example.com/mfes/@myorg/": { /* ... */ },
    "https://cdn.example.com/mfes/@myorg/app/": { /* ... */ }, // Most specific
  },
};

// parentUrl: "https://cdn.example.com/mfes/@myorg/app/component.js"
// Will use "https://cdn.example.com/mfes/@myorg/app/" scope
```

## Resolution Result

```typescript
interface ResolveResult {
  /** The resolved URL */
  url: string;

  /** Whether this is an external (non-fe:) specifier */
  external: boolean;

  /** The original specifier */
  specifier: string;
}
```

## Options

### ResolveOptions

- `parentUrl` - Parent URL for scoped resolution
- `throwOnUnresolved` - Whether to throw on unresolved specifiers (default: false)

## Error Handling

By default, unresolved specifiers return the original specifier as the URL:

```typescript
const result = resolver.resolve("unknown");
// result.url === "unknown"
```

To throw on unresolved specifiers:

```typescript
const result = resolver.resolve("unknown", { throwOnUnresolved: true });
// Throws: "Cannot resolve specifier: unknown"
```

## Design Principles

1. **Standards-compliant**: Implements WICG import map spec
2. **Scoped resolution**: Supports per-MFE dependency versions
3. **Flexible**: Works at build time and runtime
4. **Type-safe**: Full TypeScript support
