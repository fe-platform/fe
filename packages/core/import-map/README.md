# @fe/import-map

Import map generation for the FE platform.

## Purpose

Generates browser import maps from platform configuration. Import maps enable the browser to resolve `fe:` specifiers to actual CDN URLs at runtime.

## Usage

### Generating an Import Map

```typescript
import { generateImportMap } from "@fe/import-map";
import type { ImportMapConfig } from "@fe/import-map";

const config: ImportMapConfig = {
  cdnUrl: "https://cdn.example.com",
  platform: [
    { specifier: "fe:state", version: "1.0.0" },
    { specifier: "fe:routing", version: "1.0.0" },
  ],
  externals: [
    { name: "react", version: "18.2.0" },
  ],
  mfes: [
    {
      name: "@myorg/dashboard",
      version: "1.0.0",
      dependencies: {
        "fe:state": "1.0.0",
        react: "18.2.0",
      },
    },
  ],
};

const importMap = generateImportMap(config);
```

### Serializing to JSON

```typescript
import { serializeImportMap } from "@fe/import-map";

const json = serializeImportMap(importMap);
console.log(json);
```

### Generating HTML Script Tag

```typescript
import { generateImportMapScript } from "@fe/import-map";

const scriptTag = generateImportMapScript(importMap);
// <script type="importmap">
// {
//   "imports": { ... }
// }
// </script>
```

### Custom URL Builder

```typescript
const importMap = generateImportMap(config, {
  urlBuilder: (entry) => {
    // Custom logic for building URLs
    return `https://custom-cdn.com/${entry.name}@${entry.version}`;
  },
});
```

## Import Map Structure

The generated import map follows the [WICG Import Maps specification](https://github.com/WICG/import-maps):

```json
{
  "imports": {
    "fe:@myorg/dashboard": "https://cdn.example.com/mfes/@myorg/dashboard/1.0.0/index.js",
    "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
    "react": "https://cdn.example.com/vendor/react/18.2.0/index.js"
  },
  "scopes": {
    "https://cdn.example.com/mfes/@myorg/dashboard/1.0.0/": {
      "fe:state": "https://cdn.example.com/platform/state/1.0.0/index.js",
      "react": "https://cdn.example.com/vendor/react/18.2.0/index.js"
    }
  }
}
```

## How It Works

1. **Top-level imports**: Maps `fe:` specifiers and external packages to URLs
2. **Scoped dependencies**: Each MFE gets a scope with its specific dependency versions
3. **URL construction**: Builds CDN URLs based on package name and version

## URL Patterns

By default, URLs are generated using these patterns:

- **Platform packages**: `{cdnUrl}/platform/{name}/{version}/index.js`
  - Example: `fe:state` → `https://cdn.example.com/platform/state/1.0.0/index.js`

- **MFEs**: `{cdnUrl}/mfes/{name}/{version}/index.js`
  - Example: `fe:@myorg/app` → `https://cdn.example.com/mfes/@myorg/app/1.0.0/index.js`

- **Externals**: `{cdnUrl}/vendor/{name}/{version}/index.js`
  - Example: `react` → `https://cdn.example.com/vendor/react/18.2.0/index.js`

## Configuration Options

### ImportMapConfig

- `cdnUrl` - Base CDN URL
- `environment` - Environment name (optional, for context)
- `mfes` - Array of MFE entries
- `platform` - Array of platform package entries
- `externals` - Array of external library entries

### ImportMapGeneratorOptions

- `includeIntegrity` - Include subresource integrity hashes (Phase 1: not implemented)
- `trailingSlash` - Use trailing slashes for scope URLs (default: true)
- `urlBuilder` - Custom function for building URLs

## Browser Support

Import maps are supported in:
- Chrome 89+
- Edge 89+
- Safari 16.4+
- Firefox 108+

For older browsers, use the [es-module-shims polyfill](https://github.com/guybedford/es-module-shims).

## Design Principles

1. **Follows WICG spec**: Standard import maps
2. **Scoped dependencies**: Each MFE can have different versions
3. **One Version Policy**: Top-level imports define the rolled-out version
4. **Extensible**: Custom URL builders for different CDN strategies
