export type RequestInterceptor = (request: Request) => Request | Promise<Request>;
export type ResponseInterceptor = (response: Response, request: Request) => Response | Promise<Response>;

export interface NetworkConfig {
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}

export interface NetworkClient {
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  addRequestInterceptor(fn: RequestInterceptor): () => void;
  addResponseInterceptor(fn: ResponseInterceptor): () => void;
}

const inFlight = new Map<string, Promise<Response>>();
const cache = new Map<string, { response: Response; expiresAt: number }>();
const DEFAULT_TTL_MS = 30_000;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

function cacheKey(req: Request): string {
  return `${req.method}:${req.url}`;
}

function isCacheable(req: Request): boolean {
  return req.method === "GET" || req.method === "HEAD";
}

async function applyRequestInterceptors(req: Request): Promise<Request> {
  let r = req;
  for (const fn of requestInterceptors) r = await fn(r);
  return r;
}

async function applyResponseInterceptors(res: Response, req: Request): Promise<Response> {
  let r = res;
  for (const fn of responseInterceptors) r = await fn(r, req);
  return r;
}

async function execute(req: Request): Promise<Response> {
  const prepared = await applyRequestInterceptors(req);

  if (isCacheable(prepared)) {
    const key = cacheKey(prepared);
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.response.clone();

    if (inFlight.has(key)) return (await inFlight.get(key)!).clone();

    const promise = fetch(prepared).then(async (res) => {
      const processed = await applyResponseInterceptors(res, prepared);
      if (processed.ok) {
        cache.set(key, { response: processed.clone(), expiresAt: Date.now() + DEFAULT_TTL_MS });
      }
      inFlight.delete(key);
      return processed;
    }).catch((err: unknown) => {
      inFlight.delete(key);
      throw err;
    });

    inFlight.set(key, promise);
    return (await promise).clone();
  }

  const res = await fetch(prepared);
  return applyResponseInterceptors(res, prepared);
}

/**
 * The singleton network client. All MFEs that import `@fe/fe-network` share
 * this instance via the import map, giving them a common cache and interceptor
 * chain without any explicit coordination.
 */
export const network: NetworkClient = {
  fetch(input, init) {
    return execute(new Request(input, init));
  },
  addRequestInterceptor(fn) {
    requestInterceptors.push(fn);
    return () => {
      const i = requestInterceptors.indexOf(fn);
      if (i !== -1) requestInterceptors.splice(i, 1);
    };
  },
  addResponseInterceptor(fn) {
    responseInterceptors.push(fn);
    return () => {
      const i = responseInterceptors.indexOf(fn);
      if (i !== -1) responseInterceptors.splice(i, 1);
    };
  },
};

/**
 * Invalidates all cached responses matching the given URL prefix.
 * Pass the full URL to clear one entry; pass a prefix to clear many.
 */
export function invalidateCache(urlPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.includes(urlPrefix)) cache.delete(key);
  }
}
