# Phase 1 Demo

This example demonstrates the Phase 1 core runtime deliverables:

## Features Demonstrated

1. **Import Maps** - Browser-native module resolution
2. **__fePreload Runtime** - Dynamic import handling with caching
3. **fe: Specifiers** - Custom specifier scheme for platform modules
4. **Module Loading** - Demonstrates loading an MFE via `fe:@demo/hello`

## Running the Demo

### Option 1: Local Server

```bash
# Using Python
python3 -m http.server 8000

# Using Bun
bun --hot examples/phase1-demo/index.html

# Using Node.js
npx serve examples/phase1-demo
```

Then open http://localhost:8000 in your browser.

### Option 2: Direct File

Some browsers allow opening the HTML file directly, but import maps require a server context.

## What's Happening

### Import Map

The import map defines how `fe:` specifiers resolve to URLs:

```json
{
  "imports": {
    "fe:@demo/hello": "./mfe-hello.js",
    "fe:state": "https://esm.sh/@ungap/global-this@0.4.4",
    "fe:routing": "https://esm.sh/@ungap/global-this@0.4.4"
  }
}
```

### __fePreload Runtime

The `__fePreload` function:

1. Checks module cache
2. Prevents duplicate loads
3. Uses native `import()` with specifiers
4. Tracks loading state and errors
5. Provides cache inspection

### Loading Flow

```
Click "Load Mock MFE"
    ↓
window.__fePreload("fe:@demo/hello")
    ↓
Check cache (miss)
    ↓
import("fe:@demo/hello")
    ↓
Browser resolves via import map → "./mfe-hello.js"
    ↓
Module loads and executes
    ↓
Cache result
    ↓
Return exports to caller
```

## Browser Requirements

- ES Modules support
- Import Maps support (Chrome 89+, Safari 16.4+, Firefox 108+)
- Dynamic import() support

For older browsers, use [es-module-shims](https://github.com/guybedford/es-module-shims).

## Phase 1 Exit Criteria

This demo verifies:

✓ Import maps work in browser
✓ fe: specifiers resolve to URLs
✓ __fePreload handles dynamic imports
✓ Module caching works
✓ Error handling works
✓ Can load an MFE via fe: specifier

## Next Steps (Phase 2+)

- CLI commands (fe init, fe dev)
- Build pipeline and bundling
- Registry and source publishing
- Full NATIVERS platform packages
