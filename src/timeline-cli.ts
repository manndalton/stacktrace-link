import {
  loadTimeline,
  saveTimeline,
  addTimelineEntry,
  removeTimelineEntry,
  getTimelineEntry,
  clearTimeline,
  TimelineEntry,
} from './timeline';

export function printUsage(): void {
  console.log(`Usage: stacktrace-link timeline <command> [args]

Commands:
  add <label> [frame...]  Add a new timeline entry
  remove <id>             Remove an entry by id
  list                    List all timeline entries
  show <id>               Show details of an entry
  clear                   Remove all timeline entries
  help                    Show this help message
`);
}

export function formatEntry(entry: TimelineEntry): string {
  const date = new Date(entry.timestamp).toISOString();
  const dur = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : '';
  return `[${entry.id}] ${date} — ${entry.label}${dur}\n  frames: ${entry.frames.length}`;
}

export function runAdd(args: string[]): void {
  if (!args.length) { console.error('Error: label required'); process.exit(1); }
  const [label, ...frames] = args;
  const tl = loadTimeline();
  const entry = addTimelineEntry(tl, label, frames);
  saveTimeline(tl);
  console.log(`Added timeline entry: ${entry.id}`);
}

export function runRemove(args: string[]): void {
  if (!args[0]) { console.error('Error: id required'); process.exit(1); }
  const tl = loadTimeline();
  if (!removeTimelineEntry(tl, args[0])) {
    console.error(`Entry not found: ${args[0]}`); process.exit(1);
  }
  saveTimeline(tl);
  console.log(`Removed entry: ${args[0]}`);
}

export function runList(): void {
  const tl = loadTimeline();
  if (!tl.entries.length) { console.log('No timeline entries.'); return; }
  tl.entries.forEach((e) => console.log(formatEntry(e)));
}

export function runShow(args: string[]): void {
  if (!args[0]) { console.error('Error: id required'); process.exit(1); }
  const tl = loadTimeline();
  const entry = getTimelineEntry(tl, args[0]);
  if (!entry) { console.error(`Entry not found: ${args[0]}`); process.exit(1); }
  console.log(JSON.stringify(entry, null, 2));
}

export function runTimelineCli(argv: string[]): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'add': return runAdd(rest);
    case 'remove': return runRemove(rest);
    case 'list': return runList();
    case 'show': return runShow(rest);
    case 'clear': {
      const tl = loadTimeline(); clearTimeline(tl); saveTimeline(tl);
      console.log('Timeline cleared.'); return;
    }
    default: printUsage();
  }
}
