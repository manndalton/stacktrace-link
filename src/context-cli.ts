import * as path from 'path';
import { extractFrameContext, formatFrameContext, contextSummary } from './context';
import { printError, printInfo } from './output';

export function printUsage(): void {
  console.log(`
Usage: stacktrace-link context <file> <line> [contextLines]

Show source context around a specific file/line.

Arguments:
  file          Path to the source file
  line          Line number (1-based)
  contextLines  Lines of context to show (default: 3)

Examples:
  stacktrace-link context src/app.ts 42
  stacktrace-link context src/app.ts 42 5
`.trim());
}

export function parseArgs(args: string[]): {
  file: string;
  line: number;
  contextLines: number;
} | null {
  if (args.length < 2) return null;
  const file = path.resolve(args[0]);
  const line = parseInt(args[1], 10);
  if (isNaN(line) || line < 1) return null;
  const contextLines = args[2] ? parseInt(args[2], 10) : 3;
  if (isNaN(contextLines) || contextLines < 0) return null;
  return { file, line, contextLines };
}

export function runContextCli(args: string[]): void {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const parsed = parseArgs(args);
  if (!parsed) {
    printError('Invalid arguments. Use --help for usage.');
    process.exitCode = 1;
    return;
  }

  const { file, line, contextLines } = parsed;
  const ctx = extractFrameContext(file, line, contextLines);

  if (!ctx) {
    printError(`Could not read context from ${file} at line ${line}`);
    process.exitCode = 1;
    return;
  }

  printInfo(contextSummary(ctx));
  console.log();
  console.log(formatFrameContext(ctx));
}
