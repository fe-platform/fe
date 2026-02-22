---
sidebar_position: 2
---

# Publishing

How `fe publish` uploads MFE source code for JIT compilation, registers entries in `platform.json`, and how route activation works as a separate step.

## Running `fe publish`

```bash
fe publish sandbox/mfe-a
```

Provide the path to the MFE's directory, relative to the workspace root.

## What Happens

`fe publish` runs five steps in order:

**1. Pre-flight check.** Runs `fe check` on the target: type-checks with `tsc --noEmit` and performs a Bun build simulation. If either fails, publish stops. You never upload code that does not compile.

**2. Read identity.** Reads `name` and `version` from the target's `package.json`. Derives the slug (the filesystem-safe identifier) from the specifier by stripping the `fe(` prefix and scope:

```
fe(@acme/mfe-a) → mfe-a
```

**3. Upload source.** Copies the entire `src/` directory to `SourceStorage` at `sources/<slug>/<version>/`. The default storage writes to the local filesystem. A plugin can swap this to S3 or any other backend.

**4. Resolve deps.** Reads `fe()` keys from `devDependencies`, then looks up each dep's `version` field in its local `package.json`. Records the resolved versions as semver ranges (`^X.Y.Z`) in the `deps` object.

**5. Register.** Calls `manifest.registerPackage(name, version, { url, deps })`. The URL is `/bundle/<slug>/<version>/index.ts`. This writes the entry to `platform.json`'s `packages` section.

## What `fe publish` Does Not Do

`fe publish` never touches the `routes` section of `platform.json`. Publishing and activation are distinct operations.

This separation exists for good reason: in a team environment, publishing a new version and making it live in production require different access rights. A developer can publish; a release process activates. In a single-developer local setup the distinction feels like extra work, but the model scales without modification.

## Activating a Route

After publishing, add or update a route in `platform.json` manually:

```json
{
  "routes": {
    "/": "fe(@acme/mfe-a)@1.0.0"
  }
}
```

Then rebuild the shell to embed the updated config:

```bash
fe build shell
fe serve
```

## Re-Publishing

`fe publish` writes `platform.json` with the new entry. If you increment the version in `package.json` and publish again, both versions coexist in the registry. The shell serves whichever version `routes` points to.

Publishing the same version a second time will overwrite the existing `sources/<slug>/<version>/` directory and the registry entry. Treat version strings as immutable once they are referenced by a live route.
