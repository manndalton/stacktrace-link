import { StackFrame } from './parser';
import { loadMetrics } from './metrics';

export interface RankedFrame extends StackFrame {
  score: number;
  hitCount: number;
}

export function scoreFrame(frame: StackFrame, hitCounts: Record<string, number>): number {
  const key = `${frame.file}:${frame.line}`;
  const hits = hitCounts[key] ?? 0;
  // Higher score = more frequently seen = more interesting
  return hits;
}

export function rankFrames(frames: StackFrame[]): RankedFrame[] {
  const metrics = loadMetrics();
  const hitCounts: Record<string, number> = {};

  for (const entry of metrics) {
    const key = `${entry.file}:${entry.line}`;
    hitCounts[key] = (hitCounts[key] ?? 0) + 1;
  }

  return frames
    .map((frame) => ({
      ...frame,
      score: scoreFrame(frame, hitCounts),
      hitCount: hitCounts[`${frame.file}:${frame.line}`] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
}

export function topRankedFrame(frames: StackFrame[]): RankedFrame | undefined {
  const ranked = rankFrames(frames);
  return ranked[0];
}

export function formatRankedFrame(frame: RankedFrame): string {
  return `[${frame.hitCount} hits] ${frame.file}:${frame.line}`;
}
