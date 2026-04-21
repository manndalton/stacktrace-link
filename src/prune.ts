import { StackFrame } from './parser';

export interface PruneOptions {
  maxFrames?: number;
  removeNodeModules?: boolean;
  removeInternal?: boolean;
  removeAnonymous?: boolean;
  keepPatterns?: string[];
}

export function shouldPrune(frame: StackFrame, opts: PruneOptions): boolean {
  const { removeNodeModules, removeInternal, removeAnonymous, keepPatterns } = opts;

  if (keepPatterns && keepPatterns.length > 0) {
    const kept = keepPatterns.some(p => frame.file?.includes(p));
    if (kept) return false;
  }

  if (removeAnonymous && (!frame.file || frame.file === '<anonymous>')) {
    return true;
  }

  if (removeNodeModules && frame.file?.includes('node_modules')) {
    return true;
  }

  if (removeInternal && frame.file?.startsWith('node:')) {
    return true;
  }

  return false;
}

export function pruneFrames(frames: StackFrame[], opts: PruneOptions): StackFrame[] {
  let result = frames.filter(f => !shouldPrune(f, opts));

  if (opts.maxFrames !== undefined && opts.maxFrames > 0) {
    result = result.slice(0, opts.maxFrames);
  }

  return result;
}

export function buildPruneOptions(args: Record<string, unknown>): PruneOptions {
  return {
    maxFrames: typeof args.maxFrames === 'number' ? args.maxFrames : undefined,
    removeNodeModules: Boolean(args.removeNodeModules),
    removeInternal: Boolean(args.removeInternal),
    removeAnonymous: Boolean(args.removeAnonymous),
    keepPatterns: Array.isArray(args.keepPatterns)
      ? (args.keepPatterns as string[])
      : [],
  };
}
