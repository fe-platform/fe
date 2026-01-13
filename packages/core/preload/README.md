# @fe/preload

__fePreload runtime for handling dynamic imports in the FE platform.

## Purpose

Provides the `__fePreload` runtime that manages dynamic module loading in the browser. Dynamic `import()` calls are rewritten to `__fePreload()` during build, enabling:

- Module caching
- Preloading
- Load tracking
- Error handling

## Installation

The `__fePreload` runtime must be installed before any MFEs load:

```typescript
import { installPreloadRuntime } from "@fe/preload";

// Install as global window.__fePreload
installPreloadRuntime();
```

## Usage

### Dynamic Imports (Automatic)

During build, dynamic imports are rewritten:

```typescript
// Source code:
const module = await import("fe:state");

// Build output:
const module = await __fePreload("fe:state");
```

The browser's import map resolves the specifier to a URL.

### Manual Usage

You can also use `__fePreload` directly:

```typescript
// Load a module
const state = await window.__fePreload("fe:state");

// Check if loaded
if (window.__fePreload.isLoaded("fe:state")) {
  console.log("Already loaded");
}

// Get module cache
const cache = window.__fePreload.getCache();
console.log(`${cache.size} modules in cache`);
```

### Preloading

Preload modules before they're needed:

```typescript
// Preload a single module
await window.__fePreload.preload("fe:@myorg/dashboard");

// Preload with options
await window.__fePreload.preload("fe:@myorg/dashboard", {
  timeout: 5000,
  throwOnError: false,
  onError: (error, specifier) => {
    console.error(`Failed to preload ${specifier}:`, error);
  },
});
```

### Batch Preloading

Preload multiple modules at once:

```typescript
import { batchPreload } from "@fe/preload";

const results = await batchPreload([
  "fe:@myorg/dashboard",
  "fe:@myorg/profile",
  "fe:@myorg/settings",
]);

results.forEach((result) => {
  if (result.success) {
    console.log(`Loaded ${result.specifier}`);
  } else {
    console.error(`Failed to load ${result.specifier}:`, result.error);
  }
});
```

### Statistics

Get statistics about loaded modules:

```typescript
const stats = window.__fePreload.getStats();
console.log(`Total: ${stats.total}`);
console.log(`Loaded: ${stats.loaded}`);
console.log(`Loading: ${stats.loading}`);
console.log(`Errors: ${stats.errors}`);
```

### Cache Management

```typescript
// Clear cache (useful for testing)
window.__fePreload.clearCache();

// Check cache
const cache = window.__fePreload.getCache();
for (const [specifier, entry] of cache) {
  console.log(`${specifier}: ${entry.state}`);
}
```

## Module Cache

Each loaded module is cached with this structure:

```typescript
interface ModuleCacheEntry {
  specifier: string;
  url: string;
  exports: any;
  loadedAt: number;
  state: "loading" | "loaded" | "error";
  error?: Error;
}
```

## Error Handling

### Default Behavior

By default, errors are thrown and can be caught:

```typescript
try {
  await window.__fePreload("fe:non-existent");
} catch (error) {
  console.error("Failed to load:", error);
}
```

### Custom Error Handling

Use the `onError` callback for custom handling:

```typescript
await window.__fePreload.preload("fe:module", {
  throwOnError: false,
  onError: (error, specifier) => {
    // Log to telemetry
    telemetry.log("module_load_error", { specifier, error });
  },
});
```

## Timeouts

Preloading supports timeouts to prevent hanging:

```typescript
await window.__fePreload.preload("fe:module", {
  timeout: 10000, // 10 seconds
  throwOnError: true,
});
```

Default timeout: 30 seconds

## How It Works

1. **Check cache**: If module is already loaded, return cached exports
2. **Dedupe loading**: If module is currently loading, return existing promise
3. **Dynamic import**: Use native `import()` with the specifier
4. **Import map resolution**: Browser resolves specifier using import map
5. **Cache result**: Store exports or error in cache

## Integration with Build Pipeline

The build pipeline (Phase 3) will:

1. Parse source code
2. Find dynamic `import()` calls
3. Rewrite to `__fePreload()` calls
4. Inject `__fePreload` script in HTML shell

Example transformation:

```typescript
// Before
export async function loadDashboard() {
  const dashboard = await import("fe:@myorg/dashboard");
  return dashboard.default;
}

// After
export async function loadDashboard() {
  const dashboard = await __fePreload("fe:@myorg/dashboard");
  return dashboard.default;
}
```

## Browser Compatibility

Requires:
- ES modules support
- Import maps support (or polyfill)
- Dynamic import() support

## Design Principles

1. **Minimal overhead**: Only caches what's loaded
2. **Deduplication**: Multiple concurrent loads share one promise
3. **Error isolation**: Failed loads don't crash the app
4. **Preloading**: Load ahead for better performance
5. **Observable**: Stats and cache inspection for debugging
