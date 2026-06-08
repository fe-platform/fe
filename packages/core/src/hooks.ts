import type { BuildOptions } from "./types";

export interface HookMap {
  "build:options": [options: BuildOptions];
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
