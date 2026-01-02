## Platform Standards

### Testing

**Runner:** Vitest (Bun-native). Platform provides base config.

**fe:test** — Common test utilities:

```ts
import { render, screen, fireEvent } from "fe:test"
import { mockState, mockNet, mockRouter } from "fe:test/mocks"

test("checkout displays cart total", async () => {
  mockState({ cart: { items: [{ id: "1", price: 25 }] } })
  mockNet("fe:net/payments", { handlers: happyPath })
  
  render(<Checkout />)
  
  expect(screen.getByText("$25.00")).toBeVisible()
})
```

**Mock utilities in fe:test/mocks:**

| Utility | Purpose |
|---------|---------|
| `mockState(initial)` | Seeds `fe:state` for test |
| `mockNet(namespace, options)` | Intercepts `fe:net` calls |
| `mockStorage()` | In-memory localStorage/sessionStorage |
| `mockRouter(route)` | Sets `fe:routing` state |
| `mockI18n(locale, strings)` | Stubs `fe:i18n` |

**Coverage is part of governance scoring.** Platform measures and reports; teams see their score.

### Linting

Platform provides base config (ESLint). Two tiers:

| Tier | Can Override? | Examples |
|------|---------------|----------|
| **Safety** | No | `no-any`, `no-unused-vars`, a11y rules, `no-console` in prod |
| **Style** | Yes | quotes, semicolons, import order, line length |

MFEs extend via `.eslintrc.json`:

```json
{
  "extends": ["@fe/eslint-config/base"],
  "rules": {
    "quotes": ["error", "single"]
  }
}
```

Safety rules are enforced at build time. Violations fail the build.

### File Loaders

**Blessed set** — Platform supports out of the box:

| Type | Extensions | Output |
|------|------------|--------|
| TypeScript | `.ts`, `.tsx` | JS |
| CSS | `.css` | Scoped CSS |
| SCSS | `.scss`, `.sass` | Scoped CSS |
| JSON | `.json` | ES module |
| Images | `.png`, `.jpg`, `.svg`, `.webp` | URL or inline |
| Static | `.txt`, `.md` | String |

**Bring your own loader** — MFEs can declare custom loaders in manifest:

```json
{
  "name": "@myorg/checkout",
  "loaders": {
    ".graphql": "@myorg/graphql-loader",
    ".hbs": "@myorg/handlebars-loader"
  }
}
```

Platform runs custom loaders at build time. Consequences:
- Build time increases
- Custom loaders are the team's responsibility to maintain
- No platform support for custom loader issues
- Loader must be published to the registry

### Externalized Libraries

Platform externalizes shared utilities. All MFEs get the same version.

**Platform-managed externals** (always externalized):

```
fe:state, fe:net, fe:routing, fe:visuals, fe:i18n, fe:auth, fe:telemetry, fe:experimentation
```

**Company-configured externals** — Each company adopting the platform configures:

```json
{
  "externals": {
    "lodash": "^4.17.0",
    "date-fns": "^3.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

MFEs importing these get the shared chunk. Platform resolves version conflicts to highest compatible.

**Framework choice is company-level.** The platform is framework-agnostic. Each company decides:
- Which framework(s) to support (React, Preact, Solid, Vue, none)
- Whether to externalize the framework or let MFEs bundle it
- Interoperability rules between frameworks (if multiple)

Platform provides the externalization mechanism. Documentation covers configuration patterns. No opinion enforced.

### Version Pinning

MFEs declare minimum versions in manifest:

```json
{
  "dependencies": {
    "npm": {
      "lodash": ">=4.17.21",
      "date-fns": ">=3.0.0"
    }
  }
}
```

Platform resolves to highest compatible version across all MFEs. If conflicts are irreconcilable, build fails with clear error.

**Pinning workflow:**

1. Platform team updates company externals config
2. Build server rebuilds all MFEs with new versions
3. E2E runs against staged environment
4. On success, promote to production
5. All MFEs get new version without redeployment

---

