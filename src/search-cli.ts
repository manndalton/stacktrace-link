import { search, SearchResult } from './search';
import { colorize, printError, printInfo } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-link search <query> [options]

Search across history and snapshots.

Options:
  --source history|snapshot   Limit results to a specific source
  --limit <n>                 Max number of results (default: 20)
  -h, --help                  Show this help
`);
}

function formatResult(r: SearchResult): string {
  const src = r.source === 'history'
    ? colorize('history', 'cyan')
    : colorize('snapshot', 'magenta');
  const ts = new Date(r.timestamp).toLocaleString();
  return `[${src}] ${colorize(r.label, 'yellow')} — ${r.matchedText} (${ts})`;
}

export function runSearchCli(argv: string[]): void {
  const args = argv.slice(2);

  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  let source: string | undefined;
  let limit = 20;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      source = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i], 10) || 20;
    } else {
      positional.push(args[i]);
    }
  }

  const query = positional.join(' ').trim();
  if (!query) {
    printError('Query cannot be empty.');
    process.exit(1);
  }

  let results = search(query);

  if (source === 'history') {
    results = results.filter(r => r.source === 'history');
  } else if (source === 'snapshot') {
    results = results.filter(r => r.source === 'snapshot');
  }

  results = results.slice(0, limit);

  if (results.length === 0) {
    printInfo(`No results found for "${query}".`);
    return;
  }

  console.log(`\nFound ${results.length} result(s) for "${colorize(query, 'green')}":\n`);
  results.forEach(r => console.log('  ' + formatResult(r)));
  console.log();
}

if (require.main === module) {
  runSearchCli(process.argv);
}
