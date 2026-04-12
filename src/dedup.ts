import { StackFrame } from './parser';

export interface DedupResult {
  frames: StackFrame[];
  duplicateCount: number;
  groups: Map<string, StackFrame[]>;
}

export function frameSignature(frame: StackFrame): string {
  return `${frame.file}:${frame.line}:${frame.column}`;
}

export function deduplicateFrames(frames: StackFrame[]): DedupResult {
  const seen = new Map<string, StackFrame[]>();

  for (const frame of frames) {
    const sig = frameSignature(frame);
    if (!seen.has(sig)) {
      seen.set(sig, []);
    }
    seen.get(sig)!.push(frame);
  }

  const unique: StackFrame[] = [];
  let duplicateCount = 0;

  for (const [, group] of seen) {
    unique.push(group[0]);
    duplicateCount += group.length - 1;
  }

  return {
    frames: unique,
    duplicateCount,
    groups: seen,
  };
}

export function findRecurringFrames(
  frames: StackFrame[],
  minCount: number = 2
): StackFrame[] {
  const result = deduplicateFrames(frames);
  const recurring: StackFrame[] = [];

  for (const [, group] of result.groups) {
    if (group.length >= minCount) {
      recurring.push(group[0]);
    }
  }

  return recurring;
}

export function mergeDuplicateRuns(frames: StackFrame[]): StackFrame[] {
  if (frames.length === 0) return [];

  const merged: StackFrame[] = [frames[0]];

  for (let i = 1; i < frames.length; i++) {
    const prev = merged[merged.length - 1];
    if (frameSignature(frames[i]) !== frameSignature(prev)) {
      merged.push(frames[i]);
    }
  }

  return merged;
}
