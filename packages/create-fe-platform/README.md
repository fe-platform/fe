# create-fe-platform

Scaffold generator for creating new FE platform Metal layer instances.

## Usage

```bash
npx create-fe-platform my-platform
cd my-platform
bun install
bun run dev
```

## What It Creates

The scaffold generator creates a minimal Metal configuration:

```
my-platform/
├── config/
│   ├── platform.json      # Platform configuration
│   └── environments.json  # Environment settings
├── mfes/                  # Directory for MFEs
├── package.json
└── README.md
```

## Configuration Files

### platform.json

Central platform configuration defining the platform name, version, and registered MFEs.

### environments.json

Environment-specific settings including registry URLs for development and production.

## Next Steps

After creating a scaffold:

1. Add your first MFE in `mfes/`
2. Run `fe init @yourorg/mfe-name` to create an MFE
3. Configure platform settings as needed
4. Start development with `bun run dev`
