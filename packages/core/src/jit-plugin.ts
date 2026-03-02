import type { BuildOptions } from "./types";

export interface JitPlugin {
  transform(options: BuildOptions): BuildOptions;
}
