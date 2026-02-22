import type { ArtifactStorage, ManifestManager, Builder, ConfigProvider } from "./adapters";

export interface CommandDef {
  name: string;
  description: string;
  usage: string;
  run(args: string[]): Promise<void>;
}

export interface CliContext {
  root: string;
  adapters: {
    config: ConfigProvider;
    artifactStorage: ArtifactStorage;
    manifest: ManifestManager;
    builder: Builder;
  };
  commands: Map<string, CommandDef>;
}
