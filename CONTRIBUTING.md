# Contributing to FE Platform

Thank you for contributing to the FE platform! This guide will help you get started.

## Development Setup

1. **Install Bun**: https://bun.sh
2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fe
   ```
3. **Install dependencies**:
   ```bash
   bun install
   ```
4. **Verify setup**:
   ```bash
   bun run build
   bun run test
   ```

## Project Structure

```
fe-platform/
├── apps/          # Platform services (registry, build-server, catalog)
├── packages/      # Core packages organized by category
├── examples/      # Example MFEs
└── docs/          # Documentation
```

## Package Creation Checklist

When creating a new package:

- [ ] `package.json` with correct name (`@fe/package-name`)
- [ ] `tsconfig.json` extending root config
- [ ] `src/index.ts` exporting public API
- [ ] `src/types.ts` for shared types
- [ ] `src/*.test.ts` for each source file
- [ ] `README.md` with usage examples

## Naming Conventions

| Entity   | Convention           | Example             |
| -------- | -------------------- | ------------------- |
| Package  | `@fe/kebab-case`     | `@fe/cli-init`      |
| File     | `kebab-case.ts`      | `import-map.ts`     |
| Function | `camelCase`          | `generateImportMap` |
| Class    | `PascalCase`         | `ImportMapBuilder`  |
| Type     | `PascalCase`         | `ImportMapConfig`   |
| Constant | `SCREAMING_SNAKE`    | `DEFAULT_TIMEOUT`   |
| Plugin   | `camelCase + Plugin` | `initPlugin`        |

## Commit Message Format

```
type(scope): description

Examples:
feat(cli-init): add template selection prompt
fix(import-map): handle circular dependencies
refactor(resolver): extract path utils
test(state): add subscription edge cases
docs(guides): add routing tutorial
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Testing Requirements

- Unit tests with `bun:test`
- Tests live next to source files (`foo.ts` → `foo.test.ts`)
- Minimum coverage: 80% lines for core packages
- Integration tests in `apps/*/tests/`

## Before Submitting

```bash
bun run typecheck    # No errors
bun run lint         # No warnings
bun run test         # All pass
bun run build        # Builds successfully
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following guidelines above
3. Ensure all checks pass
4. Submit PR with clear description
5. Address review feedback
6. Squash commits before merge

## Code Review Guidelines

- **Small PRs**: One capability per PR
- **Clear purpose**: What and why
- **Tests included**: Prove it works
- **Documentation**: Update relevant docs

## Plugin-First Philosophy

If the feature can be a plugin, make it a plugin. This ensures:

- Independent development
- Clear boundaries
- Easy extension
- Testable in isolation

## Cardinal Rules

**STRICT**: Follow these rules at all times:

1. **File Length Limit**: All source files must be under 180 lines. Refactor immediately if exceeded.
2. **Functions Over Classes**: Use functions and composition. Only use classes when there is a special high-impact benefit.
3. **Use Bun Tooling**: Use `bun-tasks` for parallel scripts. Use Bun to bundle via `scripts/build.ts`. Use `tsc` only for `.d.ts` generation.

## Getting Help

- Check existing documentation in `docs/`
- Review examples in `examples/`
- Open an issue for questions
- Join discussions in PRs

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
