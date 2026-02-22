---
sidebar_position: 3
---

# CI Integration

Setting up continuous integration for fe projects: typechecking, building, and deploying MFEs.

## Pipeline Structure

The reference CI workflow uses two jobs with a dependency between them:

```
packages ──→ sandbox
```

**`packages` job** typechecks `@fe/core`, `@fe/cli`, and `@fe/runtime`. These are the core platform adapters and libraries; they must compile cleanly before anything else runs.

**`sandbox` job** (requires `packages` to succeed) typechecks and builds the example MFEs and the shell application. It depends on the packages job because these components import from `@fe/cli` and `@fe/runtime`.

*Note: The `sandbox/` directory in this project serves as the local testbed for these architectural patterns.*

## Reference Workflow

```yaml
jobs:
  packages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Cache Bun
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: bun-
      - run: bun install
      - run: |
          bunx tsc --noEmit --project packages/core/tsconfig.json
          bunx tsc --noEmit --project packages/cli/tsconfig.json
          bunx tsc --noEmit --project packages/runtime/tsconfig.json

  sandbox:
    runs-on: ubuntu-latest
    needs: packages
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - name: Cache Bun
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: bun-
      - run: bun install
      - run: |
          bunx tsc --noEmit --project <mfe-directory>/tsconfig.json
          bunx tsc --noEmit --project <mfe-directory>/tsconfig.json
          bunx tsc --noEmit --project <shell-directory>/tsconfig.json
          bunx tsc --noEmit --project toolkit/devtools/tsconfig.json
      - run: |
          (cd <mfe-directory> && bun run check)
          (cd <mfe-directory> && bun run check)
          (cd toolkit/devtools && bun run check)
          (cd <shell-directory> && bun run check)
```

When you add a new MFE to your project, add its typecheck and build simulator steps to the CI:

```yaml
- run: |
    bunx tsc --noEmit --project path/to/mfe-a/tsconfig.json
    bunx tsc --noEmit --project path/to/mfe-new/tsconfig.json   # add here
    ...
- run: |
    (cd path/to/mfe-a && bun run check)
    (cd path/to/mfe-new && bun run check)                       # add here
```

`bun run check` maps to `fe check <dir>` via the package's `package.json` scripts. `fe check` runs both `tsc --noEmit` and a Bun build simulation, so the CI typecheck step is technically redundant with `fe check`'s typecheck. Keeping both is useful for cleaner error output when the failure is a type error rather than a build error.

## `fe check` vs `bun run check`

`fe check <target>` performs:

1. `bunx tsc --noEmit --project <target>/tsconfig.json`
2. `Bun.build(...)` simulation with the same options the real build uses

It exits 0 on success and 1 on any failure, making it composable in shell pipelines and CI steps. The `bun run check` script in each sandbox package calls this command.

## Bun Caching

The `~/.bun/install/cache` directory stores downloaded packages. Caching it with `actions/cache` keyed on `bun.lock` significantly reduces install time on subsequent runs. The `restore-keys: bun-` fallback restores the nearest available cache even if the lockfile changed.

## Deployment

Publishing MFEs and activating routes in `platform.json` are separate steps that the CI pipeline can drive. A deployment workflow might:

1. Run `fe publish <path-to-mfe>` (uploads source, registers in `platform.json` via the `manifest` adapter).
2. Commit and push the updated `platform.json` to your platform configuration.
3. Run `fe build shell` and deploy the output of the configured `shellDir` to a hosting service.

Route activation (updating the `routes` section of `platform.json`) can be a separate, gated step in the deployment pipeline, distinct from publishing the package.
