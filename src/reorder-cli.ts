import { parseStackTrace } from './parser';
import { applyReorder, parseReorderStrategy, ReorderConfig, ReorderStrategy } from './reorder';
import { formatFrameList } from './formatter';
import { printError, printInfo } from './output';

export function printUsage(): void {
  printInfo('Usage: stacktrace-link reorder [options]');
  printInfo('');
  printInfo('Options:');
  printInfo('  --strategy <name>   Reorder strategy: reverse | innermost | outermost | alphabetical | none (default: reverse)');
  printInfo('  --limit <n>         Keep only the first N frames after reordering');
  printInfo('  --help              Show this help message');
}

export interface ReorderArgs {
  strategy: ReorderStrategy;
  limit?: number;
  help: boolean;
}

export function parseArgs(argv: string[]): ReorderArgs {
  const args: ReorderArgs = { strategy: 'reverse', help: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--strategy' || arg === '-s') {
      args.strategy = parseReorderStrategy(argv[++i] ?? '');
    } else if (arg === '--limit' || arg === '-l') {
      const n = parseInt(argv[++i] ?? '', 10);
      if (isNaN(n) || n < 1) throw new Error('--limit must be a positive integer');
      args.limit = n;
    }
  }

  return args;
}

export async function runReorderCli(argv: string[], input: string): Promise<void> {
  let args: ReorderArgs;
  try {
    args = parseArgs(argv);
  } catch (err: any) {
    printError(err.message);
    process.exit(1);
  }

  if (args!.help) {
    printUsage();
    return;
  }

  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printError('No stack frames found in input.');
    process.exit(1);
  }

  const config: ReorderConfig = { strategy: args!.strategy, limit: args!.limit };
  const reordered = applyReorder(frames, config);
  process.stdout.write(formatFrameList(reordered) + '\n');
}
