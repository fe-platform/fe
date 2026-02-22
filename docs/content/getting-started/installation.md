---
sidebar_position: 1
---

# Installation

The fe platform has one runtime prerequisite: [Bun](https://bun.sh).

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

Create the configuration file the CLI writes to:

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
bunx fe
```

You should see the list of available commands. All examples in this documentation use `bunx fe`. Run all commands from this working directory unless noted otherwise.

## What You Have Now

A working directory that has the CLI and an empty configuration. Nothing else connects the things you are about to build. MFEs you create are independent packages — each installs its own dependencies, each can live anywhere, each is deployable on its own. The only thing that will join them at runtime is `platform.json` and the import maps the runtime injects from it.

**Next:** [Your First MFE](./your-first-mfe)
