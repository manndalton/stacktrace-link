import { addBookmark, loadBookmarks, removeBookmark, findBookmark } from './bookmark';

function printUsage(): void {
  console.log(`Usage: stacktrace-link bookmark <command> [args]

Commands:
  list                      List all bookmarks
  add <label> <file> <line> Add a bookmark
  remove <id>               Remove a bookmark by id
  show <id>                 Show details of a bookmark
  help                      Show this help message
`);
}

export function runList(): void {
  const bookmarks = loadBookmarks();
  if (bookmarks.length === 0) {
    console.log('No bookmarks saved.');
    return;
  }
  for (const b of bookmarks) {
    console.log(`[${b.id}] ${b.label} — ${b.file}:${b.line}${b.column != null ? `:${b.column}` : ''} (${b.createdAt})`);
  }
}

export function runAdd(args: string[]): void {
  const [label, file, lineStr, colStr] = args;
  if (!label || !file || !lineStr) {
    console.error('Usage: bookmark add <label> <file> <line> [column]');
    process.exit(1);
  }
  const line = parseInt(lineStr, 10);
  const column = colStr ? parseInt(colStr, 10) : undefined;
  if (isNaN(line)) {
    console.error('Line must be a number.');
    process.exit(1);
  }
  const entry = addBookmark(label, file, line, column);
  console.log(`Bookmark added: [${entry.id}] ${entry.label}`);
}

export function runRemove(args: string[]): void {
  const [id] = args;
  if (!id) {
    console.error('Usage: bookmark remove <id>');
    process.exit(1);
  }
  const removed = removeBookmark(id);
  if (removed) {
    console.log(`Bookmark ${id} removed.`);
  } else {
    console.error(`No bookmark found with id: ${id}`);
    process.exit(1);
  }
}

export function runShow(args: string[]): void {
  const [id] = args;
  if (!id) {
    console.error('Usage: bookmark show <id>');
    process.exit(1);
  }
  const b = findBookmark(id);
  if (!b) {
    console.error(`No bookmark found with id: ${id}`);
    process.exit(1);
  }
  console.log(JSON.stringify(b, null, 2));
}

export function runBookmarkCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'list': return runList();
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'show': return runShow(rest);
    default: return printUsage();
  }
}
