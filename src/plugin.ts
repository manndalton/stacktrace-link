import * as fs from 'fs';
import * as path from 'path';

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  hooks: Partial<PluginHooks>;
}

export interface PluginHooks {
  beforeParse: (input: string) => string;
  afterParse: (frames: unknown[]) => unknown[];
  beforeOpen: (command: string) => string;
  afterOpen: (result: { success: boolean; command: string }) => void;
}

export interface PluginRegistry {
  [name: string]: Plugin;
}

const registry: PluginRegistry = {};

export function registerPlugin(plugin: Plugin): void {
  if (registry[plugin.name]) {
    throw new Error(`Plugin "${plugin.name}" is already registered.`);
  }
  registry[plugin.name] = plugin;
}

export function unregisterPlugin(name: string): boolean {
  if (!registry[name]) return false;
  delete registry[name];
  return true;
}

export function getPlugin(name: string): Plugin | undefined {
  return registry[name];
}

export function listPlugins(): Plugin[] {
  return Object.values(registry);
}

export function applyHook<K extends keyof PluginHooks>(
  hook: K,
  value: Parameters<PluginHooks[K]>[0]
): Parameters<PluginHooks[K]>[0] {
  let result = value as Parameters<PluginHooks[K]>[0];
  for (const plugin of listPlugins()) {
    const fn = plugin.hooks[hook] as ((v: typeof result) => typeof result) | undefined;
    if (fn) {
      result = fn(result);
    }
  }
  return result;
}

export function loadPluginFromFile(filePath: string): Plugin {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Plugin file not found: ${resolved}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(resolved);
  const plugin: Plugin = mod.default ?? mod;
  if (!plugin.name || !plugin.hooks) {
    throw new Error(`Invalid plugin at ${resolved}: must export { name, version, hooks }`);
  }
  return plugin;
}
