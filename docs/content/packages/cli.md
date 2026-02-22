---
sidebar_position: 4
---

# @fe/cli

The `fe` command-line interface. All commands run from the workspace root.

| Command | What it does |
|---|---|
| `fe build <target>` | Bundle an MFE or the shell |
| `fe serve` | Serve the built shell |
| `fe dev <target>` | Isolated sandbox with hot module replacement |
| `fe link <consumer> <dep>` | Wire a `fe()` devDependency between packages |
| `fe publish <target>` | Publish MFE source code for JIT compilation |
| `fe check <target>` | Typecheck + simulate build |

<!-- TODO: Document each command in detail — flags, examples, what happens under the hood. Cover the plugin system and adapter architecture. -->
