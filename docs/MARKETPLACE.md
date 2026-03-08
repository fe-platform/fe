# ✧ MFE Marketplace & JSR Integration

The fe platform is "source-first." JSR (jsr.io) is a registry built for raw TypeScript source. This document outlines how we leverage JSR as the primary discovery and distribution layer for the fe ecosystem using registry-compatible specifiers.

## 1. The Official Namespace & Naming Convention
To ensure compatibility with public registries while maintaining platform identity, all MFEs follow the `@scope/fe-name` convention:

- **Registry Name:** `@feo/fe-syntax-highlighter`
- **Platform Identity:** `@feo/fe-syntax-highlighter`
- **Discovery Tag:** We include `fe-platform` in the package description to enable search-based discovery.

## 2. JSR as the Source Registry
While `fe publish` remains the primary tool for internal/private MFEs, JSR is the recommended path for public sharing.

### The Publishing Flow
1. Developer creates a standard fe MFE.
2. Developer configures `package.json` with a valid `@scope/fe-name`.
3. Developer adds the `fe-platform` keyword to the `description` or `keywords` field.
4. `npx jsr publish` pushes the raw source to JSR.

### The Consumption Flow
The fe platform (CLI/Runtime) resolves these specifiers directly or via import maps.
- `import { ... } from "@feo/fe-syntax-highlighter"`
- ↓ Resolved via import map to:
- `https://esm.sh/jsr/@feo/fe-syntax-highlighter`

## 3. The Marketplace UI
The fe documentation site will host a "Marketplace" section.
- **Mechanism:** Client-side fetch to the JSR API (`https://api.jsr.io/packages?q=fe-`).
- **Display:** Renders a searchable grid of MFEs showing their specifier, README, and link instructions.

## 4. Implementation Phase 1: The Highlighter
- **Location:** `toolkit/syntax-highlighter`
- **JSR Name:** `@feo/fe-syntax-highlighter`
- **Goal:** Docs site becomes the first consumer of an MFE pulled via a public registry.
