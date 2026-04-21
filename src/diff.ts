import { parseStackTrace } from './parser';
import { diffSnapshots, formatDiff, SnapshotDiff } from './snapshot-diff';
import { loadSnapshot, listSnapshots } from './snapshot';

export interface DiffResult {
  idA: string;
  idB: string;
  diff: SnapshotDiff;
  formattedAt: string;
}

export async function diffById(idA: string, idB: string): Promise<DiffResult> {
  const snapA = await loadSnapshot(idA);
  const snapB = await loadSnapshot(idB);

  if (!snapA) throw new Error(`Snapshot not found: ${idA}`);
  if (!snapB) throw new Error(`Snapshot not found: ${idB}`);

  const framesA = parseStackTrace(snapA.content);
  const framesB = parseStackTrace(snapB.content);
  const diff = diffSnapshots(framesA, framesB);

  return { idA, idB, diff, formattedAt: new Date().toISOString() };
}

export async function diffLatestTwo(): Promise<DiffResult | null> {
  const snapshots = await listSnapshots();
  if (snapshots.length < 2) return null;
  const sorted = [...snapshots].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return diffById(sorted[1].id, sorted[0].id);
}

export function formatDiffResult(result: DiffResult): string {
  const lines: string[] = [
    `Diff: ${result.idA} → ${result.idB}`,
    `Generated: ${result.formattedAt}`,
    '',
    formatDiff(result.diff),
  ];
  return lines.join('\n');
}

export function diffResultToJson(result: DiffResult): string {
  return JSON.stringify(
    {
      idA: result.idA,
      idB: result.idB,
      formattedAt: result.formattedAt,
      added: result.diff.added,
      removed: result.diff.removed,
      unchanged: result.diff.unchanged,
    },
    null,
    2
  );
}
