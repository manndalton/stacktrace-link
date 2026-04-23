#!/usr/bin/env node
import * as readline from 'readline';
import { createWatchSession, WatchModeOptions } from './watch-mode';
import { formatFrame } from './formatter';
import { colorize } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-link watch-mode [options]

Options:
  --auto-open        Automatically open first frame in editor
  --debounce <ms>    Debounce delay in milliseconds (default: 200)
  --max-history <n>  Maximum number of traces to retain (default: 50)
  --help             Show this help message

Reads stack traces from stdin line-by-line in watch mode.
Type or paste a stack trace; it will be parsed after the debounce period.
`);
}

function parseArgs(argv: string[]): Partial<WatchModeOptions> & { help?: boolean } {
  const opts: Partial<WatchModeOptions> & { help?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') opts.help = true;
    else if (arg === '--auto-open') opts.autoOpen = true;
    else if (arg === '--debounce') opts.debounceMs = parseInt(argv[++i] ?? '200', 10);
    else if (arg === '--max-history') opts.maxHistory = parseInt(argv[++i] ?? '50', 10);
  }
  return opts;
}

export async function runWatchModeCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const opts = parseArgs(argv);
  if (opts.help) {
    printUsage();
    return;
  }

  const { help: _h, ...sessionOpts } = opts;
  const session = createWatchSession(sessionOpts);

  session.on('trace', ({ frames, timestamp }) => {
    console.log(colorize('cyan', `\n[${timestamp.toISOString()}] Stack trace detected (${frames.length} user frame(s)):`))
    frames.forEach((f, i) => console.log(`  ${i + 1}. ${formatFrame(f)}`));
  });

  session.on('opened', ({ frame, command }) => {
    console.log(colorize('green', `  Opened: ${formatFrame(frame)}`));
    console.log(colorize('dim' as any, `  Command: ${command}`));
  });

  console.log(colorize('yellow', 'Watch mode active. Paste stack traces below (Ctrl+C to exit).\n'));

  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  let buffer = '';

  rl.on('line', (line) => {
    buffer += line + '\n';
    session.handleInput(buffer);
  });

  rl.on('close', () => {
    session.destroy();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    session.destroy();
    process.exit(0);
  });
}

if (require.main === module) {
  runWatchModeCli().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
