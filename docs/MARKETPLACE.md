# ✧ fe() Marketplace & JSR Integration

The fe platform is "source-first." JSR (jsr.io) is a registry built for raw TypeScript source. This document outlines the plan to leverage JSR as the primary discovery and distribution layer for the fe ecosystem while maintaining the unique `fe()` visual identity.

## 1. The "Official" Namespace & Visual Identity
To distinguish platform-maintained utilities from third-party MFEs, we adopt the `#` prefix. Since registries like JSR do not allow parentheses, we use a **Visual Bridge**:

- **Registry Name:** `@feo/fe-syntax-highlighter`
- **Platform Identity:** `fe(#syntax-highlighter)`
- **Discovery Tag:** We include the platform identity in the package description to enable search-based discovery.

## 2. JSR as the Source Registry
While `fe publish` remains the primary tool for internal/private MFEs, JSR is the recommended path for public sharing.

### The Publishing Flow
1. Developer creates a standard fe MFE.
2. Developer adds a `jsr.json` with a valid `@scope/name`.
3. Developer adds the visual identity (e.g., `fe(my-mfe)`) to the `description` field.
4. `npx jsr publish` pushes the raw source to JSR.

### The Consumption Flow (The Resolver)
The fe platform (CLI/Runtime) will implement a resolver that translates the visually unique `fe()` specifiers into registry-valid fetch URLs.
- `import { ... } from "fe(#syntax-highlighter)"`
- ↓ Resolver translates to:
- `import { ... } from "https://esm.sh/jsr/@feo/fe-syntax-highlighter"`

## 3. The Marketplace UI
The fe documentation site will host a "Marketplace" section.
- **Mechanism:** Client-side fetch to the JSR API (`https://api.jsr.io/packages?q=fe(`).
- **Extraction:** The UI parses the `description` field of returned packages to extract the `fe()` visual name.
- **Display:** Renders a searchable grid of MFEs showing their visual identity, README, and link instructions.

## 4. Implementation Phase 1: The Highlighter
- **Location:** `toolkit/syntax-highlighter`
- **JSR Name:** `@feo/fe-syntax-highlighter`
- **Visual Name:** `fe(#syntax-highlighter)`
- **Goal:** Docs site becomes the first consumer of an MFE pulled via a public registry using this bridge.
