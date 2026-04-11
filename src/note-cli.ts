import { addNote, removeNote, getNotesForFrame, updateNote, loadNotes } from './note';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link note <command> [args]

Commands:
  add <frameKey> <text>       Add a note to a frame
  remove <frameKey> <id>      Remove a note by id
  update <frameKey> <id> <text>  Update note text
  show <frameKey>             Show notes for a frame
  list                        List all frames with notes
  help                        Show this help
`);
}

export function runAdd(args: string[]): void {
  const [frameKey, ...rest] = args;
  const text = rest.join(' ');
  if (!frameKey || !text) { console.error('Usage: note add <frameKey> <text>'); process.exit(1); }
  const note = addNote(frameKey, text);
  console.log(`Added note ${note.id} to ${frameKey}`);
}

export function runRemove(args: string[]): void {
  const [frameKey, id] = args;
  if (!frameKey || !id) { console.error('Usage: note remove <frameKey> <id>'); process.exit(1); }
  const ok = removeNote(frameKey, id);
  if (ok) console.log(`Removed note ${id}`);
  else { console.error(`Note not found: ${id}`); process.exit(1); }
}

export function runUpdate(args: string[]): void {
  const [frameKey, id, ...rest] = args;
  const text = rest.join(' ');
  if (!frameKey || !id || !text) { console.error('Usage: note update <frameKey> <id> <text>'); process.exit(1); }
  const note = updateNote(frameKey, id, text);
  if (note) console.log(`Updated note ${id}`);
  else { console.error(`Note not found: ${id}`); process.exit(1); }
}

export function runShow(args: string[]): void {
  const [frameKey] = args;
  if (!frameKey) { console.error('Usage: note show <frameKey>'); process.exit(1); }
  const notes = getNotesForFrame(frameKey);
  if (notes.length === 0) { console.log('No notes for this frame.'); return; }
  for (const n of notes) {
    console.log(`[${n.id}] ${n.updatedAt}\n  ${n.text}`);
  }
}

export function runList(): void {
  const all = loadNotes();
  const keys = Object.keys(all);
  if (keys.length === 0) { console.log('No notes stored.'); return; }
  for (const key of keys) {
    console.log(`${key} (${all[key].length} note${all[key].length !== 1 ? 's' : ''})`);
  }
}

export function runNoteCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'update': return runUpdate(rest);
    case 'show': return runShow(rest);
    case 'list': return runList();
    default: printUsage();
  }
}
