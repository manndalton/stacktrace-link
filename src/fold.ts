import { StackFrame } from './parser';

export interface FoldOptions {
  maxRepeats?: number;
  collapseNodeModules?: boolean;
  collapseInternal?: boolean;
}

export interface FoldedGroup {
  frames: StackFrame[];
  collapsed: boolean;
  reason?: string;
  count: number;
}

const NODE_MODULES_RE = /node_modules/;
const INTERNAL_RE = /^(node:|internal\/)/;

export function isNodeModulesFrame(frame: StackFrame): boolean {
  return NODE_MODULES_RE.test(frame.file ?? '');
}

export function isInternalFrame(frame: StackFrame): boolean {
  return INTERNAL_RE.test(frame.file ?? '');
}

export function foldFrames(
  frames: StackFrame[],
  opts: FoldOptions = {}
): FoldedGroup[] {
  const { maxRepeats = 1, collapseNodeModules = true, collapseInternal = true } = opts;
  const groups: FoldedGroup[] = [];
  let i = 0;

  while (i < frames.length) {
    const frame = frames[i];

    if (collapseNodeModules && isNodeModulesFrame(frame)) {
      const start = i;
      while (i < frames.length && isNodeModulesFrame(frames[i])) i++;
      const batch = frames.slice(start, i);
      groups.push({ frames: batch, collapsed: true, reason: 'node_modules', count: batch.length });
      continue;
    }

    if (collapseInternal && isInternalFrame(frame)) {
      const start = i;
      while (i < frames.length && isInternalFrame(frames[i])) i++;
      const batch = frames.slice(start, i);
      groups.push({ frames: batch, collapsed: true, reason: 'internal', count: batch.length });
      continue;
    }

    // detect repeating frame sequences
    const seqLen = detectRepeat(frames, i, maxRepeats);
    if (seqLen > 0) {
      const batch = frames.slice(i, i + seqLen);
      groups.push({ frames: batch, collapsed: true, reason: 'repeat', count: seqLen });
      i += seqLen;
      continue;
    }

    groups.push({ frames: [frame], collapsed: false, count: 1 });
    i++;
  }

  return groups;
}

function detectRepeat(frames: StackFrame[], start: number, maxRepeats: number): number {
  for (let len = 1; len <= Math.floor((frames.length - start) / 2); len++) {
    const pattern = frames.slice(start, start + len);
    let repeats = 1;
    let j = start + len;
    while (
      j + len <= frames.length &&
      pattern.every((f, k) => frames[j + k].file === f.file && frames[j + k].line === f.line)
    ) {
      repeats++;
      j += len;
    }
    if (repeats > maxRepeats) {
      return j - start;
    }
  }
  return 0;
}

export function unfoldAll(groups: FoldedGroup[]): StackFrame[] {
  return groups.flatMap(g => g.frames);
}
