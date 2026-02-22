---
sidebar_position: 1
---

# Installation

The fe platform has one runtime prerequisite: Bun. Not Node, not npm, not a bundler with seventeen config files. Just Bun.

## Prerequisites

| Tool | Version |
|------|---------|
| [Bun](https://bun.sh) | latest |

Node, npm, webpack, Vite, and Rollup are not part of this toolchain and are not needed at any point.

## Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify:

```bash
bun --version
```

## Create a Workspace

The fe CLI runs from a workspace root. Create one:

```bash
mkdir my-app && cd my-app
```

Create `package.json`:

```json
{
  "name": "my-app",
  "private": true,
  "workspaces": ["shell", "mfe-*"],
  "devDependencies": {
    "@fe/cli": "latest",
    "@fe/runtime": "latest"
  }
}
```

The `workspaces` array tells Bun which directories contain packages. The `mfe-*` glob covers every MFE you create. `shell` is the default name the CLI expects for your host application. Both can be configured, but the defaults require no configuration file at all.

Install:

```bash
bun install
```

## Verify the CLI

```bash
./node_modules/.bin/fe
```

You should see the list of available commands. To drop the path prefix for everyday use, add `./node_modules/.bin` to your shell `PATH`:

```bash
# add to ~/.bashrc or ~/.zshrc
export PATH="./node_modules/.bin:$PATH"
```

All examples in this documentation use `fe` directly. Run all commands from the workspace root unless noted otherwise.

**Next:** [Your First MFE](./your-first-mfe)
