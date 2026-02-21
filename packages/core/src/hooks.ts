import type { BuildOptions, BuildResult, PackageVersion } from "./types";

export interface HookMap {
  // build plugin
  "build:before": [target: string, options: BuildOptions];
  "build:after": [target: string, result: BuildResult];
  "build:options": [options: BuildOptions];
  "build:shell:before": [];
  "build:shell:after": [];

  // serve plugin
  "serve:start": [port: number];
  "serve:request": [req: Request];

  // dev plugin
  "dev:start": [target: string, port: number];
  "dev:rebuild": [target: string];
  "dev:reload": [];

  // link plugin
  "link:before": [consumer: string, dep: string];
  "link:after": [consumer: string, depName: string];

  // admin plugin
  "admin:upload:before": [target: string, meta: { name: string; version: string }];
  "admin:upload:after": [target: string, url: string, deps: Record<string, string>];
  "admin:register:before": [specifier: string, version: string, entry: PackageVersion];
  "admin:register:after": [];
}

type HookName = keyof HookMap & string;
type HookHandler<K extends HookName> = (...args: HookMap[K]) => void | Promise<void>;

export class Hooks {
  private handlers = new Map<string, Array<{ fn: Function; priority: number }>>();

  hook<K extends HookName>(name: K, fn: HookHandler<K>, priority = 10): void {
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name)!.push({ fn, priority });
    this.handlers.get(name)!.sort((a, b) => a.priority - b.priority);
  }

  async callHook<K extends HookName>(name: K, ...args: HookMap[K]): Promise<void> {
    const list = this.handlers.get(name) ?? [];
    for (const { fn } of list) await fn(...args);
  }

  async waterfall<T>(name: string, initial: T): Promise<T> {
    const list = this.handlers.get(name) ?? [];
    let value = initial;
    for (const { fn } of list) value = (await fn(value)) ?? value;
    return value;
  }
}
