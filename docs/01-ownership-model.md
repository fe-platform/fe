## Ownership Model

Three layers of ownership. Each layer builds on the previous.

### Ore — The FE Platform (Open Source)

**Owner:** FE platform maintainers (open source project)

**What it is:** The framework itself. Runtime, build system, CLI, plugin interfaces, and base packages. Usable by any company.

**Provides:**

| Category | Packages |
|----------|----------|
| **Scaffold** | `create-fe-platform` |
| **Core Runtime** | `@fe/import-map`, `@fe/resolver`, `@fe/preload`, `@fe/manifest` |
| **Config** | `@fe/config` (provider abstraction + file, s3, consul, etcd, postgres, http providers) |
| **CLI Framework** | `@fe/cli-core`, `@fe/cli-config`, `@fe/cli-init`, `@fe/cli-dev`, `@fe/cli-build`, `@fe/cli-publish`, `@fe/cli-clone`, `@fe/cli-preview`, `@fe/cli-rollback`, `@fe/cli-rollout`, `@fe/cli-update-external` |
| **Build System** | `@fe/bundler`, `@fe/transform`, `@fe/loaders`, `@fe/loader-plugin` |
| **Plugin Interfaces** | `CliPlugin`, `LoaderPlugin`, `TransformPlugin`, `GovernancePlugin`, `PlatformPlugin` |
| **Platform Package Bases** | `@fe/state`, `@fe/routing`, `@fe/net`, `@fe/auth`, `@fe/i18n`, `@fe/telemetry`, `@fe/visuals`, `@fe/experimentation` |
| **Testing Bases** | `@fe/test`, `@fe/test-mocks`, `@fe/plays-core`, `@fe/scenes-core` |
| **Governance** | `@fe/permissions`, `@fe/scoring`, `@fe/eslint-config` |
| **AI** | `@fe/catalog-index`, `@fe/catalog-api` |
| **Apps (Self-Hostable)** | `apps/registry`, `apps/build-server`, `apps/catalog`, `apps/preview-server` |

**Does not provide:**

- Company-specific configuration
- Org-scoped packages (`fe:net/workflows`, `fe:plays/checkout`)
- Framework choice (React, Preact, Solid)
- Externalized library versions
- UI component implementations
- Business logic

**SDK surface for Metal layer:**

```typescript
// Plugin interfaces — extend CLI, build, governance
import type { CliPlugin, LoaderPlugin, GovernancePlugin } from "@fe/core"

// Platform package bases — extend for company needs
import { createNetNamespace } from "@fe/net"
import { createStateSlice } from "@fe/state"
import { createPlaysFixture } from "@fe/plays-core"
import { createScene } from "@fe/scenes-core"

// Config interfaces — define company settings
import type { PlatformConfig, ExternalsConfig, GovernanceConfig } from "@fe/core"
```

---

### Metal — Company Platform (Internal)

**Owner:** Company's platform team

**What it is:** Company-specific configuration, extensions, and shared packages built on top of Ore. Internal to the company.

**Builds on Ore to provide:**

| Category | Examples |
|----------|----------|
| **Platform Config** | Framework choice, externalized libraries, browser targets, CDN config |
| **Infrastructure** | Hosted registry, build server, catalog, preview environments |
| **Company Shell** | `fe:@company/shell` — root layout, navigation, chrome |
| **Auth Integration** | `fe:auth` configured for company's identity provider |
| **Network Namespaces** | `fe:net/workflows`, `fe:net/billing`, `fe:net/users` — org-specific APIs with auth boundaries |
| **UI Kit** | `fe:visuals` extended with company design system |
| **Telemetry** | `fe:telemetry` configured for company's observability stack |
| **I18n** | `fe:i18n` configured with company's translation service |
| **Experimentation** | `fe:experimentation` integrated with company's feature flag system |
| **Governance Rules** | Company-specific bundle budgets, a11y requirements, security policies |
| **Testing Fixtures** | `fe:plays/shell`, `fe:scenes/shell` — company-wide test utilities |

**Example: Company platform config**

```json
// config/platform.json
{
  "$schema": "https://fe-platform.dev/schemas/platform/v1.json",
  "name": "acme",
  "registry": "https://fe-registry.acme.com",
  "cdn": "https://fe-cdn.acme.com",
  "framework": "react",
  "externals": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "lodash": "^4.17.0",
    "date-fns": "^3.0.0"
  },
  "targets": ["chrome >= 90", "firefox >= 90", "safari >= 15"]
}
```

```json
// config/governance.json
{
  "$schema": "https://fe-platform.dev/schemas/governance/v1.json",
  "bundleBudget": 150000,
  "coverageMinimum": 80,
  "a11yLevel": "AA",
  "enforcePermissions": true
}
```

**Example: Company net namespace**

