## Open Questions (For Implementation Phase)

1. **Hot module replacement** — Does the dev server support HMR across MFE boundaries?

2. **Dependency deduplication** — How does the platform dedupe shared npm dependencies across MFEs?

Previously open, now decided:
- ~~State slice conventions~~ → ADR-021: Ownership model with `<owner>/<slice>` naming
- ~~Error boundaries~~ → ADR-022: Platform-provided error boundaries, isolated failures
- ~~CSS isolation~~ → ADR-023: Build-time scoped CSS by default
- ~~Rollout cohort assignment~~ → Cookie-based, session-sticky

---

## Progressive Complexity Model (Blade)

For product teams building MFEs. See "Progressive Metal" in Ownership Model for platform team progression.

| Stage | What You Get | What You Add |
|-------|--------------|--------------|
| **Day 1** | Deployable MFE | 3 files: component, manifest, tsconfig |
| **Need state** | Global store access | `import { useStore } from "fe:state"` |
| **Need APIs** | Network layer with auth | `import { get } from "fe:net/yourorg"` |
| **Need routing** | Platform routing | Export `routes` config |
| **Need tests** | Composable E2E | Publish `fe:plays/yourorg` |
| **Need demos** | Mocked showcases | Publish `fe:scenes/yourorg` |
| **Need security** | Permission boundaries | Add `permissions` to manifest |
| **Need AI** | Agent discoverability | Add `ai` to manifest |
| **Need governance** | Scores and audits | Platform provides automatically |

Enterprise features are always available, never required.

---

