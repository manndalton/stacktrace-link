import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TimingEntry {
  id: string;
  label: string;
  startedAt: number;
  duration: number;
  frameCount: number;
}

export function getTimingsPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'timings.json');
}

export function loadTimings(): TimingEntry[] {
  const p = getTimingsPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

export function saveTimings(entries: TimingEntry[]): void {
  const p = getTimingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(entries, null, 2));
}

export function recordTiming(label: string, duration: number, frameCount: number): TimingEntry {
  const entry: TimingEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    startedAt: Date.now(),
    duration,
    frameCount,
  };
  const entries = loadTimings();
  entries.push(entry);
  saveTimings(entries);
  return entry;
}

export function clearTimings(): void {
  saveTimings([]);
}

export function computeAverageDuration(entries: TimingEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.duration, 0) / entries.length;
}
