## Namespaced Packages

Beyond NATIVERS, certain platform packages use org/MFE subpaths to enable cross-team collaboration without coupling.

### fe:net — Network by Org

```
fe:net                  → Base utilities (fetch, retry, interceptors, proxy config)
fe:net/workflows        → Workflows org APIs + token exchange/refresh/persistence
fe:net/agreements       → Agreements org APIs + their auth logic
fe:net/clm              → CLM org APIs + their auth logic
```

Each subpath is self-contained:
- Knows its endpoints
- Handles its own token lifecycle (exchange, refresh, persistence)
- Inherits base infrastructure from `fe:net`

A developer in any MFE can `import { getWorkflow } from "fe:net/workflows"` without understanding that org's auth setup. Auth boundaries are encapsulated.

Org teams own their `fe:net/{org}` package. Platform owns `fe:net` base.

### fe:plays — Playwright Fixtures and Flows

```
fe:plays                → Base test utilities, browser setup
fe:plays/shell          → Shell flows: authAsRandomUser(), navigateTo()
fe:plays/checkout       → Checkout flows: addItemToCart(), completePayment()
fe:plays/agreements     → Agreement flows: createEnvelope(), signDocument()
```

Purpose: Composable E2E test primitives. An MFE testing a workflow that spans multiple orgs imports their plays:

```ts
import { authAsRandomUser } from "fe:plays/shell"
import { createEnvelope } from "fe:plays/agreements"
import { completePayment } from "fe:plays/checkout"

test("full purchase flow", async ({ page }) => {
  await authAsRandomUser(page)
  await createEnvelope(page, { template: "sales-contract" })
  await completePayment(page, { method: "card" })
})
```

Each MFE owns its plays. Platform provides base utilities and test harness.

### fe:scenes — Mocked States and Props

```
fe:scenes               → Base MSW setup, mock utilities
fe:scenes/checkout      → Checkout component props, mocked API responses
fe:scenes/header        → Header states (logged-in, logged-out, admin)
fe:scenes/agreements    → Agreement mock data, document states
```

Purpose: Showcase MFE behaviors without real backends. Useful for:
- Storybook-style component exploration
- Integration testing with controlled state
- Demos and documentation

```ts
import { cartWithItems, emptyCart } from "fe:scenes/checkout"
import { adminUser } from "fe:scenes/header"

// Render checkout in specific state
<Checkout {...cartWithItems} user={adminUser} />
```

Scenes include MSW handlers, so importing a scene can automatically mock its APIs.

### Additional Namespace Candidates

| Namespace | Purpose |
|-----------|---------|
| `fe:types/@org/mfe` | TypeScript types for an MFE's public API. Import types without runtime code. |
| `fe:contracts/@org/mfe` | API contracts (shapes, error codes). Generate MSW handlers, validators. |
| `fe:events/@org/mfe` | State events an MFE emits. Documents observable state changes. |
| `fe:perf/@org/mfe` | Performance budgets and benchmarks. Platform enforces at build time. |

### Namespace Principles

1. **Org teams own their subpaths** — `fe:net/workflows` is owned by the Workflows team
2. **Platform owns the base** — `fe:net`, `fe:plays`, `fe:scenes` base utilities are platform-maintained
3. **Self-contained subpaths** — Importing a subpath should not require understanding another org's internals
4. **Explicit over implicit** — If knowledge is needed cross-team, it becomes an importable package

---

