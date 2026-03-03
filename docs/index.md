# fe platform — documentation

> Primary docs: https://deepwiki.com/fe-platform/fe

This directory contains the canonical reference for the `fe` platform.

## Contents

| File | What it covers |
|---|---|
| `scenario.md` | Who microfrontends apply to, the landscape, where fe fits |
| `what-is-fe.md` | The problem fe solves, adoption investment, what you get |
| `platform-composition.md` | Configs and infra, the shell, MFE teams, common tooling |
| `fe-ownership.md` | Runtime, CLI, JIT bundler, CI/CD, plugin extension points |
| `future.md` | Registry, richer MFE contracts, glue packages, testing |
| `how-to.md` | Setting up a platform, creating MFEs, maintaining the ecosystem |
| `internals.md` | JIT compilation loop, import map lifecycle, plugin system, platform goals |

## Quick reference

```
fe new <scope/name>   scaffold a new MFE
fe dev <target>       live-reload dev server for one MFE
fe check <target>     typecheck + build simulation (CI)
fe publish <target>   upload source + register new version in manifest
fe build shell        compile the host shell
fe serve              run the JIT server
fe link <mfe> <dep>   wire a local fe() dependency
```

Package locations:
```
packages/core/       @fe/core        — shared types
packages/cli/        @fe/cli         — fe binary
packages/runtime/    @fe/runtime     — browser loader
packages/compiler/   @fe/compiler    — JIT bundler
packages/jit-plugin-react/  @fe/jit-plugin-react
packages/jit-plugin-solid/  @fe/jit-plugin-solid
toolkit/store/       fe(acme/store)  — global state primitive
toolkit/network/     fe(acme/network) — shared fetch layer
toolkit/devtools/    fe(acme/devtools) — dev overlay
```
