import { join } from "path";
import { existsSync, readFileSync } from "fs";
import type { FeConfig } from "@fe/core";

const DEFAULTS: Required<FeConfig> = {
  plugins: [],
  manifestPath: "configs/platform.json",
  uploadsDir: "uploads",
  shellDir: "shell",
};

export function readFeConfig(root: string): Required<FeConfig> {
  const configPath = join(root, "fe.config.json");
  if (!existsSync(configPath)) return DEFAULTS;
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf8")) as FeConfig;
    return { ...DEFAULTS, ...raw };
  } catch {
    throw new Error(`Failed to parse fe.config.json at ${configPath}`);
  }
}
