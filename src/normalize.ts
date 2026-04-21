import * as path from 'path';
import { StackFrame } from './parser';

export interface NormalizeOptions {
  cwd?: string;
  stripPrefix?: string;
  toPosix?: boolean;
}

/**
 * Convert backslashes to forward slashes.
 */
export function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Make an absolute file path relative to a base directory.
 */
export function toRelativePath(filePath: string, base: string): string {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);
  return path.relative(base, abs);
}

/**
 * Strip a leading prefix string from a file path.
 */
export function stripPrefix(filePath: string, prefix: string): string {
  if (filePath.startsWith(prefix)) {
    return filePath.slice(prefix.length);
  }
  return filePath;
}

/**
 * Normalize a single frame's file path according to options.
 */
export function normalizeFrame(frame: StackFrame, opts: NormalizeOptions = {}): StackFrame {
  if (!frame.file) return frame;

  let file = frame.file;

  if (opts.toPosix) {
    file = toPosixPath(file);
  }

  if (opts.stripPrefix) {
    file = stripPrefix(file, opts.stripPrefix);
  }

  if (opts.cwd && path.isAbsolute(file)) {
    file = toRelativePath(file, opts.cwd);
    if (opts.toPosix) file = toPosixPath(file);
  }

  return { ...frame, file };
}

/**
 * Normalize all frames in a stack trace.
 */
export function normalizeFrames(frames: StackFrame[], opts: NormalizeOptions = {}): StackFrame[] {
  return frames.map(f => normalizeFrame(f, opts));
}
