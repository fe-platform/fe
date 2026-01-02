## Framework Interop Boundary

Framework agnosticism has limits.

**Rule:** Cross-framework composition is allowed only at DOM boundaries, never via shared components or hooks.

**Implications:**
- React MFE may render a Vue MFE as a child via shell slot
- React cannot import Vue components directly
- Shared UI lives in `fe:visuals`, not cross-MFE imports

This avoids false expectations while preserving flexibility.

---

## Non-Goals

The platform is explicitly **not**:

- A runtime sandbox or security boundary
- A per-MFE versioning system
- A design system replacement
- An attempt to hide organizational ownership
- A framework interoperability layer

These constraints are deliberate.
```

---

