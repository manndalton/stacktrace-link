import { StackFrame } from './parser';

export interface IndentOptions {
  indentChar?: string;
  baseIndent?: number;
  stepSize?: number;
  maxDepth?: number;
}

const defaults: Required<IndentOptions> = {
  indentChar: ' ',
  baseIndent: 0,
  stepSize: 2,
  maxDepth: 20,
};

export function indentFrame(frame: StackFrame, depth: number, opts: IndentOptions = {}): string {
  const o = { ...defaults, ...opts };
  const clamped = Math.min(depth, o.maxDepth);
  const spaces = o.indentChar.repeat(o.baseIndent + clamped * o.stepSize);
  const loc = frame.file ? `${frame.file}:${frame.line ?? 0}:${frame.column ?? 0}` : '<unknown>';
  const fn = frame.functionName ?? '<anonymous>';
  return `${spaces}at ${fn} (${loc})`;
}

export function indentFrames(frames: StackFrame[], opts: IndentOptions = {}): string[] {
  return frames.map((frame, i) => indentFrame(frame, i, opts));
}

export function formatIndented(frames: StackFrame[], opts: IndentOptions = {}): string {
  return indentFrames(frames, opts).join('\n');
}

export function detectMaxDepth(frames: StackFrame[]): number {
  return Math.max(0, frames.length - 1);
}
