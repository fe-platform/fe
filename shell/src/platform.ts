import { resolveVersion } from "./semver";
import { readOverrides, processUrlParams } from "./overrides";

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
  devtools?: string;
}

type RenderFn = (
  container: HTMLElement,
  props: Record<string, unknown>
) => () => void;

processUrlParams();

function readConfig(): PlatformConfig {
  const el = document.getElementById("__platform__");
  if (!el) throw new Error("Platform config not found in page");
  return JSON.parse(el.textContent!);
}

function parseSpecVersion(sv: string): { specifier: string; version: string } {
  const idx = sv.indexOf(")@");
  if (idx === -1) throw new Error(`Invalid specifier@version: ${sv}`);
  return { specifier: sv.slice(0, idx + 1), version: sv.slice(idx + 2) };
}

const config = readConfig();
const injectedSpecifiers = new Map<string, string>();

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
      /* ignore */
    }
  }
})();

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

function applyOverridesAndInject(allDeps: Map<string, string>): void {
  const overrides = readOverrides();
  for (const [spec, url] of Object.entries(overrides)) {
    if (allDeps.has(spec)) {
      console.info(`[platform] override active: ${spec} → ${url}`);
      allDeps.set(spec, url);
    }
  }
  const imports: Record<string, string> = {};
  for (const [spec, url] of allDeps) imports[spec] = url;
  injectImportMap(imports);
}

export async function load(
  path: string
): Promise<{ render: RenderFn; [key: string]: unknown }> {
  const routeEntry = config.routes[path];
  if (!routeEntry) throw new Error(`No route for path: ${path}`);

  const { specifier, version } = parseSpecVersion(routeEntry);
  const allDeps = resolveDeps(specifier, version);
  applyOverridesAndInject(allDeps);

  return import(specifier);
}

export async function loadDevtools(): Promise<void> {
  if (!config.devtools) return;

  const { specifier, version } = parseSpecVersion(config.devtools);
  const allDeps = resolveDeps(specifier, version);
  applyOverridesAndInject(allDeps);

  const container = document.createElement("div");
  container.id = "__devtools__";
  document.body.appendChild(container);

  const mod = await import(specifier) as { render: RenderFn };
  mod.render(container, {});
}
