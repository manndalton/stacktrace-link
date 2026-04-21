import { StackFrame } from './parser';

export type TransformFn = (frame: StackFrame) => StackFrame;

export interface TransformConfig {
  transforms: string[];
}

export function applyTransform(frame: StackFrame, fn: TransformFn): StackFrame {
  return fn(frame);
}

export function applyTransforms(frames: StackFrame[], fns: TransformFn[]): StackFrame[] {
  return frames.map(frame => fns.reduce((f, fn) => applyTransform(f, fn), frame));
}

export function makeRenameTransform(from: string, to: string): TransformFn {
  return (frame) => ({
    ...frame,
    file: frame.file.replace(from, to),
  });
}

export function makePrefixTransform(prefix: string): TransformFn {
  return (frame) => ({
    ...frame,
    file: frame.file.startsWith(prefix) ? frame.file : prefix + frame.file,
  });
}

export function makeStripTransform(strip: string): TransformFn {
  return (frame) => ({
    ...frame,
    file: frame.file.replace(strip, ''),
  });
}

export function buildTransformPipeline(configs: TransformConfig[]): TransformFn[] {
  const fns: TransformFn[] = [];
  for (const cfg of configs) {
    for (const t of cfg.transforms) {
      const [type, ...args] = t.split(':');
      if (type === 'rename' && args.length === 2) {
        fns.push(makeRenameTransform(args[0], args[1]));
      } else if (type === 'prefix' && args.length === 1) {
        fns.push(makePrefixTransform(args[0]));
      } else if (type === 'strip' && args.length === 1) {
        fns.push(makeStripTransform(args[0]));
      }
    }
  }
  return fns;
}
