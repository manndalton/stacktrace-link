#!/usr/bin/env node
import * as path from 'path';
import { registerPlugin, listPlugins, unregisterPlugin, loadPluginFromFile } from './plugin';
import { printSuccess, printError, printInfo } from './output';

export function printUsage(): void {
  console.log(`
Usage: stacktrace-link plugin <command> [options]

Commands:
  list                  List all registered plugins
  load <file>           Load and register a plugin from a JS file
  remove <name>         Unregister a plugin by name
  help                  Show this help message
`.trim());
}

export function runList(): void {
  const plugins = listPlugins();
  if (plugins.length === 0) {
    printInfo('No plugins registered.');
    return;
  }
  plugins.forEach((p) => {
    const desc = p.description ? `  — ${p.description}` : '';
    console.log(`  ${p.name}@${p.version}${desc}`);
  });
}

export function runLoad(filePath: string): void {
  if (!filePath) {
    printError('Please provide a plugin file path.');
    process.exit(1);
  }
  try {
    const plugin = loadPluginFromFile(path.resolve(filePath));
    registerPlugin(plugin);
    printSuccess(`Plugin "${plugin.name}" loaded successfully.`);
  } catch (err: unknown) {
    printError(`Failed to load plugin: ${(err as Error).message}`);
    process.exit(1);
  }
}

export function runRemove(name: string): void {
  if (!name) {
    printError('Please provide a plugin name.');
    process.exit(1);
  }
  const removed = unregisterPlugin(name);
  if (removed) {
    printSuccess(`Plugin "${name}" removed.`);
  } else {
    printError(`Plugin "${name}" not found.`);
    process.exit(1);
  }
}

export function runPluginCli(args: string[]): void {
  const [command, ...rest] = args;
  switch (command) {
    case 'list':
      runList();
      break;
    case 'load':
      runLoad(rest[0]);
      break;
    case 'remove':
      runRemove(rest[0]);
      break;
    case 'help':
    default:
      printUsage();
  }
}

if (require.main === module) {
  runPluginCli(process.argv.slice(2));
}
