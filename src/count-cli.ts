import * as fs from 'fs';
import { parseStackTrace } from './parser';
import { countFrames, formatCountResult } from './count';

function printUsage(): void {
  console.log(`Usage: stacktrace-count [options] [file]

Count frames in a stack trace.

Options:
  --json        Output as JSON
  --top <n>     Show top N files (default: 5)
  -h, --help    Show this help

If no file is given, reads from stdin.`);
}

function parseArgs(argv: string[]): { file?: string; json: boolean; help: boolean } {
  const args = argv.slice(2);
  let file: string | undefined;
  let json = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '-h' || args[i] === '--help') help = true;
    else if (!args[i].startsWith('-')) file = args[i];
  }

  return { file, json, help };
}

export async function runCountCli(argv: string[] = process.argv): Promise<void> {
  const { file, json, help } = parseArgs(argv);

  if (help) {
    printUsage();
    return;
  }

  let input: string;
  if (file) {
    if (!fs.existsSync(file)) {
      console.error(`Error: file not found: ${file}`);
      process.exit(1);
    }
    input = fs.readFileSync(file, 'utf8');
  } else {
    input = fs.readFileSync('/dev/stdin', 'utf8');
  }

  const frames = parseStackTrace(input);
  const result = countFrames(frames);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatCountResult(result));
  }
}

if (require.main === module) {
  runCountCli().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
