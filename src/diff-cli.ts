import { parseStackTrace } from './parser';
import { diffSnapshots, formatDiff } from './snapshot-diff';
import { loadSnapshot } from './snapshot';

export function printUsage(): void {
  console.log(`
Usage: stacktrace-link diff <snapshotA> <snapshotB> [options]

Compare two stack trace snapshots and show added/removed frames.

Options:
  --json        Output diff as JSON
  --no-color    Disable colored output
  --help        Show this help message

Examples:
  stacktrace-link diff snap-abc123 snap-def456
  stacktrace-link diff snap-abc123 snap-def456 --json
`);
}

export function parseArgs(argv: string[]): { idA: string; idB: string; json: boolean; help: boolean } {
  const args = argv.slice(2);
  const help = args.includes('--help') || args.includes('-h');
  const json = args.includes('--json');
  const positional = args.filter(a => !a.startsWith('--'));
  return { idA: positional[0] ?? '', idB: positional[1] ?? '', json, help };
}

export async function runDiffCli(argv: string[] = process.argv): Promise<void> {
  const { idA, idB, json, help } = parseArgs(argv);

  if (help || !idA || !idB) {
    printUsage();
    process.exit(help ? 0 : 1);
  }

  const snapA = await loadSnapshot(idA);
  const snapB = await loadSnapshot(idB);

  if (!snapA) {
    console.error(`Snapshot not found: ${idA}`);
    process.exit(1);
  }
  if (!snapB) {
    console.error(`Snapshot not found: ${idB}`);
    process.exit(1);
  }

  const framesA = parseStackTrace(snapA.content);
  const framesB = parseStackTrace(snapB.content);
  const diff = diffSnapshots(framesA, framesB);

  if (json) {
    console.log(JSON.stringify(diff, null, 2));
  } else {
    console.log(formatDiff(diff));
  }
}
