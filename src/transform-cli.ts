import { parseStackTrace, firstUserFrame } from './parser';
import { applyTransforms, buildTransformPipeline } from './transform';
import { formatFrameList } from './formatter';
import { printError, printInfo } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-link transform [options]

Transform file paths in a stack trace.

Options:
  --rename <from>:<to>   Replace a path segment
  --prefix <value>       Add a prefix to all file paths
  --strip <value>        Remove a prefix from all file paths
  --first                Only show the first user frame
  --help                 Show this help message

Reads stack trace from stdin.
`);
}

export function parseArgs(argv: string[]): { transforms: string[]; first: boolean; help: boolean } {
  const transforms: string[] = [];
  let first = false;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') {
      help = true;
    } else if (arg === '--first') {
      first = true;
    } else if ((arg === '--rename' || arg === '--prefix' || arg === '--strip') && argv[i + 1]) {
      const type = arg.slice(2);
      transforms.push(`${type}:${argv[++i]}`);
    }
  }
  return { transforms, first, help };
}

export async function runTransformCli(argv: string[], input: string): Promise<void> {
  const args = parseArgs(argv);
  if (args.help) {
    printUsage();
    return;
  }
  const frames = parseStackTrace(input);
  if (frames.length === 0) {
    printError('No stack frames found in input.');
    return;
  }
  const pipeline = buildTransformPipeline([{ transforms: args.transforms }]);
  const transformed = applyTransforms(frames, pipeline);
  if (args.first) {
    const frame = firstUserFrame(transformed);
    if (!frame) {
      printError('No user frame found.');
      return;
    }
    printInfo(`${frame.file}:${frame.line}`);
  } else {
    console.log(formatFrameList(transformed));
  }
}
