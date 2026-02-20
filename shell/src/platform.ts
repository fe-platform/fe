// Platform runtime: reads the embedded config, resolves fe() dependency graphs,
// injects multiple import maps, and dynamically loads route MFEs.

// --- Types (mirrors cli/src/config.ts for browser use) ---

interface PackageVersion {
  url: string;
  deps: Record<string, string>;
}

interface PackageEntry {
  versions: Record<string, PackageVersion>;
}

interface PlatformConfig {
  routes: Record<string, string>;
  packages: Record<string, PackageEntry>;
}

type RenderFn = (
  container: HTMLElement,
  props: Record<string, unknown>
) => () => void;

// --- Semver (minimal, browser-safe) ---

function parseSemver(v: string): [number, number, number] {
  const parts = v.split(".").map(Number);
  return [parts[0], parts[1], parts[2]];
}

function satisfies(version: string, range: string): boolean {
  if (!range.startsWith("^")) return version === range;
  const [vMaj, vMin, vPatch] = parseSemver(version);
  const [rMaj, rMin, rPatch] = parseSemver(range.slice(1));
  if (rMaj > 0) {
    if (vMaj !== rMaj) return false;
    if (vMin < rMin) return false;
    if (vMin === rMin && vPatch < rPatch) return false;
    return true;
  }
  if (rMin > 0) {
    if (vMaj !== 0 || vMin !== rMin) return false;
    return vPatch >= rPatch;
  }
  return vMaj === 0 && vMin === 0 && vPatch === rPatch;
}

function resolveVersion(versions: string[], range: string): string | null {
  const matching = versions.filter((v) => satisfies(v, range));
  if (matching.length === 0) return null;
  matching.sort((a, b) => {
    const [aMaj, aMin, aPatch] = parseSemver(a);
    const [bMaj, bMin, bPatch] = parseSemver(b);
    return bMaj - aMaj || bMin - aMin || bPatch - aPatch;
  });
  return matching[0];
}

// --- Config ---

function readConfig(): PlatformConfig {
  const el = document.getElementById("__platform__");
  if (!el) throw new Error("Platform config not found in page");
  return JSON.parse(el.textContent!);
}

// Parse "fe(@acme/mfe-b)@1.0.0" → { specifier, version }
function parseSpecVersion(sv: string): { specifier: string; version: string } {
  const idx = sv.indexOf(")@");
  if (idx === -1) throw new Error(`Invalid specifier@version: ${sv}`);
  return { specifier: sv.slice(0, idx + 1), version: sv.slice(idx + 2) };
}

// --- Dependency resolution ---

const config = readConfig();
const injectedSpecifiers = new Map<string, string>(); // specifier → url

// Seed with specifiers already present in import maps on the page.
(function initInjected() {
  const scripts = Array.from(document.querySelectorAll('script[type="importmap"]'));
  for (const script of scripts) {
    try {
      const map = JSON.parse(script.textContent || "{}");
      for (const [spec, url] of Object.entries(
        (map.imports ?? {}) as Record<string, string>
      )) {
        injectedSpecifiers.set(spec, url);
      }
    } catch {
      /* ignore malformed maps */
    }
  }
})();

// Walk the transitive dep graph for a specifier@version.
// Returns a flat map of specifier → url.
function resolveDeps(
  specifier: string,
  version: string,
  resolved: Map<string, string> = new Map()
): Map<string, string> {
  if (resolved.has(specifier)) return resolved;

  const pkg = config.packages[specifier];
  if (!pkg) throw new Error(`Unknown package: ${specifier}`);
  const ver = pkg.versions[version];
  if (!ver) throw new Error(`Unknown version ${version} for ${specifier}`);

  resolved.set(specifier, ver.url);

  for (const [depSpec, depRange] of Object.entries(ver.deps)) {
    if (resolved.has(depSpec)) continue;
    const depPkg = config.packages[depSpec];
    if (!depPkg) throw new Error(`Unknown dep: ${depSpec}`);
    const depVersion = resolveVersion(Object.keys(depPkg.versions), depRange);
    if (!depVersion)
      throw new Error(`No version of ${depSpec} satisfies ${depRange}`);
    resolveDeps(depSpec, depVersion, resolved);
  }

  return resolved;
}

// --- Import map injection ---

function injectImportMap(imports: Record<string, string>): void {
  const newImports: Record<string, string> = {};
  for (const [spec, url] of Object.entries(imports)) {
    if (injectedSpecifiers.has(spec)) {
      const existing = injectedSpecifiers.get(spec)!;
      if (existing !== url) {
        console.warn(
          `[platform] specifier "${spec}" already mapped to ${existing}, skipping ${url}`
        );
      }
      continue;
    }
    newImports[spec] = url;
    injectedSpecifiers.set(spec, url);
  }

  if (Object.keys(newImports).length === 0) return;

  const script = document.createElement("script");
  script.type = "importmap";
  script.textContent = JSON.stringify({ imports: newImports });
  document.head.appendChild(script);
}

// --- Public API ---

export async function load(
  path: string
): Promise<{ render: RenderFn; [key: string]: unknown }> {
  const routeEntry = config.routes[path];
  if (!routeEntry) throw new Error(`No route for path: ${path}`);

  const { specifier, version } = parseSpecVersion(routeEntry);

  // Resolve the full transitive dep graph.
  const allDeps = resolveDeps(specifier, version);

  // Inject import maps for deps (the top-level MFE is already in the default map).
  const depImports: Record<string, string> = {};
  for (const [spec, url] of allDeps) {
    if (spec !== specifier) {
      depImports[spec] = url;
    }
  }
  injectImportMap(depImports);

  // Dynamic import — browser resolves via initial map + injected dep maps.
  return import(specifier);
}
