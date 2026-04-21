import { StackFrame } from './parser';

export interface TocEntry {
  index: number;
  file: string;
  line: number;
  column: number;
  fn: string;
  isUserFrame: boolean;
}

export interface Toc {
  entries: TocEntry[];
  totalFrames: number;
  userFrameCount: number;
}

export function buildToc(frames: StackFrame[], userFrameIndices?: Set<number>): Toc {
  const entries: TocEntry[] = frames.map((frame, index) => ({
    index,
    file: frame.file ?? '(unknown)',
    line: frame.line ?? 0,
    column: frame.column ?? 0,
    fn: frame.fn ?? '(anonymous)',
    isUserFrame: userFrameIndices ? userFrameIndices.has(index) : !frame.file?.includes('node_modules'),
  }));

  const userFrameCount = entries.filter(e => e.isUserFrame).length;

  return { entries, totalFrames: frames.length, userFrameCount };
}

export function formatToc(toc: Toc, opts: { onlyUser?: boolean; maxEntries?: number } = {}): string {
  const { onlyUser = false, maxEntries } = opts;
  let entries = onlyUser ? toc.entries.filter(e => e.isUserFrame) : toc.entries;

  if (maxEntries !== undefined && maxEntries > 0) {
    entries = entries.slice(0, maxEntries);
  }

  if (entries.length === 0) {
    return '(no frames)';
  }

  const lines = entries.map(e => {
    const marker = e.isUserFrame ? '*' : ' ';
    const loc = e.line ? `:${e.line}` : '';
    return `  [${e.index}] ${marker} ${e.fn} (${e.file}${loc})`;
  });

  const header = `Table of Contents — ${toc.totalFrames} frame(s), ${toc.userFrameCount} user frame(s):`;
  return [header, ...lines].join('\n');
}

export function getTocEntry(toc: Toc, index: number): TocEntry | undefined {
  return toc.entries.find(e => e.index === index);
}
