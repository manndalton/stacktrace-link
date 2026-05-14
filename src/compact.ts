import { StackFrame } from './parser';

export interface CompactOptions {
  maxLength?: number;
  showLineCol?: boolean;
  separator?: string;
}

const DEFAULT_OPTIONS: Required<CompactOptions> = {
  maxLength: 80,
  showLineCol: true,
  separator: ' › ',
};

export function compactFrame(frame: StackFrame, opts: CompactOptions = {}): string {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const loc = o.showLineCol
    ? `:${frame.line}${frame.column !== undefined ? `:${frame.column}` : ''}`
    : '';
  const file = frame.file + loc;
  const fn = frame.function ?? '<anonymous>';
  const raw = `${fn}${o.separator}${file}`;
  if (raw.length <= o.maxLength) return raw;
  const budget = o.maxLength - fn.length - o.separator.length - 3;
  const truncated = budget > 0 ? '...' + file.slice(file.length - budget) : '...';
  return `${fn}${o.separator}${truncated}`;
}

export function compactFrames(frames: StackFrame[], opts: CompactOptions = {}): string[] {
  return frames.map(f => compactFrame(f, opts));
}

export function formatCompact(frames: StackFrame[], opts: CompactOptions = {}): string {
  return compactFrames(frames, opts).join('\n');
}
