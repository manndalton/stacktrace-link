import { parseStackTrace } from './parser';
import { compactFrames, CompactOptions } from './compact';
import { printError } from './output';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link compact [options]

Read a stack trace from stdin and print each frame in compact form.

Options:
  --max-length <n>    Max characters per line (default: 80)
  --no-line-col       Omit line/column numbers
  --separator <str>   Separator between function and file (default: ' › ')
  --help              Show this help
`);
}

export function parseArgs(argv: string[]): CompactOptions & { help: boolean } {
  const opts: CompactOptions & { help: boolean } = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--max-length' && argv[i + 1]) {
      opts.maxLength = parseInt(argv[++i], 10);
    } else if (arg === '--no-line-col') {
      opts.showLineCol = false;
    } else if (arg === '--separator' && argv[i + 1]) {
      opts.separator = argv[++i];
    }
  }
  return opts;
}

export async function runCompactCli(argv: string[], input: string): Promise<void> {
  const args = parseArgs(argv);
  if (args.help) {
    printUsage();
    return;
  }
  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printError('No stack frames found in input.');
    process.exitCode = 1;
    return;
  }
  const { help: _h, ...opts } = args;
  const lines = compactFrames(frames, opts);
  lines.forEach(l => console.log(l));
}
