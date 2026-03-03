# How to use fe

## Setting up your platform

1. Install the CLI in your monorepo root:

```bash
bun add -d @fe/cli
```

2. Create `configs/fe.config.json` at the workspace root:

```json
{
  "shellDir": "host-app",
  "manifestPath": "configs/platform.json",
  "jitPlugins": ["@fe/jit-plugin-react"]
}
```

3. Create `configs/platform.json` with your initial routes and an empty packages object:

```json
{
  "routes": {},
  "packages": {}
}
```

4. Create the shell application. At minimum it needs an `index.html` and an
   `src/index.ts` that calls `@fe/runtime`:

```ts
import { load, loadDevtools } from "@fe/runtime";
await loadDevtools();
await load(location.pathname);
```

5. Build and serve:

```bash
fe build shell
fe serve
```

## How your org creates MFEs

1. Scaffold a new MFE from the workspace root:

```bash
fe new acme/my-mfe
```

This creates `my-mfe/` with a `package.json`, `tsconfig.json`, and a
`src/index.ts` render stub.

2. Declare fe() dependencies using `fe link`:

```bash
fe link my-mfe toolkit/store
```

3. Develop with live reload:

```bash
fe dev my-mfe
```

4. Publish when ready:

```bash
fe publish my-mfe
```

Update `platform.json` routes to point to the new version. Rebuild the shell
(`fe build shell`) and redeploy `fe serve`.

## How you maintain your ecosystem and platform

**Updating a MFE version**: run `fe publish <mfe>`, then update the relevant
route in `platform.json` from `specifier@old` to `specifier@new`. Old versions
remain available at their artifact URLs; nothing breaks during the transition.

**Rolling back**: update the route back to the previous version. No redeploy of
`fe serve` is required; the JIT server compiles from stored source files.

**Dev overrides**: use the devtools panel (if installed) to redirect any specifier
to a local `fe dev` URL. Overrides live in sessionStorage and affect only the
current tab. Use the share button to give the override URL to a colleague.

**Plugin management**: add CLI plugins to `configs/fe.config.json` under
`"plugins"`. Plugins that declare `updatePolicy.onOutdated = "block"` will abort
CLI commands until the plugin is updated; `"warn"` allows commands to proceed
with a warning. Check the plugin's own changelog to understand when updates are
required.
