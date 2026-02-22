---
sidebar_position: 5
---

# Cross-Ecosystem Sharing

How to share MFEs across organizations and teams using remote URLs in the packages registry.

## How URL Resolution Works

`platform.json` stores a URL for every registered package version. The runtime's `resolveDeps` function resolves specifiers to those URLs without any knowledge of where the URL points. A local path, a relative URL, a CDN URL, or a staging server all work identically from the runtime's perspective.

```json
{
  "packages": {
    "fe(@acme/mfe-a)": {
      "versions": {
        "1.0.0": {
          "url": "https://cdn.acme.com/mfe-a/1.0.0/index.js",
          "deps": {}
        }
      }
    }
  }
}
```

When `resolveDeps` encounters `fe(@acme/mfe-a)@1.0.0`, it sets the resolved URL to `https://cdn.acme.com/mfe-a/1.0.0/index.js`. The runtime injects that URL directly into the import map. No proxying, no wrapper, no re-bundling.

## Consuming an External MFE

To consume an MFE published by another team or organisation, add their package entry to your `platform.json` manually:

```json
{
  "packages": {
    "fe(@partner/checkout)": {
      "versions": {
        "3.2.1": {
          "url": "https://mfe.partner.com/checkout/3.2.1/index.js",
          "deps": {
            "fe(@partner/ui-kit)": "^2.0.0"
          }
        }
      }
    },
    "fe(@partner/ui-kit)": {
      "versions": {
        "2.1.0": {
          "url": "https://mfe.partner.com/ui-kit/2.1.0/index.js",
          "deps": {}
        }
      }
    }
  }
}
```

Then add a route:

```json
{
  "routes": {
    "/checkout": "fe(@partner/checkout)@3.2.1"
  }
}
```

The transitive dependency `fe(@partner/ui-kit)` is resolved and injected automatically. Your shell never sees the partner's source code; it only sees the import map entries the runtime builds from the registry.

## CORS Requirements

The `Bun.serve`-based `fe serve` does not add CORS headers to cross-origin MFE requests — nor should it. Cross-origin MFE assets must be served with permissive CORS headers from their own origin:

```
Access-Control-Allow-Origin: *
```

Most CDN providers allow this to be configured per-bucket or per-distribution.

## Version Negotiation Across Teams

If your MFE and a partner MFE both depend on `fe(@shared/ui)`, semver resolution selects the highest version that satisfies all declared ranges. If the ranges are compatible (both declare `^2.0.0`), a single version is selected and a single import map entry is injected. If the ranges conflict (one declares `^1.x` and the other `^2.x`), see [Version Conflicts](../advanced/version-conflicts).

## Source and Types

Cross-ecosystem MFEs are consumed as compiled JavaScript. TypeScript types can be distributed separately as a published npm package or bundled as a `.d.ts` file alongside the build artifact. The `fe link` command works with git URIs for cross-repo type resolution during local development.