```typescript
// company-platform/packages/net-workflows/index.ts

import { createNetNamespace } from "@fe/net"

export const workflowsNet = createNetNamespace({
  name: "workflows",
  baseUrl: "https://api.company.com/workflows",
  
  auth: {
    tokenSource: () => getWorkflowsToken(),
    refreshStrategy: "silent",
    onUnauthorized: () => redirectToLogin()
  },
  
  endpoints: {
    getWorkflow: (id: string) => `/workflows/${id}`,
    listWorkflows: () => `/workflows`,
    createWorkflow: () => `/workflows`
  }
})

// MFE authors import: import { getWorkflow } from "fe:net/workflows"
```

**Example: Company plays fixture**

```typescript
// company-platform/packages/plays-shell/index.ts

import { createPlaysFixture } from "@fe/plays-core"

export const shellPlays = createPlaysFixture({
  name: "shell",
  
  fixtures: {
    async authAsRandomUser(page) {
      await page.goto("/login")
      await page.fill("[data-testid=email]", generateTestEmail())
      await page.fill("[data-testid=password]", TEST_PASSWORD)
      await page.click("[data-testid=submit]")
      await page.waitForURL("/dashboard")
    },
    
    async authAsAdmin(page) {
      // ...
    },
    
    async navigateTo(page, route) {
      // ...
    }
  }
})

// MFE authors import: import { authAsRandomUser } from "fe:plays/shell"
```

---

### Blade — Product MFEs (Team-Owned)

**Owner:** Product teams (smiths)

**What it is:** Actual micro-frontends built by product teams using the Metal layer. Deliver business value.

**Consumes from Metal:**

```typescript
// A product team's MFE

// Platform packages (configured by Metal)
import { useStore } from "fe:state"
import { useRoute, navigate } from "fe:routing"
import { Button, Card } from "fe:visuals"
import { t } from "fe:i18n"
import { useFlag } from "fe:experimentation"

// Org network namespaces (built by Metal)
import { getWorkflow, createWorkflow } from "fe:net/workflows"
import { getUser } from "fe:net/users"

// Other MFEs (built by other smiths)
import { UserAvatar } from "fe:@users/profile/components"

export default function WorkflowDashboard() {
  const workflows = useStore(state => state.workflows.list)
  const showNewUI = useFlag("new-workflow-ui")
  
  return (
    <Card>
      <h1>{t("workflows.dashboard.title")}</h1>
      {/* ... */}
    </Card>
  )
}
```

**Publishes for other smiths:**

```typescript
// This MFE's manifest.json
{
  "name": "@workflows/dashboard",
  "exports": {
    ".": "./src/index.tsx",
    "./components": "./src/components/index.ts",  // Other MFEs can use these
    "./hooks": "./src/hooks/index.ts"
  }
}

// This MFE's plays (for E2E composition)
// fe:plays/workflows
export { startWorkflow, completeStep, archiveWorkflow } from "./plays"

// This MFE's scenes (for mocking)
// fe:scenes/workflows  
export { emptyWorkflowList, workflowsWithDraft, completedWorkflows } from "./scenes"
```

---

### Layer Responsibilities Summary

| Concern | Ore (FE Platform) | Metal (Company Platform) | Blade (Product MFEs) |
|---------|-------------------|--------------------------|----------------------|
| **Runtime** | Provides | Hosts | Uses |
| **Build system** | Provides | Configures & hosts | Publishes to |
| **CLI** | Provides commands | May add custom commands | Uses |
| **Config** | Provider abstraction | Chooses provider, sets values | Reads (via platform) |
| **Plugin interfaces** | Defines | Implements | — |
| **fe:state** | Base implementation | Slice conventions | Reads/writes slices |
| **fe:routing** | Base implementation | Route structure | Declares routes |
| **fe:net** | Base + namespace SDK | Org namespaces | Calls endpoints |
| **fe:auth** | Base implementation | Identity provider config | Checks auth state |
| **fe:visuals** | Base tokens/utils | Component library | Uses components |
| **fe:telemetry** | Auto-instrumentation | Backend integration | Custom events |
| **fe:i18n** | Base implementation | Translation service | Uses `t()` |
| **fe:experimentation** | Base implementation | Flag service integration | Checks flags |
| **fe:plays** | Fixture SDK | Shell fixtures | MFE fixtures |
| **fe:scenes** | Scene SDK | Shell scenes | MFE scenes |
| **Governance** | Scoring engine | Rules & thresholds | Adheres to |
| **Externals** | Mechanism | Version decisions | Bundles or uses |
| **Framework** | Agnostic | Chooses/configures | Uses |

---

### Extension Points (Ore → Metal)

How company platform teams extend the Ore:

