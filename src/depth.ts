import { StackFrame } from './parser';

export interface DepthOptions {
  maxDepth?: number;
  minDepth?: number;
  countFrom?: 'top' | 'bottom';
}

/**
 * Returns the depth (index) of a frame within a stack trace.
 * Depth 0 is the innermost (top) frame.
 */
export function getFrameDepth(frames: StackFrame[], frame: StackFrame): number {
  return frames.indexOf(frame);
}

/**
 * Filters frames to only those within the specified depth range.
 */
export function filterByDepth(frames: StackFrame[], options: DepthOptions): StackFrame[] {
  const { maxDepth, minDepth = 0, countFrom = 'top' } = options;

  const ordered = countFrom === 'bottom' ? [...frames].reverse() : frames;

  const result = ordered.filter((_, i) => {
    if (i < minDepth) return false;
    if (maxDepth !== undefined && i > maxDepth) return false;
    return true;
  });

  return countFrom === 'bottom' ? result.reverse() : result;
}

/**
 * Returns the maximum depth of a stack trace.
 */
export function stackDepth(frames: StackFrame[]): number {
  return frames.length - 1;
}

/**
 * Returns frames at an exact depth.
 */
export function frameAtDepth(frames: StackFrame[], depth: number): StackFrame | undefined {
  return frames[depth];
}

/**
 * Formats a depth annotation string for a frame.
 */
export function formatDepthLabel(depth: number, total: number): string {
  const pct = total > 0 ? Math.round((depth / total) * 100) : 0;
  return `[depth ${depth}/${total} (${pct}%)]`;
}
