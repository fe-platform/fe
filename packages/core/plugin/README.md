# @fe/plugin

Core plugin system for the FE platform. Provides the base architecture that all platform capabilities build upon.

## Overview

Every major capability in the FE platform is a plugin. The plugin system provides:
- Lifecycle management
- Hook-based extensibility
- Clean boundaries and contracts
- Independent development and testing

## Usage

```typescript
import { createPluginManager, type Plugin } from "@fe/plugin";

// Create a plugin
const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  setup(context) {
    // Register hooks
    context.hooks.onBuildStart.tap("my-plugin", async (buildContext) => {
      context.logger.info("Build starting!");
    });
  },
};

// Use the plugin manager
const manager = createPluginManager({ name: "my-app", version: "1.0.0" });
await manager.register(myPlugin);
```

## Plugin Types

| Type | Interface | Examples |
|------|-----------|----------|
| CLI Command | `CliPlugin` | init, dev, build |
| Loader | `LoaderPlugin` | scss, json, svg |
| Transform | `TransformPlugin` | import rewriting |
| Governance Rule | `GovernancePlugin` | bundle size, coverage |
| Platform Package | `PlatformPlugin` | state, routing, auth |

## Hooks

- `onBuildStart` - Called before build begins
- `onBuildEnd` - Called after build completes
- `onTransform` - Called to transform source code
- `onResolve` - Called to resolve import specifiers
- `onPublish` - Called during package publish
- `onDevServerStart` - Called when dev server starts
