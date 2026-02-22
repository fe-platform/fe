import { join } from "path";
import type { FeConfig, ConfigProvider } from "@fe/core";

const DEFAULTS: Required<FeConfig> = {
  plugins: [],
  manifestPath: "configs/platform.json",
  uploadsDir: "uploads",
  shellDir: "shell",
  sourcesDir: "sources",
};

export function createJsonConfigProvider(root: string): ConfigProvider {
  const configPath = join(root, "configs", "fe.config.json");
  return {
    async get() {
      const file = Bun.file(configPath);
      if (!(await file.exists())) return DEFAULTS;
      try {
        const raw = (await file.json()) as FeConfig;
        return { ...DEFAULTS, ...raw };
      } catch {
        throw new Error(`Failed to parse fe.config.json at ${configPath}`);
      }
    },
  };
}
