## Developer Experience

### fe:init — Project Scaffolding

```bash
$ fe init

? MFE name: @myorg/checkout
? Description: Shopping cart and checkout flow
? Template: (use arrow keys)
  > minimal      # Just a component export
    with-routing # Adds route config
    with-state   # Adds state slice
    full         # Everything

Creating @myorg/checkout...

✓ src/index.tsx        # Entry component
✓ manifest.json        # MFE metadata
✓ tsconfig.json        # Extends platform base

Done. Run `fe dev` to start.
```

Minimal scaffold (three files):

```
checkout/
├── src/
│   └── index.tsx       # export default function Checkout() { ... }
├── manifest.json       # { "name": "@myorg/checkout", "exports": { ".": "./src/index.tsx" } }
└── tsconfig.json       # { "extends": "fe:tsconfig/base" }
```

That's a deployable MFE.

### fe:dev — Local Development Server

Three modes: isolation, context, or multi-local.

**Mode 1: Isolation** — Your MFE is the root, scenes mock everything else.

```bash
$ fe dev

Starting dev server for @myorg/checkout...

✓ Loaded platform packages (fe:state, fe:net, fe:visuals, ...)
✓ Resolved dependencies:
    fe:@platform/shell    → scenes (mocked)
    fe:@org/header        → scenes (mocked)
    fe:net/workflows      → scenes (mocked)
✓ Your MFE              → localhost (live)

  Local:   http://localhost:3000
  Press 's' to switch scene (logged-in, logged-out, admin)
```

**Mode 2: Context** — Your MFE rendered inside a real shell you don't own.

```bash
$ fe dev --in=@platform/shell

# Shell from CDN (real), your MFE local, mounted where shell expects it
# See how your MFE actually fits in the layout
```

```bash
$ fe dev --in=@org/dashboard

# Dashboard from CDN, your MFE rendered in dashboard's slot
```

**Mode 3: Multi-local** — Clone other MFEs, modify them, run alongside yours.

```bash
$ fe clone @org/header
# Pulls source into ./clones/@org/header

$ fe dev --local=@org/header
# Your MFE + locally modified header, both hot-reloading
```

**Combined:**

```bash
$ fe dev --in=@platform/shell --local=@org/header --local=@org/sidebar

# Shell from CDN (context)
# Header and sidebar from local clones (modified)
# Your MFE local (developing)
# All hot-reloading
```

How it works internally:

```ts
async function startDevServer(mfeName: string, options: DevOptions) {
  const importMap = {
    // Your code - local with HMR
    [`fe:${mfeName}`]: "http://localhost:3000/src/index.tsx",
    
    // Platform packages - real implementations
    "fe:state": "https://platform-cdn.com/state/latest/index.js",
    "fe:visuals": "https://platform-cdn.com/visuals/latest/index.js",
  }

  // --in flag: use real MFE from CDN as shell
  if (options.in) {
    importMap[`fe:${options.in}`] = await resolveCdn(options.in)
  }

  // --local flags: use local clones
  for (const local of options.local) {
    importMap[`fe:${local}`] = `http://localhost:3000/clones/${local}/src/index.tsx`
  }

  // Everything else: fall back to scenes
  for (const dep of remainingDeps) {
    importMap[`fe:${dep}`] = await resolveScene(dep)
  }

  serve({ importMap, hmr: true })
}
```

### fe:clone — Pull Source for Local Development

Since source is the published artifact, any MFE can be cloned and modified locally.

```bash
$ fe clone @org/header

Fetching source for @org/header@latest...
✓ Cloned to ./clones/@org/header

$ ls ./clones/@org/header
  src/
  manifest.json
  tsconfig.json

# Edit it
$ code ./clones/@org/header/src/index.tsx

# Run with your MFE
$ fe dev --local=@org/header
```

Pin a specific version:

```bash
$ fe clone @org/header@2.1.0
```

### fe:preview — Ephemeral PR Environments

Every PR gets a preview URL with that MFE version overridden.

```bash
$ fe preview --pr=1234 --mfe=@myorg/checkout

Building @myorg/checkout from PR #1234...
✓ Built: checkout@pr-1234-abc123

Deploying preview environment...
✓ Import map override:
    fe:@myorg/checkout → https://cdn.../preview/pr-1234-abc123/index.js
    (all other MFEs remain at production versions)

✓ Preview URL: https://preview-1234.yourplatform.com
```

How it works:

```ts
async function createPreview(pr: number, mfeName: string) {
  // Build the PR branch
  const artifact = await build({
    source: await fetchPrBranch(pr, mfeName),
    version: `pr-${pr}-${shortSha()}`
  })
  
  // Upload to CDN under preview namespace
  const previewUrl = await uploadToCdn(artifact, `preview/pr-${pr}`)
  
  // Create scoped import map (inherits prod, overrides one entry)
  const importMapOverride = {
    [`fe:${mfeName}`]: previewUrl
  }
  
  // Header-based routing (no new infrastructure)
  // Request with X-FE-Preview: pr-1234 gets overridden import map
  const previewEnv = await createPreviewEnv({
    baseImportMap: await fetchProdImportMap(),
    overrides: importMapOverride,
    subdomain: `preview-${pr}`
  })
  
  await commentOnPr(pr, `Preview: ${previewEnv.url}`)
  return previewEnv.url
}
```

### fe:catalog — Discovery Portal

Auto-generated registry of all MFEs, their scenes, plays, types, and ownership.

- Browse all published MFEs
- See rendered scenes (Storybook-style)
- View exported types and APIs
- Search by capability ("date picker", "payment form")
- Ownership and contact info

No stale wikis. The catalog is the source of truth.

### Instant Rollback

Platform owns builds and import maps. Rollback is atomic.

```bash
$ fe rollback @myorg/checkout

Current: v2.3.1
? Rollback to: (use arrow keys)
  > v2.3.0 (2 hours ago)
    v2.2.0 (yesterday)
    v2.1.0 (3 days ago)

Rolling back...
✓ Import map updated: fe:@myorg/checkout → v2.3.0
✓ Rollback complete (took 1.2s)
```

Auto-rollback on error spike is configurable per MFE.

---

