import type { ArtifactStorage, ManifestManager, Builder } from "./adapters";

export interface CommandDef {
  name: string;
  description: string;
  usage: string;
  run(args: string[]): Promise<void>;
}

export interface CliContext {
  /** Repo root (absolute path) */
  root: string;
  /** Registered adapters -- plugins can swap these */
  adapters: {
    artifactStorage: ArtifactStorage;
    manifest: ManifestManager;
    builder: Builder;
  };
  /** Command registry -- plugins add commands here */
  commands: Map<string, CommandDef>;
}
