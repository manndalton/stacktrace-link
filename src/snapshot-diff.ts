import { Snapshot } from './snapshot';
import { StackFrame } from './parser';

export interface FrameDiff {
  status: 'added' | 'removed' | 'changed' | 'same';
  before?: StackFrame;
  after?: StackFrame;
}

export interface SnapshotDiff {
  beforeId: string;
  afterId: string;
  diffs: FrameDiff[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
}

function frameKey(f: StackFrame): string {
  return `${f.file}:${f.line}:${f.column}:${f.fn ?? ''}`;
}

export function diffSnapshots(before: Snapshot, after: Snapshot): SnapshotDiff {
  const beforeMap = new Map(before.frames.map(f => [frameKey(f), f]));
  const afterMap  = new Map(after.frames.map(f => [frameKey(f), f]));

  const diffs: FrameDiff[] = [];

  for (const [key, bf] of beforeMap) {
    if (afterMap.has(key)) {
      diffs.push({ status: 'same', before: bf, after: afterMap.get(key) });
    } else {
      diffs.push({ status: 'removed', before: bf });
    }
  }

  for (const [key, af] of afterMap) {
    if (!beforeMap.has(key)) {
      // Check if same file+fn but different line (changed)
      const changed = [...beforeMap.values()].find(
        b => b.file === af.file && b.fn === af.fn
      );
      if (changed) {
        diffs.push({ status: 'changed', before: changed, after: af });
      } else {
        diffs.push({ status: 'added', after: af });
      }
    }
  }

  return {
    beforeId: before.id,
    afterId: after.id,
    diffs,
    addedCount:   diffs.filter(d => d.status === 'added').length,
    removedCount: diffs.filter(d => d.status === 'removed').length,
    changedCount: diffs.filter(d => d.status === 'changed').length,
  };
}

export function formatDiff(diff: SnapshotDiff): string {
  const lines: string[] = [
    `diff ${diff.beforeId} → ${diff.afterId}`,
    `  +${diff.addedCount} added  -${diff.removedCount} removed  ~${diff.changedCount} changed`,
  ];
  for (const d of diff.diffs) {
    if (d.status === 'same') continue;
    const sym = d.status === 'added' ? '+' : d.status === 'removed' ? '-' : '~';
    const frame = d.after ?? d.before!;
    lines.push(`  ${sym} ${frame.fn ?? '<anon>'} ${frame.file}:${frame.line}`);
  }
  return lines.join('\n');
}
