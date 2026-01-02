## Versioning

### One Version Policy

**A single version of anything, everywhere.** This applies to:

- MFEs
- Platform packages (NATIVERS)
- Externalized libraries (React, lodash, etc.)
- Org-scoped packages (`fe:net/workflows`, `fe:plays/shell`)

No version ranges. No "MFE A uses lodash 4.17.20 while MFE B uses 4.17.21." The import map resolves every specifier to exactly one URL.

**Why:**
- Eliminates version mismatch bugs
- Reduces bundle size (true deduplication)
- Simplifies debugging (one version to investigate)
- Forces teams to stay current

### Two-State Model

Each environment has exactly two possible states for any package:

| State | Description |
|-------|-------------|
| **Rolled out** | Current production version. 100% of traffic. |
| **Rolling out** | Next version. Receiving incremental traffic during rollout. |

That's it. No v1, v2, v3 running simultaneously. No "pinned to old version because we haven't tested yet."

**Per environment:**

```
Development:  rolled-out: v2.3.0
Staging:      rolled-out: v2.3.0, rolling-out: v2.4.0 (50%)
Production:   rolled-out: v2.2.0, rolling-out: v2.3.0 (10%)
```

### Rollout Flow

```
Publish v2.4.0
    ↓
Development: instantly becomes rolled-out
    ↓
Staging: enters as rolling-out (canary %)
    ↓
Staging: percentage increases over time
    ↓
Staging: reaches 100%, becomes rolled-out (previous version dropped)
    ↓
Production: enters as rolling-out (canary %)
    ↓
Production: percentage increases over time
    ↓
Production: reaches 100%, becomes rolled-out
```

### Slow Rollouts

Platform controls rollout speed via traffic percentage:

```json
{
  "fe:@org/checkout": {
    "rolled-out": {
      "version": "2.3.0",
      "url": "https://cdn.../checkout/2.3.0/index.js"
    },
    "rolling-out": {
      "version": "2.4.0",
      "url": "https://cdn.../checkout/2.4.0/index.js",
      "percentage": 10
    }
  }
}
```

The shell (or platform runtime) determines which version a user session gets. Once assigned, that session stays on that version for consistency.

**Rollout commands:**

```bash
# Start rollout at 5%
$ fe rollout @org/checkout --env=production --percentage=5

# Increase to 25%
$ fe rollout @org/checkout --env=production --percentage=25

# Complete rollout (100%, becomes rolled-out)
$ fe rollout @org/checkout --env=production --complete
```

### Rollbacks

Rollback is just a fast rollout of the previous version:

```bash
$ fe rollback @org/checkout --env=production

# Equivalent to:
# 1. Set rolling-out to previous version at 100%
# 2. Immediately complete rollout
# 3. Previous "rolling-out" is discarded
```

Rollback is instant because the previous version's artifacts still exist on CDN.

### Falling Forward

The two-state model forces falling forward:

- Can't maintain v1 while shipping v2 and testing v3
- Can't "pin" to an old version indefinitely
- Must fix forward, not work around with version locks

**If something breaks:**
1. Rollback immediately (previous version)
2. Fix the issue
3. Publish new version
4. Rollout again

No third concurrent version. No escape hatches.

### Externals and Platform Packages

Same model applies to externalized libraries:

```bash
# Platform team updates React
$ fe update-external react --version=18.3.0 --env=staging

# This triggers:
# 1. Rebuild all MFEs with new React version
# 2. New versions enter staging as rolling-out
# 3. Rollout proceeds per normal flow
```

Because platform controls the build, externals updates are atomic across all MFEs.

### Version Resolution

Import maps are generated per environment, per rollout state:

```
User session assigned to "rolling-out" cohort
    ↓
Platform serves import map with rolling-out URLs
    ↓
All fe: imports resolve to rolling-out versions
    ↓
Entire app is consistent (no mixed versions)
```

A user never sees v2.3.0 of checkout with v2.4.0 of header. The entire import map is one atomic snapshot.

### Rollout Cohort Assignment

**Decision:** Cookie-based, session-sticky, environment-scoped.

**Behavior:**
- User is assigned to rolled-out or rolling-out on first request
- Assignment persists for the session
- Import map is consistent for the entire session
- Clearing cookies resets cohort

Debuggable, infra-light, and support-friendly.

---

