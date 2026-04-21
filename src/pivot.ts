import { StackFrame } from './parser';

export interface PivotEntry {
  key: string;
  frames: StackFrame[];
  count: number;
}

export type PivotField = 'file' | 'function' | 'package';

function getPackage(frame: StackFrame): string {
  const match = frame.file.match(/node_modules[\\/]([^\\/]+)/);
  return match ? match[1] : '(user)';
}

function getFieldValue(frame: StackFrame, field: PivotField): string {
  switch (field) {
    case 'file':
      return frame.file || '(unknown)';
    case 'function':
      return frame.fn || '(anonymous)';
    case 'package':
      return getPackage(frame);
  }
}

export function pivotFrames(
  frames: StackFrame[],
  field: PivotField
): PivotEntry[] {
  const map = new Map<string, StackFrame[]>();

  for (const frame of frames) {
    const key = getFieldValue(frame, field);
    const existing = map.get(key);
    if (existing) {
      existing.push(frame);
    } else {
      map.set(key, [frame]);
    }
  }

  return Array.from(map.entries())
    .map(([key, fs]) => ({ key, frames: fs, count: fs.length }))
    .sort((a, b) => b.count - a.count);
}

export function formatPivot(entries: PivotEntry[], field: PivotField): string {
  if (entries.length === 0) return 'No frames to pivot.';
  const lines: string[] = [`Pivot by ${field}:`, ''];
  for (const entry of entries) {
    lines.push(`  ${entry.key} (${entry.count} frame${entry.count !== 1 ? 's' : ''})`);
    for (const f of entry.frames) {
      const loc = f.line != null ? `:${f.line}` : '';
      lines.push(`    at ${f.fn || '(anonymous)'} (${f.file}${loc})`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

export function topPivotKey(entries: PivotEntry[]): string | null {
  return entries.length > 0 ? entries[0].key : null;
}
