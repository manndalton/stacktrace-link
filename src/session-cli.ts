import { loadSession, clearSession, getSessionEntry } from './session';

function printUsage(): void {
  console.log('Usage: stacktrace-session <command>');
  console.log('Commands:');
  console.log('  list            List all session entries');
  console.log('  show <id>       Show details for a session entry');
  console.log('  clear           Clear all session entries');
  console.log('  help            Show this help message');
}

function runList(): void {
  const session = loadSession();
  if (session.entries.length === 0) {
    console.log('No session entries found.');
    return;
  }
  for (const entry of session.entries) {
    const frameCount = entry.frames.length;
    const editor = entry.editorCommand ? ` [${entry.editorCommand}]` : '';
    console.log(`${entry.id}  ${entry.startedAt}  ${frameCount} frame(s)${editor}`);
  }
}

function runShow(id: string | undefined): void {
  if (!id) {
    console.error('Error: session show requires an <id> argument');
    process.exit(1);
  }
  const entry = getSessionEntry(id);
  if (!entry) {
    console.error(`Error: no session entry with id "${id}"`);
    process.exit(1);
  }
  console.log(`ID:      ${entry.id}`);
  console.log(`Started: ${entry.startedAt}`);
  if (entry.editorCommand) {
    console.log(`Editor:  ${entry.editorCommand}`);
  }
  console.log('Frames:');
  for (const frame of entry.frames) {
    console.log(`  ${frame}`);
  }
}

function runClear(): void {
  clearSession();
  console.log('Session cleared.');
}

export function runSessionCli(argv: string[]): void {
  const [command, ...rest] = argv;
  switch (command) {
    case 'list': return runList();
    case 'show': return runShow(rest[0]);
    case 'clear': return runClear();
    case 'help':
    default:
      printUsage();
  }
}

if (require.main === module) {
  runSessionCli(process.argv.slice(2));
}
