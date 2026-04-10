#!/usr/bin/env node
import { parseStackTrace } from './parser';
import {
  generateId,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
} from './snapshot';
import { printSuccess, printError, printInfo } from './output';

function printUsage(): void {
  console.log(`Usage: stacktrace-snapshot <command> [options]

Commands:
  save [--label <text>]   Read stdin and save as a snapshot
  list                    List all saved snapshots
  show <id>               Print frames for a snapshot
  delete <id>             Delete a snapshot by id
  help                    Show this help
`);
}

function runSave(label?: string): void {
  const raw = fs.existsSync('/dev/stdin')
    ? require('fs').readFileSync('/dev/stdin', 'utf8')
    : '';
  if (!raw.trim()) { printError('No input provided on stdin'); process.exit(1); }
  const frames = parseStackTrace(raw);
  const snap = { id: generateId(), timestamp: Date.now(), label, frames, raw };
  const file = saveSnapshot(snap);
  printSuccess(`Snapshot saved: ${snap.id} → ${file}`);
}

function runList(): void {
  const snaps = listSnapshots();
  if (snaps.length === 0) { printInfo('No snapshots saved.'); return; }
  for (const s of snaps) {
    const date = new Date(s.timestamp).toISOString();
    const lbl = s.label ? ` (${s.label})` : '';
    console.log(`${s.id}  ${date}  ${s.frames.length} frames${lbl}`);
  }
}

function runShow(id: string): void {
  const snap = loadSnapshot(id);
  if (!snap) { printError(`Snapshot not found: ${id}`); process.exit(1); }
  const lbl = snap.label ? ` — ${snap.label}` : '';
  printInfo(`Snapshot ${snap.id}${lbl}`);
  for (const f of snap.frames) {
    console.log(`  ${f.fn || '<anonymous>'} ${f.file}:${f.line}:${f.column}`);
  }
}

function runDelete(id: string): void {
  const ok = deleteSnapshot(id);
  if (ok) printSuccess(`Deleted snapshot ${id}`);
  else { printError(`Snapshot not found: ${id}`); process.exit(1); }
}

export function runSnapshotCli(argv: string[] = process.argv.slice(2)): void {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'save': {
      const li = rest.indexOf('--label');
      const label = li !== -1 ? rest[li + 1] : undefined;
      runSave(label);
      break;
    }
    case 'list':   runList(); break;
    case 'show':   runShow(rest[0]); break;
    case 'delete': runDelete(rest[0]); break;
    default:       printUsage();
  }
}

if (require.main === module) runSnapshotCli();
