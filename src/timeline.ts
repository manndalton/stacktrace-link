import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TimelineEntry {
  id: string;
  timestamp: number;
  label: string;
  frames: string[];
  durationMs?: number;
}

export interface Timeline {
  entries: TimelineEntry[];
}

export function getTimelinePath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'timeline.json');
}

export function loadTimeline(filePath?: string): Timeline {
  const p = filePath ?? getTimelinePath();
  if (!fs.existsSync(p)) return { entries: [] };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Timeline;
  } catch {
    return { entries: [] };
  }
}

export function saveTimeline(timeline: Timeline, filePath?: string): void {
  const p = filePath ?? getTimelinePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(timeline, null, 2), 'utf8');
}

export function addTimelineEntry(
  timeline: Timeline,
  label: string,
  frames: string[],
  durationMs?: number
): TimelineEntry {
  const entry: TimelineEntry = {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    label,
    frames,
    durationMs,
  };
  timeline.entries.push(entry);
  return entry;
}

export function removeTimelineEntry(timeline: Timeline, id: string): boolean {
  const before = timeline.entries.length;
  timeline.entries = timeline.entries.filter((e) => e.id !== id);
  return timeline.entries.length < before;
}

export function getTimelineEntry(timeline: Timeline, id: string): TimelineEntry | undefined {
  return timeline.entries.find((e) => e.id === id);
}

export function clearTimeline(timeline: Timeline): void {
  timeline.entries = [];
}
