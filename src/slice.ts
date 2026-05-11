import { StackFrame } from './parser';

export interface SliceOptions {
  start?: number;
  end?: number;
  count?: number;
  fromBottom?: boolean;
}

/**
 * Slice a subset of frames from a stack trace.
 * Supports positive/negative indices and top/bottom selection.
 */
export function sliceFrames(frames: StackFrame[], opts: SliceOptions): StackFrame[] {
  const len = frames.length;
  if (len === 0) return [];

  let start = opts.start ?? 0;
  let end = opts.end ?? len;

  // Normalize negative indices
  if (start < 0) start = Math.max(0, len + start);
  if (end < 0) end = Math.max(0, len + end);

  // Clamp to valid range
  start = Math.min(start, len);
  end = Math.min(end, len);

  let sliced = frames.slice(start, end);

  if (opts.count !== undefined && opts.count > 0) {
    if (opts.fromBottom) {
      sliced = sliced.slice(-opts.count);
    } else {
      sliced = sliced.slice(0, opts.count);
    }
  }

  return sliced;
}

/**
 * Take the first N frames.
 */
export function takeFirst(frames: StackFrame[], n: number): StackFrame[] {
  return frames.slice(0, Math.max(0, n));
}

/**
 * Take the last N frames.
 */
export function takeLast(frames: StackFrame[], n: number): StackFrame[] {
  return frames.slice(Math.max(0, frames.length - n));
}

/**
 * Parse a slice expression like "0:5", "2:", ":3", "-2:", or just "4".
 */
export function parseSliceExpr(expr: string): SliceOptions {
  if (!expr.includes(':')) {
    const n = parseInt(expr, 10);
    if (isNaN(n)) throw new Error(`Invalid slice expression: ${expr}`);
    return n >= 0 ? { start: 0, end: n } : { start: n };
  }
  const [rawStart, rawEnd] = expr.split(':');
  const start = rawStart === '' ? undefined : parseInt(rawStart, 10);
  const end = rawEnd === '' ? undefined : parseInt(rawEnd, 10);
  if ((rawStart !== '' && isNaN(start!)) || (rawEnd !== '' && isNaN(end!))) {
    throw new Error(`Invalid slice expression: ${expr}`);
  }
  return { start, end };
}
