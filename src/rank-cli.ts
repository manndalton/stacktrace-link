import { parseStackTrace, firstUserFrame } from './parser';
import { rankFrames, topRankedFrame, formatRankedFrame } from './rank';
import { printError, printInfo } from './output';
import * as fs from 'fs';

function printUsage(): void {
  console.log('Usage: rank-cli [--top] [--limit N] <file|->\n');
  console.log('  Ranks stack frames by historical frequency.');
  console.log('  --top        Print only the single top-ranked frame');
  console.log('  --limit N    Print at most N ranked frames (default: 10)');
}

interface RankArgs {
  topOnly: boolean;
  limit: number;
  source: string;
}

function parseArgs(argv: string[]): RankArgs {
  let topOnly = false;
  let limit = 10;
  let source = '-';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') { printUsage(); process.exit(0); }
    else if (argv[i] === '--top') topOnly = true;
    else if (argv[i] === '--limit') limit = parseInt(argv[++i] ?? '10', 10);
    else source = argv[i];
  }

  return { topOnly, limit, source };
}

export function runRankCli(argv: string[]): void {
  const args = parseArgs(argv);
  let input: string;

  try {
    input = args.source === '-'
      ? fs.readFileSync('/dev/stdin', 'utf8')
      : fs.readFileSync(args.source, 'utf8');
  } catch (e: any) {
    printError(`Cannot read input: ${e.message}`);
    process.exit(1);
  }

  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printInfo('No stack frames found.');
    return;
  }

  if (args.topOnly) {
    const top = topRankedFrame(frames);
    if (top) console.log(formatRankedFrame(top));
    return;
  }

  const ranked = rankFrames(frames).slice(0, args.limit);
  ranked.forEach((f, i) => console.log(`${i + 1}. ${formatRankedFrame(f)}`));
}

if (require.main === module) {
  runRankCli(process.argv.slice(2));
}
