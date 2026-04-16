import { parseStackTrace } from './parser';
import { resolveUserFrames } from './resolver';
import { loadConfig } from './config';
import { applyFilters, buildFilterConfig } from './filter';
import { getActiveTheme } from './theme';
import { colorize, printError } from './output';

export function printUsage(): void {
  console.log(`Usage: stacktrace-colorize [options]

Read a stack trace from stdin and print it with syntax highlighting.

Options:
  --theme <name>    Use a specific theme (default: active theme)
  --no-color        Disable color output
  --user-only       Only show user frames
  --help            Show this help message
`);
}

export interface ColorizeArgs {
  theme?: string;
  noColor: boolean;
  userOnly: boolean;
}

export function parseArgs(argv: string[]): ColorizeArgs {
  const args: ColorizeArgs = { noColor: false, userOnly: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--theme' && argv[i + 1]) {
      args.theme = argv[++i];
    } else if (argv[i] === '--no-color') {
      args.noColor = true;
    } else if (argv[i] === '--user-only') {
      args.userOnly = true;
    } else if (argv[i] === '--help') {
      printUsage();
      process.exit(0);
    }
  }
  return args;
}

export async function runColorizeCli(
  input: string,
  argv: string[] = process.argv.slice(2)
): Promise<void> {
  const args = parseArgs(argv);
  const config = await loadConfig();
  const filterConfig = buildFilterConfig(config);

  let frames = parseStackTrace(input);
  if (!frames.length) {
    printError('No stack frames found in input.');
    process.exit(1);
  }

  frames = applyFilters(frames, filterConfig);
  if (args.userOnly) {
    frames = resolveUserFrames(frames, config);
  }

  const theme = args.noColor ? null : await getActiveTheme();

  for (const frame of frames) {
    const file = frame.file ?? '<unknown>';
    const loc = frame.line != null ? `:${frame.line}` : '';
    const col = frame.column != null ? `:${frame.column}` : '';
    const fn = frame.functionName ? `${frame.functionName} ` : '';
    const raw = `  at ${fn}(${file}${loc}${col})`;

    if (theme && !args.noColor) {
      const fileColored = colorize(file, theme.colors?.file ?? 'cyan');
      const locColored = colorize(`${loc}${col}`, theme.colors?.line ?? 'yellow');
      const fnColored = fn ? colorize(fn, theme.colors?.fn ?? 'green') : '';
      console.log(`  at ${fnColored}(${fileColored}${locColored})`);
    } else {
      console.log(raw);
    }
  }
}
