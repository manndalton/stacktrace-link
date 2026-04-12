import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface MetricsEntry {
  timestamp: number;
  command: string;
  durationMs: number;
  success: boolean;
  frameCount?: number;
}

export interface MetricsSummary {
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  commandCounts: Record<string, number>;
}

export function getMetricsPath(): string {
  return path.join(os.homedir(), '.stacktrace-link', 'metrics.json');
}

export function loadMetrics(): MetricsEntry[] {
  const p = getMetricsPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as MetricsEntry[];
  } catch {
    return [];
  }
}

export function saveMetrics(entries: MetricsEntry[]): void {
  const p = getMetricsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(entries, null, 2));
}

export function recordMetric(entry: MetricsEntry): void {
  const entries = loadMetrics();
  entries.push(entry);
  // Keep last 500 entries
  if (entries.length > 500) entries.splice(0, entries.length - 500);
  saveMetrics(entries);
}

export function clearMetrics(): void {
  saveMetrics([]);
}

export function summarizeMetrics(entries: MetricsEntry[]): MetricsSummary {
  if (entries.length === 0) {
    return { totalRuns: 0, successRate: 0, avgDurationMs: 0, commandCounts: {} };
  }
  const successful = entries.filter(e => e.success).length;
  const totalDuration = entries.reduce((sum, e) => sum + e.durationMs, 0);
  const commandCounts: Record<string, number> = {};
  for (const e of entries) {
    commandCounts[e.command] = (commandCounts[e.command] ?? 0) + 1;
  }
  return {
    totalRuns: entries.length,
    successRate: successful / entries.length,
    avgDurationMs: totalDuration / entries.length,
    commandCounts,
  };
}
