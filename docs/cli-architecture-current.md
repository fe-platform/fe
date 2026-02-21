# CLI Architecture — Pre-Plugin Refactor (ARCHIVED)

> **Status:** ARCHIVED — this describes the flat command structure that existed before the plugin refactor.
> See `cli-architecture-proposed.md` for the current architecture.


```mermaid
graph TB
    subgraph "CLI Entry"
        INDEX["index.ts — argv switch router"]
    end

    subgraph "Commands"
        BUILD["build.ts — build(target)"]
        SERVE["serve.ts — serve(port)"]
        DEV["dev.ts — dev(target, port)"]
        LINK["link.ts — link(consumer, dep)"]
        ADMIN["admin.ts — adminUpload(target)"]
    end

    subgraph "Shared"
        CONFIG["config.ts — types + constants + helpers + I/O"]
    end

    subgraph "External I/O"
        FS_DIST["dist/ directories"]
        FS_UPLOADS["uploads/ local registry"]
        PLATFORM_JSON["sandbox/configs/platform.json"]
        PKG_JSON["*/package.json"]
        BUN_BUILD["Bun.build()"]
        BUN_SERVE["Bun.serve()"]
    end

    INDEX -->|"dynamic import"| BUILD
    INDEX -->|"dynamic import"| SERVE
    INDEX -->|"dynamic import"| DEV
    INDEX -->|"dynamic import"| LINK
    INDEX -->|"dynamic import"| ADMIN

    BUILD --> CONFIG
    SERVE --> CONFIG
    DEV --> CONFIG
    DEV -->|"calls build()"| BUILD
    LINK --> CONFIG
    ADMIN --> CONFIG

    BUILD --> BUN_BUILD
    BUILD --> PLATFORM_JSON
    BUILD --> FS_DIST

    SERVE --> BUN_SERVE
    SERVE --> FS_DIST
    SERVE --> FS_UPLOADS

    DEV --> BUN_SERVE
    DEV --> FS_DIST

    LINK --> PKG_JSON

    ADMIN --> FS_DIST
    ADMIN --> FS_UPLOADS
    ADMIN --> PLATFORM_JSON
    ADMIN --> PKG_JSON
```

## Observations

- `index.ts` is a flat switch-case with dynamic imports (proto-plugin shape)
- `config.ts` is a mixed bag: types, path constants, platform.json I/O, and pure helpers
- `build.ts` hard-codes `Bun.build()`; `admin.ts` hard-codes local filesystem copy + platform.json writes
- `dev.ts` depends directly on `build.ts` (calls `build(target)`)
- No extension points exist; every behavior is inline
