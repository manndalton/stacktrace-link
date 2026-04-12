import { StackFrame } from './parser';
import { loadHistory } from './history';
import { loadMetrics } from './metrics';
import { listSnapshots } from './snapshot';

export interface ReportSummary {
  totalTraces: number;
  topFiles: Array<{ file: string; count: number }>;
  topErrors: Array<{ message: string; count: number }>;
  snapshotCount: number;
  generatedAt: string;
}

export function computeTopFiles(
  frames: StackFrame[]
): Array<{ file: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const frame of frames) {
    if (frame.file) {
      counts[frame.file] = (counts[frame.file] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function computeTopErrors(
  messages: string[]
): Array<{ message: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const msg of messages) {
    counts[msg] = (counts[msg] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export async function generateReport(): Promise<ReportSummary> {
  const history = await loadHistory();
  const snapshots = await listSnapshots();

  const allFrames: StackFrame[] = history.flatMap((e) => e.frames ?? []);
  const allMessages: string[] = history
    .map((e) => e.errorMessage)
    .filter((m): m is string => Boolean(m));

  return {
    totalTraces: history.length,
    topFiles: computeTopFiles(allFrames),
    topErrors: computeTopErrors(allMessages),
    snapshotCount: snapshots.length,
    generatedAt: new Date().toISOString(),
  };
}
