# cli

Build, serve, dev, link, and admin tooling for the fe platform. All commands run from the repo root:

```bash
bun cli/src/index.ts <command>
```

| Command | Description |
|---|---|
| `build <target>` | Bundle an MFE or the shell into `dist/` |
| `serve [port]` | Serve `shell/dist/` with `/uploads/` mounted |
| `dev <target> [port]` | Isolated sandbox with SSE hot module replacement |
| `link <consumer> <dep>` | Add a `fe()` devDependency and run `bun install` |
| `admin upload <target>` | Copy `dist/` to `uploads/` and register in `platform.json` |

Plugin-based architecture — each command is a `Plugin` with `setup(ctx, hooks)`. Storage, manifest management, and building are swappable adapters. Cross-plugin communication goes through a typed hook system (declaration merging extends `HookMap`).

Part of the [fe microfrontend platform](../README.md).
