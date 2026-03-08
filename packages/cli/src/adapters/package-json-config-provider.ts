import { join } from "path";
import type { FeConfig, ConfigProvider } from "@fe/core";

const DEFAULTS: Required<FeConfig> = {
  plugins: [],
  jitPlugins: [],
  manifestPath: "configs/platform.json",
  uploadsDir: "uploads",
  shellDir: "shell",
  sourcesDir: "sources",
};

/**
 * ConfigProvider that reads the `"fe"` key from the nearest package.json.
 * Falls back to defaults when the key is absent.
 *
 * This lets each MFE project declare its own CLI config inline:
 * ```json
 * { "name": "@conqueso/fe-my-mfe", "fe": { "jitPlugins": ["@fe/jit-plugin-react"] } }
 * ```
 */
export function createPackageJsonConfigProvider(root: string): ConfigProvider {
  const pkgPath = join(root, "package.json");
  return {
    get: async (): Promise<Required<FeConfig>> => {
      const file = Bun.file(pkgPath);
      if (!(await file.exists())) return { ...DEFAULTS };
      try {
        const raw = (await file.json()) as { fe?: FeConfig };
        return { ...DEFAULTS, ...(raw.fe ?? {}) };
      } catch {
        throw new Error(`Failed to parse package.json at ${pkgPath}`);
      }
    },
  };
}
