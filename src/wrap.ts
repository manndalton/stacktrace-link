import { StackFrame } from './parser';

export interface WrapOptions {
  maxWidth?: number;
  indent?: number;
  ellipsis?: string;
}

const DEFAULT_MAX_WIDTH = 120;
const DEFAULT_INDENT = 4;
const DEFAULT_ELLIPSIS = '...';

export function wrapFilePath(filePath: string, maxWidth: number): string[] {
  if (filePath.length <= maxWidth) return [filePath];
  const segments = filePath.split('/');
  const lines: string[] = [];
  let current = '';
  for (const seg of segments) {
    const next = current ? `${current}/${seg}` : seg;
    if (next.length > maxWidth && current) {
      lines.push(current + '/');
      current = seg;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function wrapFrameLine(frame: StackFrame, opts: WrapOptions = {}): string[] {
  const maxWidth = opts.maxWidth ?? DEFAULT_MAX_WIDTH;
  const indent = opts.indent ?? DEFAULT_INDENT;
  const ellipsis = opts.ellipsis ?? DEFAULT_ELLIPSIS;
  const pad = ' '.repeat(indent);

  const location = `${frame.file}:${frame.line}:${frame.column ?? 0}`;
  const fn = frame.functionName ?? '<anonymous>';
  const full = `at ${fn} (${location})`;

  if (full.length <= maxWidth) return [full];

  const header = `at ${fn}`;
  const locLine = `${pad}(${location})`;

  if (locLine.length > maxWidth) {
    const pathLines = wrapFilePath(frame.file, maxWidth - indent - 2);
    const wrapped = pathLines.map((l, i) => (i === 0 ? `${pad}(${l}` : `${pad} ${l}`));
    const last = wrapped[wrapped.length - 1];
    wrapped[wrapped.length - 1] = `${last}:${frame.line})`;
    return [header, ...wrapped];
  }

  if (header.length > maxWidth) {
    const truncated = fn.slice(0, maxWidth - ellipsis.length - 3);
    return [`at ${truncated}${ellipsis}`, locLine];
  }

  return [header, locLine];
}

export function wrapFrames(frames: StackFrame[], opts: WrapOptions = {}): string[] {
  return frames.flatMap(f => wrapFrameLine(f, opts));
}
