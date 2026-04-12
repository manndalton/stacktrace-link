import { StackFrame } from './parser';

export interface TruncateOptions {
  maxFrames?: number;
  maxLineLength?: number;
  ellipsis?: string;
}

const DEFAULT_MAX_FRAMES = 10;
const DEFAULT_MAX_LINE_LENGTH = 120;
const DEFAULT_ELLIPSIS = '...';

export function truncateFrames(
  frames: StackFrame[],
  options: TruncateOptions = {}
): { frames: StackFrame[]; truncated: number } {
  const maxFrames = options.maxFrames ?? DEFAULT_MAX_FRAMES;
  if (frames.length <= maxFrames) {
    return { frames, truncated: 0 };
  }
  return {
    frames: frames.slice(0, maxFrames),
    truncated: frames.length - maxFrames,
  };
}

export function truncateLine(
  line: string,
  options: TruncateOptions = {}
): string {
  const maxLen = options.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH;
  const ellipsis = options.ellipsis ?? DEFAULT_ELLIPSIS;
  if (line.length <= maxLen) return line;
  return line.slice(0, maxLen - ellipsis.length) + ellipsis;
}

export function truncateFilePath(
  filePath: string,
  maxSegments = 4
): string {
  const parts = filePath.split('/');
  if (parts.length <= maxSegments) return filePath;
  return '.../' + parts.slice(parts.length - (maxSegments - 1)).join('/');
}

export function formatTruncationNotice(count: number): string {
  return `  ... ${count} more frame${count === 1 ? '' : 's'} omitted`;
}
