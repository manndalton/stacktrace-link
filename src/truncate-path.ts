import * as path from 'path';

export interface TruncatePathOptions {
  maxLength?: number;
  separator?: string;
  keepFilename?: boolean;
}

const DEFAULT_MAX = 60;
const ELLIPSIS = '…';

export function truncatePath(
  filePath: string,
  options: TruncatePathOptions = {}
): string {
  const { maxLength = DEFAULT_MAX, separator = path.sep, keepFilename = true } = options;

  if (filePath.length <= maxLength) return filePath;

  const parts = filePath.split(/[\/\\]/);
  if (parts.length <= 1) {
    return filePath.slice(0, maxLength - 1) + ELLIPSIS;
  }

  const filename = parts[parts.length - 1];
  if (keepFilename && filename.length >= maxLength - 3) {
    return ELLIPSIS + separator + filename.slice(0, maxLength - 4) + ELLIPSIS;
  }

  // Try to keep the first and last parts
  const first = parts[0];
  const last = keepFilename ? filename : parts[parts.length - 1];
  const middle = ELLIPSIS;
  const candidate = [first, middle, last].join(separator);

  if (candidate.length <= maxLength) return candidate;

  // Last resort: just trim from left
  const trimmed = filePath.slice(filePath.length - (maxLength - 1));
  return ELLIPSIS + trimmed;
}

export function truncatePathList(
  paths: string[],
  options: TruncatePathOptions = {}
): string[] {
  return paths.map((p) => truncatePath(p, options));
}

export function shortenCwd(filePath: string, cwd: string = process.cwd()): string {
  if (filePath.startsWith(cwd)) {
    const rel = filePath.slice(cwd.length);
    return rel.startsWith(path.sep) ? rel.slice(1) : rel;
  }
  return filePath;
}
