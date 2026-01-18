# @fe/config

Configuration provider abstraction for the FE platform.

## Purpose

Provides a unified interface for reading and writing platform configuration from various backends. All configuration is JSON-only (ADR-018).

## Phase 1 Implementation

This package currently includes:
- `ConfigProvider` interface
- File-based provider (`file://`)
- Configuration types for platform.json, environments.json, rollout.json, governance.json
- Utility functions for config manipulation

## Usage

### Creating a File Provider

```typescript
import { createFileProvider } from "@fe/config";

const provider = createFileProvider("file:///path/to/config");
```

### Reading Configuration

```typescript
// Get entire namespace
const platform = await provider.getAll("platform");

// Get specific value by path
const name = await provider.get("platform.name");
const registryUrl = await provider.get("platform.registry.url");
```

### Writing Configuration

```typescript
// Set entire namespace
await provider.setAll("platform", {
  name: "my-platform",
  version: "1.0.0",
  org: "myorg"
});

// Set specific value by path
await provider.set("platform.registry.url", "https://registry.example.com");
```

### Checking Availability

```typescript
if (await provider.isAvailable()) {
  // Provider is accessible
}
```

## Configuration Types

### PlatformConfig

```typescript
interface PlatformConfig {
  name: string;
  version: string;
  org: string;
  registry?: {
    url: string;
    source?: string;
    build?: string;
  };
}
```

### EnvironmentsConfig

```typescript
interface EnvironmentsConfig {
  environments: Array<{
    name: string;
    url: string;
    cdnUrl?: string;
  }>;
}
```

### RolloutConfig

```typescript
interface RolloutConfig {
  states: Array<{
    mfeName: string;
    environment: string;
    rolledOut: string;
    rollingOut?: {
      version: string;
      percentage: number;
    };
  }>;
}
```

### GovernanceConfig

```typescript
interface GovernanceConfig {
  scoring?: {
    bundleSize?: { maxKb: number; weight: number };
    coverage?: { minPercent: number; weight: number };
    accessibility?: { minScore: number; weight: number };
  };
  permissions?: {
    allowedScopes?: string[];
    checksumVerification?: boolean;
  };
}
```

## Future Providers (Phase 13)

- `s3://` - AWS S3
- `consul://` - HashiCorp Consul
- `etcd://` - etcd
- `postgres://` - PostgreSQL
- `http://` / `https://` - HTTP API

## Design Principles

1. **JSON-only**: No code execution in configuration (ADR-018)
2. **Provider abstraction**: Swap backends without changing code (ADR-019)
3. **Dot notation**: Access nested values with "key.nested.value" paths
4. **Validation**: All values must be JSON-serializable
