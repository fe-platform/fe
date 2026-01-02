## Quick Reference for Agents

### Start Here

1. Read the [Ownership Model](#ownership-model) to understand Ore/Metal/Blade
2. Read the [Tech Stack](#tech-stack) and [Monorepo Structure](#monorepo-structure)
3. Read the [AI Agent Guidelines](#ai-agent-guidelines) before writing code
4. Follow [Development Phases](#development-phases) in order

### Key Constraints

- **JSON only** for all configuration (platform.json, cli.json, etc.)
- **Bun** for runtime, bundler, and tests
- **Plugin first** — if it can be a plugin, make it a plugin
- **One Version Policy** — single version of everything, everywhere
- **Two-State rollouts** — only rolled-out and rolling-out states
- **State ownership** — every slice has one owner, only owner writes
- **CSS scoped by default** — no Shadow DOM, hashed class names
- **MFE failure isolation** — error boundaries, never crash shell

### Key Files

| File | Purpose |
|------|---------|
| `platform.json` | CDN, framework, externals |
| `cli.json` | CLI plugin extensions |
| `rollout.json` | Version rollout state |
| `manifest.json` | Per-MFE metadata |

### First Package to Build

`@fe/core` — plugin system skeleton. Everything depends on this.

### Success Metric

`npx create-fe-platform test && cd test && bun run dev` works and serves a hello world MFE.
