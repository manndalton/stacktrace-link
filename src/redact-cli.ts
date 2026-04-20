import { redactStackTrace, RedactConfig } from './redact';
import { printError } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-link redact [options]

Redact sensitive information from stack traces read on stdin.

Options:
  --home <dir>        Override home directory for redaction
  --pattern <regex>   Additional regex pattern to redact (repeatable)
  --replace <text>    Replacement string (default: <redacted>)
  --help              Show this help message

Example:
  cat error.log | stacktrace-link redact
  cat error.log | stacktrace-link redact --pattern "secret-[a-z0-9]+"
`);
}

function parseArgs(args: string[]): { config: RedactConfig; help: boolean } {
  const config: RedactConfig = { patterns: [] };
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--home' && args[i + 1]) {
      config.homedir = args[++i];
    } else if (arg === '--replace' && args[i + 1]) {
      config.replaceWith = args[++i];
    } else if (arg === '--pattern' && args[i + 1]) {
      try {
        config.patterns!.push(new RegExp(args[++i], 'g'));
      } catch {
        printError(`Invalid regex pattern: ${args[i]}`);
        process.exit(1);
      }
    }
  }
  return { config, help };
}

export async function runRedactCli(args: string[]): Promise<void> {
  const { config, help } = parseArgs(args);
  if (help) {
    printUsage();
    return;
  }

  const chunks: Buffer[] = [];
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', () => {
    const input = Buffer.concat(chunks).toString('utf8');
    const output = redactStackTrace(input, config);
    process.stdout.write(output);
  });
  process.stdin.on('error', err => {
    printError(`Failed to read stdin: ${err.message}`);
    process.exit(1);
  });
}
