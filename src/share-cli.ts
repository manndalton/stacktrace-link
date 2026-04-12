import { saveShare, loadShare, listShares, deleteShare, exportShareText } from './share';
import { parseStackTrace } from './parser';
import { printError, printSuccess, printInfo } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-link share <command> [options]

Commands:
  create [--title <title>]   Read stdin and save as a share
  list                       List all saved shares
  show <id>                  Show a share by ID
  export <id>                Export share as plain text
  delete <id>                Delete a share
  help                       Show this help
`);
}

export async function runCreate(args: string[]): Promise<void> {
  const titleIdx = args.indexOf('--title');
  const title = titleIdx !== -1 ? args[titleIdx + 1] : undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const rawTrace = Buffer.concat(chunks).toString('utf8').trim();
  if (!rawTrace) {
    printError('No input provided on stdin');
    process.exit(1);
  }
  const frames = parseStackTrace(rawTrace);
  const payload = saveShare(frames, rawTrace, title);
  printSuccess(`Share saved with ID: ${payload.id}`);
}

export function runList(): void {
  const shares = listShares();
  if (shares.length === 0) {
    printInfo('No shares found.');
    return;
  }
  for (const s of shares) {
    const label = s.title ? ` — ${s.title}` : '';
    console.log(`${s.id}  ${s.createdAt}${label}  (${s.frames.length} frames)`);
  }
}

export function runShow(id: string): void {
  const payload = loadShare(id);
  if (!payload) {
    printError(`Share not found: ${id}`);
    process.exit(1);
  }
  console.log(JSON.stringify(payload, null, 2));
}

export function runExport(id: string): void {
  const payload = loadShare(id);
  if (!payload) {
    printError(`Share not found: ${id}`);
    process.exit(1);
  }
  console.log(exportShareText(payload));
}

export function runDelete(id: string): void {
  const ok = deleteShare(id);
  if (!ok) {
    printError(`Share not found: ${id}`);
    process.exit(1);
  }
  printSuccess(`Deleted share: ${id}`);
}

export async function runShareCli(args: string[]): Promise<void> {
  const [cmd, ...rest] = args;
  switch (cmd) {
    case 'create': return runCreate(rest);
    case 'list':   return runList();
    case 'show':   return runShow(rest[0]);
    case 'export': return runExport(rest[0]);
    case 'delete': return runDelete(rest[0]);
    default:       printUsage();
  }
}
