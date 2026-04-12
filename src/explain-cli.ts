import { parseStackTrace, firstUserFrame } from './parser';
import { explainStackTrace } from './explain';
import { colorize, printError } from './output';

function printUsage(): void {
  console.log('Usage: stacktrace-link explain [--all]');
  console.log('  Reads a stack trace from stdin and prints an explanation.');
  console.log('  --all   Explain all frames, not just user frames');
}

function formatExplanation(result: ReturnType<typeof explainStackTrace>): string {
  const lines: string[] = [];
  lines.push(colorize(`${result.errorType}: ${result.errorMessage}`, 'red'));
  lines.push('');
  for (const exp of result.explanations) {
    lines.push(colorize('  • ' + exp.summary, 'yellow'));
    for (const s of exp.suggestions) {
      lines.push('    ' + colorize('→', 'cyan') + ' ' + s);
    }
  }
  lines.push('');
  lines.push(colorize('Tip: ', 'green') + result.tip);
  return lines.join('\n');
}

export async function runExplainCli(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const showAll = argv.includes('--all');

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = Buffer.concat(chunks).toString('utf8').trim();

  if (!input) {
    printError('No input provided. Pipe a stack trace to stdin.');
    process.exitCode = 1;
    return;
  }

  const parsed = parseStackTrace(input);
  if (!parsed) {
    printError('Could not parse a stack trace from input.');
    process.exitCode = 1;
    return;
  }

  const frames = showAll ? parsed.frames : (firstUserFrame(parsed) ? [firstUserFrame(parsed)!] : parsed.frames);
  const result = explainStackTrace(parsed.errorType, parsed.errorMessage, frames);
  console.log(formatExplanation(result));
}
