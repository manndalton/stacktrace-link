#!/usr/bin/env node
/**
 * CLI entry point for filter management.
 * Allows users to test and preview filter rules.
 */

import { applyFilters, buildFilterConfig } from './filter.js';

function printUsage(): void {
  console.log('Usage: stacktrace-filter <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  test <path>          Test if a path would be included');
  console.log('  preview              Preview default filter rules');
  console.log('');
  console.log('Options:');
  console.log('  --include <pattern>  Add include pattern (repeatable)');
  console.log('  --exclude <pattern>  Add exclude pattern (repeatable)');
}

function parseArgs(args: string[]): {
  command: string;
  path?: string;
  include: string[];
  exclude: string[];
} {
  const include: string[] = [];
  const exclude: string[] = [];
  let command = '';
  let path: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--include' && args[i + 1]) {
      include.push(args[++i]);
    } else if (args[i] === '--exclude' && args[i + 1]) {
      exclude.push(args[++i]);
    } else if (!command) {
      command = args[i];
    } else if (!path) {
      path = args[i];
    }
  }

  return { command, path, include, exclude };
}

export function runFilterCli(argv: string[]): void {
  const { command, path, include, exclude } = parseArgs(argv);

  if (!command || command === 'help') {
    printUsage();
    return;
  }

  if (command === 'test') {
    if (!path) {
      console.error('Error: path argument required for test command');
      process.exit(1);
    }
    const config = include.length || exclude.length
      ? buildFilterConfig(include, exclude)
      : undefined;
    const result = applyFilters(path, config);
    console.log(`${path}: ${result ? 'INCLUDED' : 'EXCLUDED'}`);
    return;
  }

  if (command === 'preview') {
    const samples = [
      '/project/src/app.ts',
      '/project/node_modules/express/index.js',
      '(node:internal/modules/cjs/loader)',
    ];
    const config = include.length || exclude.length
      ? buildFilterConfig(include, exclude)
      : undefined;
    samples.forEach((s) => {
      const result = applyFilters(s, config);
      console.log(`  ${result ? '✓' : '✗'} ${s}`);
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

if (process.argv[1]?.endsWith('filter-cli.ts') || process.argv[1]?.endsWith('filter-cli.js')) {
  runFilterCli(process.argv.slice(2));
}
