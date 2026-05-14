import { parseStackTrace } from './parser';
import { maskFrames, buildMaskOptions } from './mask';
import { formatFrameList } from './formatter';
import { printError, printInfo } from './output';

function printUsage(): void {
  printInfo(
    'Usage: stacktrace-link mask [options]\n' +
    '\n' +
    'Mask sensitive information in a stack trace read from stdin.\n' +
    '\n' +
    'Options:\n' +
    '  -f, --files        Mask file path segments (keeps filename)\n' +
    '  -n, --functions    Mask function names\n' +
    '  -l, --lines        Mask line and column numbers\n' +
    '  -p, --placeholder  Replacement string (default: ***)\n' +
    '  -h, --help         Show this help message\n'
  );
}

function parseArgs(argv: string[]): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') { args['--help'] = true; }
    else if (arg === '-f' || arg === '--files') { args['--files'] = true; }
    else if (arg === '-n' || arg === '--functions') { args['--functions'] = true; }
    else if (arg === '-l' || arg === '--lines') { args['--lines'] = true; }
    else if ((arg === '-p' || arg === '--placeholder') && argv[i + 1]) {
      args['--placeholder'] = argv[++i];
    }
  }
  return args;
}

export async function runMaskCli(argv: string[], input: string): Promise<void> {
  const args = parseArgs(argv);

  if (args['--help']) {
    printUsage();
    return;
  }

  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printError('No stack frames found in input.');
    process.exitCode = 1;
    return;
  }

  const opts = buildMaskOptions(args);
  const masked = maskFrames(frames, opts);
  process.stdout.write(formatFrameList(masked) + '\n');
}

if (require.main === module) {
  const chunks: Buffer[] = [];
  process.stdin.on('data', (c: Buffer) => chunks.push(c));
  process.stdin.on('end', () => {
    const input = Buffer.concat(chunks).toString();
    runMaskCli(process.argv.slice(2), input).catch(err => {
      printError(String(err));
      process.exitCode = 1;
    });
  });
}
