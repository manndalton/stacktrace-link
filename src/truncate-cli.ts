import { parseStackTrace } from './parser';
import { truncateFrames, truncateLine, formatTruncationNotice, TruncateOptions } from './truncate';
import { formatFrame } from './formatter';
import { printError } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-truncate [options]

Reads a stack trace from stdin and outputs a truncated version.

Options:
  --max-frames <n>       Maximum number of frames to show (default: 10)
  --max-line-length <n>  Maximum characters per line (default: 120)
  --help                 Show this help message
`);
}

function parseArgs(argv: string[]): { options: TruncateOptions; help: boolean } {
  const options: TruncateOptions = {};
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') {
      help = true;
    } else if (argv[i] === '--max-frames' && argv[i + 1]) {
      options.maxFrames = parseInt(argv[++i], 10);
    } else if (argv[i] === '--max-line-length' && argv[i + 1]) {
      options.maxLineLength = parseInt(argv[++i], 10);
    }
  }
  return { options, help };
}

export function runTruncateCli(input: string, argv: string[]): void {
  const { options, help } = parseArgs(argv);
  if (help) {
    printUsage();
    return;
  }

  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printError('No stack frames found in input.');
    return;
  }

  const { frames: kept, truncated } = truncateFrames(frames, options);
  for (const frame of kept) {
    const line = formatFrame(frame);
    console.log(truncateLine(line, options));
  }
  if (truncated > 0) {
    console.log(formatTruncationNotice(truncated));
  }
}

if (require.main === module) {
  const chunks: string[] = [];
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => chunks.push(d));
  process.stdin.on('end', () => {
    runTruncateCli(chunks.join(''), process.argv.slice(2));
  });
}
