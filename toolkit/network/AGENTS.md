# ⚯ toolkit/network/ · agent-ref
↑ /AGENTS.md for repo-wide context

## identity
```
name:      fe(acme/network)
version:   1.0.0
module:    src/index.ts
fe()-deps: ∅  (no external fe() imports)
dependencies: ∅  (zero runtime deps; wraps platform fetch)
```

## purpose
Shared, framework-agnostic network layer for cross-MFE request deduplication, caching,
and interceptor hooks. All MFEs that import `fe(acme/network)` share one module instance
via the import map, giving them a common cache and interceptor chain.

## API (src/index.ts)
```ts
network.fetch(input, init?): Promise<Response>
  Same signature as global fetch. GET/HEAD responses are cached (30 s default) and
  deduplicated; concurrent requests for the same URL share one in-flight Promise.

network.addRequestInterceptor(fn): () => void   // returns remove fn
network.addResponseInterceptor(fn): () => void  // returns remove fn

invalidateCache(urlPrefix: string): void
  Deletes all cached entries whose key contains urlPrefix.
```

## interceptor shapes
```ts
type RequestInterceptor  = (request: Request) => Request | Promise<Request>
type ResponseInterceptor = (response: Response, request: Request) => Response | Promise<Response>
```
Request interceptors run in insertion order before fetch.
Response interceptors run in insertion order after fetch, before caching.

## caching behaviour
- Only GET and HEAD requests are cached (TTL = 30 s, module-level constant).
- Cache is keyed on `"METHOD:url"`.
- Concurrent in-flight requests for the same key share one Promise; each caller gets a clone.
- Non-2xx responses are NOT cached; they pass through interceptors and return to the caller.

## usage
```ts
import { network, invalidateCache } from "fe(acme/network)";

// Add an auth header to every request
const remove = network.addRequestInterceptor(async (req) => {
  const token = getAuthToken();
  return new Request(req, { headers: { ...Object.fromEntries(req.headers), Authorization: `Bearer ${token}` } });
});

// Later: remove the interceptor
remove();

const res = await network.fetch("/api/user");
invalidateCache("/api/user");
```

## deploy flow
```
fe build toolkit/network  → dist/index.js
fe admin upload toolkit/network
  copies dist/ → uploads/network/1.0.0/
  registers in platform.json packages section

# Link into an MFE:
fe link <mfe-dir> toolkit/network
```

## invariants
- zero runtime dependencies; wraps platform `fetch`
- module-level singletons (inFlight map, cache map, interceptor arrays)
- GET/HEAD only for deduplication and caching
- cache TTL hardcoded at 30 s; override by calling invalidateCache before re-fetching