| Extension Point | SDK | Purpose |
|-----------------|-----|---------|
| `createNetNamespace()` | `@fe/net` | Define org-scoped API clients with auth |
| `createStateSlice()` | `@fe/state` | Define typed state slices with actions |
| `createPlaysFixture()` | `@fe/plays-core` | Define composable E2E flows |
| `createScene()` | `@fe/scenes-core` | Define mockable component states |
| `defineGovernanceRule()` | `@fe/scoring` | Add custom governance checks |
| `createLoaderPlugin()` | `@fe/loader-plugin` | Add custom file loaders |
| `createCliPlugin()` | `@fe/cli-core` | Add custom CLI commands |
| `createVisualTokens()` | `@fe/visuals` | Define design system tokens |
| `createAuthProvider()` | `@fe/auth` | Integrate identity provider |
| `createTelemetrySink()` | `@fe/telemetry` | Integrate observability backend |
| `createI18nSource()` | `@fe/i18n` | Integrate translation service |
| `createFlagSource()` | `@fe/experimentation` | Integrate feature flag service |

---

### Minimal Metal (Day 1)

The bar for starting a company platform is intentionally low. A platform team can go from zero to "smiths can ship MFEs" in under an hour.

**Everything is:**
- **JSON** — no TypeScript config, no build step for config
- **Local** — filesystem, SQLite, no cloud dependencies
- **Plain text** — human-readable, git-diffable
- **Static** — just files, a static server, and the CLI

**Scaffold:**

```bash
$ npx create-fe-platform@latest acme --local

Creating acme-platform...

✓ config/platform.json      # Minimal platform config
✓ config/environments.json  # Just "dev" environment
✓ config/rollout.json       # Empty rollout state
✓ config/governance.json    # Permissive defaults
✓ config/cli.json           # No plugins yet
✓ .fe/provider.json         # Points to file://./config

Done. Run:
  cd acme-platform
  bun run dev

Platform running at http://localhost:4000
```

**Minimal config (two decisions):**

```json
// config/platform.json
{
  "$schema": "https://fe-platform.dev/schemas/platform/v1.json",
  "name": "acme",
  "cdn": {
    "provider": "local"
  },
  "framework": "react"
}
```

**Config provider starts local:**

```json
// .fe/provider.json
{
  "provider": "file://./config"
}
```

**What defaults provide:**

| Concern | Default | Upgrade Path |
|---------|---------|--------------|
| Config provider | Local files | S3, Consul, Postgres |
| Registry | Local SQLite | Postgres, managed service |
| Build server | Single process | Distributed workers |
| CDN | Local filesystem | R2, S3, CloudFront |
| Externals | Framework only | Add lodash, date-fns, etc. |
| Governance | Permissive (report only) | Enforce thresholds |
| Auth | None (anonymous) | Add identity provider |
| Net namespaces | None | Add per org as needed |
| Visuals | Minimal tokens | Full design system |
| Telemetry | Console logging | Datadog, Honeycomb, etc. |
| I18n | Passthrough | Translation service |
| Experimentation | Always false | LaunchDarkly, Split, etc. |

**First MFE ships immediately:**

```bash
# In a product team's repo
$ fe init @acme/checkout --registry=http://localhost:4001
$ cd checkout
$ fe dev
$ fe publish
```

No auth. No net namespaces. No governance. Those come later when the platform team is ready.

---

### Progressive Metal

Platform teams add capabilities as needs arise.

| Stage | Trigger | Action |
|-------|---------|--------|
| **Day 1** | "We want MFEs" | `create-fe-platform` scaffold |
| **Week 1** | "Smiths need to ship" | Default config, local infra |
| **Month 1** | "Need real hosting" | Upgrade CDN config to R2/S3 |
| **Month 2** | "Need auth" | `createAuthProvider()` with Okta/Auth0 |
| **Month 3** | "API calls are messy" | First `createNetNamespace()` |
| **Month 4** | "Need consistent UI" | `createVisualTokens()` + base components |
| **Month 6** | "E2E tests are duplicating setup" | `createPlaysFixture()` for shell |
| **Month 8** | "Bundles are getting big" | Enable governance scoring |
| **Month 12** | "Need to enforce standards" | Set governance thresholds to blocking |
| **Year 2** | "Need distributed builds" | Upgrade build server infra |

Each step is independent. Skip what you don't need.

---

### Progressive Complexity at Every Layer

The same principle applies at all three layers:

| Layer | Day 1 | Enterprise |
|-------|-------|------------|
| **Ore** | Clone repo, `bun run dev` | Distributed, multi-region |
| **Metal** | `create-fe-platform`, single config | Auth, governance, distributed builds |
| **Blade** | 3 files, export a component | Permissions, AI context, full NATIVERS |

No layer requires understanding the layer below it. A smith doesn't need to know how Metal works. A Metal team doesn't need to know Ore internals.

---

