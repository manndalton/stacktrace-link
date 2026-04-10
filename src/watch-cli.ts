#!/usr/bin/env node
import { Command } from 'commander';
import { watchStdin, watchFile } from './watcher';
import { printError } from './output';

const program = new Command();

program
  .name('stacktrace-watch')
  .description('Watch a file or stdin for Node.js stack traces and open them in your editor')
  .version('1.0.0');

program
  .command('stdin')
  .description('Watch stdin for stack traces (pipe output into this command)')
  .option('-c, --config <path>', 'path to config file')
  .option('--no-open', 'parse and print without opening editor')
  .action((opts) => {
    watchStdin({
      configPath: opts.config,
      autoOpen: opts.open,
    });
  });

program
  .command('file <path>')
  .description('Watch a log file for stack traces')
  .option('-c, --config <path>', 'path to config file')
  .option('--no-open', 'parse and print without opening editor')
  .action((filePath: string, opts) => {
    try {
      const watcher = watchFile(filePath, {
        configPath: opts.config,
        autoOpen: opts.open,
      });

      process.on('SIGINT', () => {
        watcher.close();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        watcher.close();
        process.exit(0);
      });
    } catch (err) {
      printError(`Failed to watch file: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
