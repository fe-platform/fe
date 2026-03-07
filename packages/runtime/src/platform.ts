import type { PlatformConfig } from "@fe/core";
import { parseSpecVersion } from "@fe/specifier";
import { resolveVersion } from "./semver";
import { readOverrides, processUrlParams } from "./overrides";

export type RenderFn = (container: HTMLElement, props: Record<string, unknown>) => () => void;

processUrlParams();

function readConfig(): PlatformConfig {
  const el = document.getElementById("__platform__");
  if (!el) throw new Error("Platform config not found in page");
  return JSON.parse(el.textContent!);
}

const config = readConfig();
const injectedSpecifiers = new Map<string, string>();

(function initInjected() {
  const scripts = Array.from(document.querySelectorAll('script[type="importmap"]'));
  for (const script of scripts) {
    try {
      const map = JSON.parse(script.textContent || "{}");
      for (const [spec, url] of Object.entries((map.imports ?? {}) as Record<string, string>)) {
        injectedSpecifiers.set(spec, url);
      }
    } catch { /* ignore */ }
  }
})();

if (config.preload?.length) {
  for (const sv of config.preload) {
    preload(sv).catch(() => { /* preload errors are non-fatal */ });
  }
}

function resolveDeps(
  specifier: string,
  version: string,
  resolved: Map<string, string> = new Map(),
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
    if (!depVersion) throw new Error(`No version of ${depSpec} satisfies ${depRange}`);
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
        console.warn(`[fe/runtime] specifier "${spec}" already mapped to ${existing}, skipping ${url}`);
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
      console.info(`[fe/runtime] override active: ${spec} → ${url}`);
      allDeps.set(spec, url);
    }
  }
  const imports: Record<string, string> = {};
  for (const [spec, url] of allDeps) imports[spec] = url;
  injectImportMap(imports);
}

/**
 * Resolves the dep graph and injects the import map for `specifierVersion`
 * without loading the module. Queues a `<link rel="modulepreload">` so the
 * browser fetches the module entry in the background.
 *
 * Calling `load()` after `preload()` for the same specifier skips the map
 * injection step (already done) and relies on the browser module cache.
 */
export async function preload(specifierVersion: string): Promise<void> {
  const { specifier, version } = parseSpecVersion(specifierVersion);
  const allDeps = resolveDeps(specifier, version);
  applyOverridesAndInject(allDeps);
  const url = allDeps.get(specifier);
  if (url) {
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = url;
    document.head.appendChild(link);
  }
}

export async function load(path: string): Promise<{ render: RenderFn;[key: string]: unknown }> {
  const routeEntry = config.routes[path];
  if (!routeEntry) throw new Error(`No route for path: ${path}`);

  const { specifier, version } = parseSpecVersion(routeEntry);
  const allDeps = resolveDeps(specifier, version);
  applyOverridesAndInject(allDeps);

  const mod = await import(specifier) as Record<string, unknown>;
  if (typeof mod.render !== "function") {
    throw new Error(`${specifier}@${version} does not export render`);
  }
  return mod as { render: RenderFn; [key: string]: unknown };
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
