import { join } from "path";
import type { Plugin } from "@fe/core";

/**
 * Dynamically import each plugin listed in fe.config.json["plugins"].
 * Each plugin package must export a default `Plugin` object or a
 * `plugin` named export.
 */
export async function loadExternalPlugins(root: string, pluginNames: string[]): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  for (const name of pluginNames) {
    try {
      const mod = await import(name) as { default?: Plugin; plugin?: Plugin };
      const plugin = mod.default ?? mod.plugin;
      if (!plugin || typeof plugin.setup !== "function") {
        throw new Error(`Plugin "${name}" does not export a valid Plugin object.`);
      }
      plugins.push(plugin);
      await applyUpdatePolicy(root, name, plugin);
    } catch (err) {
      throw new Error(`Failed to load plugin "${name}" from node_modules: ${(err as Error).message}`);
    }
  }
  return plugins;
}

async function applyUpdatePolicy(root: string, packageName: string, plugin: Plugin): Promise<void> {
  if (!plugin.updatePolicy) return;

  const installed = await readInstalledVersion(root, packageName);
  if (!installed) return;

  const latest = await fetchLatestVersion(packageName);
  if (!latest) return;

  if (isOutdated(installed, latest)) {
    const msg = `Plugin "${plugin.name}" (${packageName}) is outdated: installed ${installed}, latest ${latest}.`;
    if (plugin.updatePolicy.onOutdated === "block") {
      throw new Error(`${msg} Update it before continuing.`);
    }
    console.warn(`[fe] warn: ${msg}`);
  }
}

async function readInstalledVersion(root: string, packageName: string): Promise<string | null> {
  try {
    const pkgPath = join(root, "node_modules", packageName, "package.json");
    const file = Bun.file(pkgPath);
    if (!(await file.exists())) return null;
    const pkg = (await file.json()) as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

async function fetchLatestVersion(packageName: string): Promise<string | null> {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

function isOutdated(installed: string, latest: string): boolean {
  const parse = (v: string) => v.replace(/^[^0-9]*/, "").split(".").map(Number);
  const [ia, ib, ic] = parse(installed);
  const [la, lb, lc] = parse(latest);
  if (ia !== la) return (ia ?? 0) < (la ?? 0);
  if (ib !== lb) return (ib ?? 0) < (lb ?? 0);
  return (ic ?? 0) < (lc ?? 0);
}
