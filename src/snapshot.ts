import * as fs from 'fs';
import * as path from 'path';
import { StackFrame } from './parser';

export interface Snapshot {
  id: string;
  timestamp: number;
  label?: string;
  frames: StackFrame[];
  raw: string;
}

export function getSnapshotDir(): string {
  const base = process.env.XDG_DATA_HOME ||
    path.join(process.env.HOME || '~', '.local', 'share');
  return path.join(base, 'stacktrace-link', 'snapshots');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function saveSnapshot(snapshot: Snapshot): string {
  const dir = getSnapshotDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${snapshot.id}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf8');
  return file;
}

export function loadSnapshot(id: string): Snapshot | null {
  const file = path.join(getSnapshotDir(), `${id}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Snapshot;
  } catch {
    return null;
  }
}

export function listSnapshots(): Snapshot[] {
  const dir = getSnapshotDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Snapshot;
      } catch {
        return null;
      }
    })
    .filter((s): s is Snapshot => s !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function deleteSnapshot(id: string): boolean {
  const file = path.join(getSnapshotDir(), `${id}.json`);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}
