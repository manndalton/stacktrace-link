import { StackFrame } from './parser';

export interface StripOptions {
  nodeModules?: boolean;
  internals?: boolean;
  anonymousFrames?: boolean;
  customPatterns?: RegExp[];
}

export function shouldStripFrame(frame: StackFrame, opts: StripOptions): boolean {
  if (opts.nodeModules && frame.file?.includes('node_modules')) {
    return true;
  }

  if (opts.internals && isInternalFrame(frame)) {
    return true;
  }

  if (opts.anonymousFrames && (!frame.file || frame.file === '<anonymous>')) {
    return true;
  }

  if (opts.customPatterns) {
    for (const pattern of opts.customPatterns) {
      if (frame.file && pattern.test(frame.file)) {
        return true;
      }
    }
  }

  return false;
}

export function stripFrames(frames: StackFrame[], opts: StripOptions): StackFrame[] {
  return frames.filter((frame) => !shouldStripFrame(frame, opts));
}

export function buildStripOptions(args: Record<string, unknown>): StripOptions {
  const opts: StripOptions = {};

  if (args.nodeModules) opts.nodeModules = true;
  if (args.internals) opts.internals = true;
  if (args.anonymous) opts.anonymousFrames = true;

  if (typeof args.pattern === 'string') {
    opts.customPatterns = [new RegExp(args.pattern)];
  } else if (Array.isArray(args.pattern)) {
    opts.customPatterns = (args.pattern as string[]).map((p) => new RegExp(p));
  }

  return opts;
}

function isInternalFrame(frame: StackFrame): boolean {
  if (!frame.file) return false;
  return (
    frame.file.startsWith('node:') ||
    frame.file.startsWith('internal/') ||
    /^[a-zA-Z]+\.js$/.test(frame.file)
  );
}

export function countStripped(original: StackFrame[], stripped: StackFrame[]): number {
  return original.length - stripped.length;
}
