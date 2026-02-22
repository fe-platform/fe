---
sidebar_position: 1
---

# Installation

The fe platform has one runtime prerequisite: Bun. Not Node, not npm, not a bundler with seventeen config files. Just Bun. If that sounds like a relief, you are in the right place.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Bun](https://bun.sh) | latest | the only runtime required |
| git | any modern version | for cloning |

Node, npm, webpack, Vite, and Rollup are not part of this toolchain and are not needed at any point.

## Install Bun

If Bun is not already installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify it landed:

```bash
bun --version
```

## Clone and Bootstrap

```bash
git clone https://github.com/AshGw/fe.git
cd fe
bun install
```

`bun install` resolves all workspaces in a single pass. It installs dependencies for `packages/`, `sandbox/`, `toolkit/`, and the docs site, and it registers the `fe` binary from `@fe/cli` in `node_modules/.bin`.

## Verify the CLI

```bash
./node_modules/.bin/fe
```

You should see the list of available commands. For convenience, add `./node_modules/.bin` to your shell `PATH` so you can type `fe` directly from the workspace root. All examples in this documentation assume that is the case.

```bash
# add to ~/.bashrc or ~/.zshrc
export PATH="./node_modules/.bin:$PATH"
```

## What Was Just Installed

Three workspace groups are now wired together:

| Directory | Contents |
|-----------|----------|
| `packages/` | `@fe/core`, `@fe/cli`, `@fe/runtime` — the published toolchain |
| `sandbox/` | `host-app`, `mfe-a`, `mfe-b`, and `configs/` — the reference workspace |
| `toolkit/` | `devtools` — the developer overlay |

The sandbox is not published. It exists so you can see the full workflow running end to end before building anything of your own.

**Next:** [Your First MFE](./your-first-mfe)
