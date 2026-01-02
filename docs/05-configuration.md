## Configuration Model

### JSON Only

All configuration is JSON. No TypeScript config files. No JavaScript. No YAML.

**Why:**
- Schema validation is trivial
- Migration tooling is trivial (`jq`, any language)
- Diffable, mergeable, auditable
- No build step for config
- Config providers (Consul, etcd, S3, database) speak JSON natively

**Config files:**

| File | Purpose |
|------|---------|
| `platform.json` | Platform-level settings (CDN, framework, externals) |
| `environments.json` | Environment definitions (dev, staging, prod) |
| `rollout.json` | Current rollout state per environment |
| `governance.json` | Governance rules and thresholds |
| `cli.json` | CLI plugins for platform extension |
| `manifest.json` | MFE metadata (per MFE repo) |

### Day 1: Static Files

The simplest possible setup:

```
my-platform/
├── config/
│   ├── platform.json       # {"name": "acme", "framework": "react"}
│   ├── environments.json   # {"environments": ["dev"]}
│   ├── rollout.json        # {} (empty, no rollouts yet)
│   ├── governance.json     # {} (empty, permissive)
│   └── cli.json            # {"plugins": []} (no extensions yet)
├── registry/               # SQLite file + MFE sources
└── dist/                   # Built artifacts
```

Start with a static file server:

```bash
$ npx create-fe-platform@latest acme --local

✓ Created acme/
✓ Config files in acme/config/
✓ Run: cd acme && bun run dev

# This starts:
# - Static file server for config/
# - Registry server (SQLite)
# - Build server (single process)
```

CLI reads/writes config from disk:

```bash
$ fe config get platform.framework
"react"

$ fe config set platform.externals.lodash "^4.17.0"
# Writes to config/platform.json
```

### Config Provider Abstraction

CLI doesn't know where config lives. It talks to a config provider interface:

```typescript
interface ConfigProvider {
  get<T>(key: string): Promise<T>
  set<T>(key: string, value: T): Promise<void>
  watch<T>(key: string, callback: (value: T) => void): Unsubscribe
}
```

**Built-in providers:**

| Provider | Use Case |
|----------|----------|
| `file://` | Local JSON files (Day 1) |
| `s3://` | S3/R2 bucket |
| `consul://` | HashiCorp Consul |
| `etcd://` | etcd cluster |
| `postgres://` | PostgreSQL table |
| `http://` | Any HTTP API |

**Switch providers without changing commands:**

```bash
# Day 1: local files
$ fe config set platform.externals.lodash "^4.17.0"
# Writes to ./config/platform.json

# Later: point to S3
$ fe config use s3://acme-fe-config/production

$ fe config set platform.externals.lodash "^4.17.0"
# Writes to S3 bucket
```

The `.fe/provider.json` file (or env var) tells CLI where config lives:

```json
{
  "provider": "file://./config"
}
```

Upgrade to remote:

```json
{
  "provider": "s3://acme-fe-config/production",
  "credentials": "aws-profile:fe-admin"
}
```

### Rollout State as Config

Rollout is just config data. Same provider, same abstraction.

```json
// rollout.json
{
  "environments": {
    "production": {
      "fe:@org/checkout": {
        "rolled-out": "2.3.0",
        "rolling-out": {
          "version": "2.4.0",
          "percentage": 10
        }
      },
      "fe:@org/header": {
        "rolled-out": "1.8.0",
        "rolling-out": null
      }
    }
  }
}
```

CLI commands update this config:

```bash
$ fe rollout @org/checkout --env=production --percentage=25
# Equivalent to:
# fe config set "rollout.environments.production.fe:@org/checkout.rolling-out.percentage" 25
```

Centralize rollout by pointing config provider to a remote:

```bash
# All rollout commands now hit the central config provider
$ fe config use consul://consul.internal:8500/fe/production
```

### Platform Team Journey

**Week 1: Local everything**

```
config/           → JSON files on disk
registry/         → SQLite file
dist/             → Local filesystem
```

CLI commands read/write local files. One developer can run the whole platform.

**Month 2: Shared config**

```
config/           → S3 bucket (shared)
registry/         → SQLite file (local)
dist/             → Local filesystem
```

Platform team shares config via S3. Multiple developers see same state.

**Month 6: Shared registry**

```
config/           → S3 bucket
registry/         → PostgreSQL (shared)
dist/             → S3 bucket
```

Source registry is now shared. Distributed builds possible.

**Year 1: Full production**

```
config/           → Consul cluster (HA)
registry/         → PostgreSQL cluster (HA)
dist/             → CloudFront + S3
rollout/          → Consul (real-time updates)
```

Same CLI commands. Same JSON schemas. Different providers.

### Schema Versioning

Every config file has a schema version:

```json
{
  "$schema": "https://fe-platform.dev/schemas/platform/v1.json",
  "name": "acme",
  "framework": "react"
}
```

Migration is mechanical:

```bash
$ fe migrate --from=v1 --to=v2

Migrating config files...
✓ platform.json: v1 → v2 (added "telemetry.enabled": true)
✓ governance.json: v1 → v2 (renamed "bundleBudget" → "budgets.bundle")

Review changes? (y/n)
```

Because it's JSON, migrations are just transforms. No code execution.

---

