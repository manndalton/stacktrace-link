import { getBlameForLine, isGitRepo, BlameInfo } from './blame';
import { parseStackTrace } from './parser';
import { resolveUserFrames } from './resolver';
import { printError, printInfo, colorize } from './output';

export function printUsage(): void {
  console.log('Usage: stacktrace-link blame [options]');
  console.log('');
  console.log('Show git blame info for the first user frame in a stack trace.');
  console.log('');
  console.log('Options:');
  console.log('  --all       Show blame for all user frames');
  console.log('  --help      Show this help message');
}

export function formatBlame(info: BlameInfo): string {
  const date = new Date(parseInt(info.date, 10) * 1000).toISOString().slice(0, 10);
  return [
    colorize(`  commit:  ${info.commit}`, 'yellow'),
    colorize(`  author:  ${info.author}`, 'cyan'),
    `  date:    ${date}`,
    `  summary: ${info.summary}`,
  ].join('\n');
}

export async function runBlameCli(argv: string[], input: string): Promise<void> {
  if (argv.includes('--help')) {
    printUsage();
    return;
  }

  const showAll = argv.includes('--all');

  if (!isGitRepo()) {
    printError('Not inside a git repository.');
    process.exit(1);
  }

  const frames = parseStackTrace(input);
  const userFrames = resolveUserFrames(frames);

  if (userFrames.length === 0) {
    printError('No user frames found in stack trace.');
    process.exit(1);
  }

  const targets = showAll ? userFrames : [userFrames[0]];

  for (const frame of targets) {
    printInfo(`${frame.file}:${frame.line}`);
    const blame = getBlameForLine(frame.file, frame.line);
    if (blame) {
      console.log(formatBlame(blame));
    } else {
      console.log('  (no blame info available)');
    }
  }
}
