import { pivotFrames, formatPivot, PivotField } from './pivot';
import { parseStackTrace } from './parser';

const VALID_FIELDS: PivotField[] = ['file', 'function', 'package'];

function printUsage(): void {
  console.log(`Usage: stacktrace-link pivot [--field <file|function|package>] [--json]`);
  console.log('');
  console.log('Reads a stack trace from stdin and pivots frames by the given field.');
  console.log('');
  console.log('Options:');
  console.log('  --field  Field to pivot on (default: file)');
  console.log('  --json   Output raw JSON instead of formatted text');
  console.log('  --help   Show this help message');
}

export function parseArgs(argv: string[]): { field: PivotField; json: boolean } | null {
  let field: PivotField = 'file';
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      return null;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--field') {
      const val = argv[++i];
      if (!VALID_FIELDS.includes(val as PivotField)) {
        console.error(`Invalid field: ${val}. Must be one of: ${VALID_FIELDS.join(', ')}`);
        return null;
      }
      field = val as PivotField;
    }
  }

  return { field, json };
}

export async function runPivotCli(argv: string[], input: string): Promise<void> {
  const opts = parseArgs(argv);
  if (!opts) return;

  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    console.error('No stack frames found in input.');
    process.exitCode = 1;
    return;
  }

  const entries = pivotFrames(frames, opts.field);

  if (opts.json) {
    console.log(JSON.stringify(entries, null, 2));
  } else {
    console.log(formatPivot(entries, opts.field));
  }
}
