import { StackFrame } from './parser';

export interface FlattenOptions {
  maxDepth?: number;
  includeNative?: boolean;
  dedupe?: boolean;
}

/**
 * Flatten nested or repeated call chains into a single ordered list.
 */
export function flattenFrames(
  frames: StackFrame[],
  options: FlattenOptions = {}
): StackFrame[] {
  const { maxDepth, includeNative = false, dedupe = false } = options;

  let result = frames.filter((f) => {
    if (!includeNative && isNativeFrame(f)) return false;
    return true;
  });

  if (maxDepth !== undefined) {
    result = result.slice(0, maxDepth);
  }

  if (dedupe) {
    result = dedupeBySignature(result);
  }

  return result;
}

export function isNativeFrame(frame: StackFrame): boolean {
  return (
    frame.file === 'native' ||
    frame.file === '<anonymous>' ||
    /^node:/.test(frame.file ?? '')
  );
}

function dedupeBySignature(frames: StackFrame[]): StackFrame[] {
  const seen = new Set<string>();
  return frames.filter((f) => {
    const key = `${f.file}:${f.line}:${f.column}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function flattenToStrings(frames: StackFrame[]): string[] {
  return frames.map((f) => {
    const loc = [f.file, f.line, f.column].filter(Boolean).join(':');
    return f.functionName ? `${f.functionName} (${loc})` : loc;
  });
}

export function countNativeFrames(frames: StackFrame[]): number {
  return frames.filter(isNativeFrame).length;
}
