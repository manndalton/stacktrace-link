import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface HistoryEntry {
  timestamp: number;
  file: string;
  line: number;
  column?: number;
  editor: string;
}

const DEFAULT_HISTORY_PATH = path.join(os.homedir(), '.stacktrace-link', 'history.json');
const MAX_HISTORY_ENTRIES = 100;

export function getHistoryPath(): string {
  return process.env.STACKTRACE_HISTORY_PATH ?? DEFAULT_HISTORY_PATH;
}

export function loadHistory(historyPath: string = getHistoryPath()): HistoryEntry[] {
  try {
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    const raw = fs.readFileSync(historyPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[], historyPath: string = getHistoryPath()): void {
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const trimmed = entries.slice(-MAX_HISTORY_ENTRIES);
  fs.writeFileSync(historyPath, JSON.stringify(trimmed, null, 2), 'utf8');
}

export function addHistoryEntry(
  entry: Omit<HistoryEntry, 'timestamp'>,
  historyPath: string = getHistoryPath()
): void {
  const entries = loadHistory(historyPath);
  entries.push({ ...entry, timestamp: Date.now() });
  saveHistory(entries, historyPath);
}

export function clearHistory(historyPath: string = getHistoryPath()): void {
  saveHistory([], historyPath);
}
