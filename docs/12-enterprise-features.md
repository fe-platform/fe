## Enterprise Features

### fe:perms — Permission Model

MFEs declare what platform capabilities they need.

```json
{
  "name": "@myorg/checkout",
  "permissions": {
    "state": {
      "read": ["cart", "user.profile"],
      "write": ["cart"]
    },
    "net": ["payments", "inventory"],
    "storage": ["local:cart-draft"],
    "fe": ["@org/header/components", "@org/product/hooks"]
  }
}
```

**Build-time validation:**

```bash
$ fe build

Validating permissions for @myorg/checkout...

✗ Error: Importing fe:net/billing but not declared in permissions.net
  
  Add to manifest.json:
    "permissions": {
      "net": ["payments", "inventory", "billing"]
    }
```

**Runtime enforcement:**

```ts
// Inside fe:state (pseudo-code)
const stateProxy = new Proxy(store, {
  get(target, slice) {
    const caller = getCurrentMfe()
    const perms = getPermissions(caller)
    
    if (!perms.state.read.includes(slice)) {
      throw new PermissionError(
        `${caller} cannot read state.${slice}. ` +
        `Add to manifest: "permissions.state.read": ["${slice}"]`
      )
    }
    return target[slice]
  }
})
```

**Default is permissive** — no `permissions` block means allow all. Enterprise mode can flip to deny-by-default.

### Governance Scores

Platform scores each MFE at build time:

- Bundle size budget
- Accessibility audit
- Type coverage
- Test coverage (plays/scenes exist?)
- Security scan
- Performance budget

**Visible, not blocking** by default. Teams see their score and what's missing.

```bash
$ fe build

Build successful.

Governance Score: 72/100
  ✓ Bundle size: 45kb (budget: 100kb)
  ✓ Type coverage: 94%
  ✗ Accessibility: 3 issues found
  ✗ Test coverage: No fe:plays defined
  ✓ Security: No vulnerabilities
```

Enterprise mode can enforce thresholds for production promotion.

### Auto-Observability

Platform auto-instruments without opt-in:

- Render timing for every MFE
- Error boundaries with automatic capture
- Network request tracing via `fe:net`
- User interactions via a11y labels

Teams get dashboards on day one. Zero config. Custom events optional.

---

## AI Integration

### fe:ai — Agent Context

MFEs publish structured context for AI agents.

```json
{
  "name": "@myorg/checkout",
  "ai": {
    "description": "Handles shopping cart display, modification, and payment processing",
    "capabilities": [
      "Display cart contents",
      "Add/remove items from cart",
      "Apply discount codes",
      "Process payments"
    ],
    "intents": [
      "show my cart",
      "checkout",
      "add {product} to cart",
      "apply code {code}"
    ],
    "inputs": {
      "addToCart": {
        "productId": "string",
        "quantity": "number (default: 1)"
      },
      "applyDiscount": {
        "code": "string"
      }
    },
    "outputs": {
      "cartUpdated": {
        "items": "CartItem[]",
        "total": "number"
      }
    }
  }
}
```

### fe:ai/catalog — Agent Discovery

Platform aggregates AI context into a queryable index.

```ts
import { findMfeForIntent, invokeMfe } from "fe:ai/catalog"

async function handleUserRequest(userMessage: string) {
  // "Add the blue sweater to my cart"
  
  const matches = await findMfeForIntent(userMessage)
  // → [{ mfe: "@myorg/checkout", action: "addToCart", confidence: 0.92 }]
  
  const params = await extractParams(userMessage, matches[0].inputs)
  // → { productId: "blue-sweater-123", quantity: 1 }
  
  const result = await invokeMfe("@myorg/checkout", "addToCart", params)
  // → { items: [...], total: 49.99 }
  
  return `Added to cart. Your total is $${result.total}`
}
```

The fe:catalog UI uses the same index for search.

---

