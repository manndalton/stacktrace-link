import { parseStackTrace } from './parser';
import { groupFrames, sortGroups, GroupBy } from './group';
import { formatGroupList, formatGroupSummary } from './group-formatter';
import { printError, printInfo } from './output';

function printUsage(): void {
  printInfo('Usage: stacktrace-group [options]');
  printInfo('');
  printInfo('Options:');
  printInfo('  --by <file|directory|package>  Grouping strategy (default: file)');
  printInfo('  --sort <asc|desc>              Sort order by frame count (default: desc)');
  printInfo('  --verbose                      Show individual frames per group');
  printInfo('  --summary                      Print summary line');
  printInfo('  --help                         Show this help message');
}

function parseArgs(argv: string[]): {
  by: GroupBy;
  sort: 'asc' | 'desc';
  verbose: boolean;
  summary: boolean;
  help: boolean;
} {
  const by = (argv.find((_, i) => argv[i - 1] === '--by') ?? 'file') as GroupBy;
  const sort = (argv.find((_, i) => argv[i - 1] === '--sort') ?? 'desc') as 'asc' | 'desc';
  return {
    by: ['file', 'directory', 'package'].includes(by) ? by : 'file',
    sort: sort === 'asc' ? 'asc' : 'desc',
    verbose: argv.includes('--verbose'),
    summary: argv.includes('--summary'),
    help: argv.includes('--help'),
  };
}

export async function runGroupCli(
  argv: string[],
  input: string
): Promise<void> {
  const opts = parseArgs(argv);

  if (opts.help) {
    printUsage();
    return;
  }

  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printError('No stack frames found in input.');
    return;
  }

  const groups = sortGroups(groupFrames(frames, opts.by), opts.sort);
  console.log(formatGroupList(groups, opts.verbose));

  if (opts.summary) {
    console.log('');
    console.log(formatGroupSummary(groups));
  }
}

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => { input += chunk; });
  process.stdin.on('end', () => {
    runGroupCli(process.argv.slice(2), input).catch(err => {
      printError(String(err));
      process.exit(1);
    });
  });
}
