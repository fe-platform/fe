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

## Set Up a Working Directory

The fe CLI runs from a directory that contains a `configs/` folder. Create one:

```bash
mkdir my-app && cd my-app
```

Install the CLI locally:

```bash
bun add -d @fe/cli
```

Create the registry file the CLI writes to:

```bash
mkdir configs
```

Create `configs/platform.json`:

```json
{
  "routes": {},
  "packages": {}
}
```

## Verify the CLI

```bash
./node_modules/.bin/fe
```

You should see the list of available commands. Add `./node_modules/.bin` to your shell `PATH` to use `fe` directly:

```bash
# add to ~/.bashrc or ~/.zshrc
export PATH="./node_modules/.bin:$PATH"
```

All examples in this documentation use `fe` directly. Run all commands from this working directory unless noted otherwise.

## What You Have Now

A working directory that has the CLI and an empty registry. Nothing else connects the things you are about to build. MFEs you create are independent packages — each installs its own dependencies, each can live anywhere, each is deployable on its own. The only thing that will join them at runtime is `platform.json` and the import maps the runtime injects from it.

**Next:** [Your First MFE](./your-first-mfe)
