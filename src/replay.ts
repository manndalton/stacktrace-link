import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ReplayEntry {
  id: string;
  timestamp: number;
  label?: string;
  input: string;
}

export function getReplayDir(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'replays');
}

export function loadReplays(): ReplayEntry[] {
  const dir = getReplayDir();
  if (!fs.existsSync(dir)) return [];
  const file = path.join(dir, 'replays.json');
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as ReplayEntry[];
  } catch {
    return [];
  }
}

export function saveReplays(entries: ReplayEntry[]): void {
  const dir = getReplayDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'replays.json'), JSON.stringify(entries, null, 2));
}

export function addReplay(input: string, label?: string): ReplayEntry {
  const entries = loadReplays();
  const entry: ReplayEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    label,
    input,
  };
  entries.push(entry);
  saveReplays(entries);
  return entry;
}

export function removeReplay(id: string): boolean {
  const entries = loadReplays();
  const next = entries.filter(e => e.id !== id);
  if (next.length === entries.length) return false;
  saveReplays(next);
  return true;
}

export function findReplay(id: string): ReplayEntry | undefined {
  return loadReplays().find(e => e.id === id);
}

export function clearReplays(): void {
  saveReplays([]);
}
