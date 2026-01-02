## NATIVERS: Platform Packages

Platform provides these packages via `fe:` imports. MFEs consume them; platform owns implementation.

| Package | Specifier | Purpose |
|---------|-----------|---------|
| Network | `fe:net` | API calls, retries, auth header injection, proxy config |
| Auth | `fe:auth` | Authentication state, token management, security boundaries |
| Telemetry | `fe:telemetry` | Auto-instrumentation via a11y tags, custom events, performance metrics |
| I18n | `fe:i18n` | String localization, locale detection, formatting |
| Visuals | `fe:visuals` | UI component library, design tokens, theming |
| Experimentation | `fe:experimentation` | Feature flags, A/B tests, remote config |
| Routing | `fe:routing` | Navigation, route matching, history management |
| State | `fe:state` | Global store access, selectors, actions |

NATIVERS is a mnemonic, not a goal. Platform packages exist to standardize cross-cutting concerns.

---

