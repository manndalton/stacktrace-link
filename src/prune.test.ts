import { pruneFrames, shouldPrune, buildPruneOptions } from './prune';
import { StackFrame } from './parser';

function makeFrame(file: string, fn?: string): StackFrame {
  return { file, line: 1, column: 1, fn: fn ?? 'fn' };
}

describe('shouldPrune', () => {
  it('returns false when no options set', () => {
    const f = makeFrame('/app/src/index.ts');
    expect(shouldPrune(f, {})).toBe(false);
  });

  it('prunes node_modules when removeNodeModules is true', () => {
    const f = makeFrame('/app/node_modules/lodash/index.js');
    expect(shouldPrune(f, { removeNodeModules: true })).toBe(true);
  });

  it('prunes internal node: frames when removeInternal is true', () => {
    const f = makeFrame('node:fs');
    expect(shouldPrune(f, { removeInternal: true })).toBe(true);
  });

  it('prunes anonymous frames when removeAnonymous is true', () => {
    const f = makeFrame('<anonymous>');
    expect(shouldPrune(f, { removeAnonymous: true })).toBe(true);
  });

  it('keeps frame matching keepPatterns even if it would be pruned', () => {
    const f = makeFrame('/app/node_modules/my-lib/index.js');
    expect(shouldPrune(f, { removeNodeModules: true, keepPatterns: ['my-lib'] })).toBe(false);
  });

  it('does not prune user frame when removeNodeModules is true', () => {
    const f = makeFrame('/app/src/utils.ts');
    expect(shouldPrune(f, { removeNodeModules: true })).toBe(false);
  });
});

describe('pruneFrames', () => {
  const frames = [
    makeFrame('/app/src/index.ts'),
    makeFrame('/app/node_modules/express/index.js'),
    makeFrame('node:events'),
    makeFrame('<anonymous>'),
    makeFrame('/app/src/server.ts'),
  ];

  it('removes node_modules and internal frames', () => {
    const result = pruneFrames(frames, { removeNodeModules: true, removeInternal: true });
    expect(result.map(f => f.file)).toEqual([
      '/app/src/index.ts',
      '<anonymous>',
      '/app/src/server.ts',
    ]);
  });

  it('respects maxFrames', () => {
    const result = pruneFrames(frames, { maxFrames: 2 });
    expect(result).toHaveLength(2);
  });

  it('applies all options together', () => {
    const result = pruneFrames(frames, {
      removeNodeModules: true,
      removeInternal: true,
      removeAnonymous: true,
      maxFrames: 1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('/app/src/index.ts');
  });
});

describe('buildPruneOptions', () => {
  it('builds options from args', () => {
    const opts = buildPruneOptions({
      maxFrames: 10,
      removeNodeModules: true,
      keepPatterns: ['my-lib'],
    });
    expect(opts.maxFrames).toBe(10);
    expect(opts.removeNodeModules).toBe(true);
    expect(opts.keepPatterns).toEqual(['my-lib']);
  });

  it('defaults keepPatterns to empty array', () => {
    const opts = buildPruneOptions({});
    expect(opts.keepPatterns).toEqual([]);
  });
});
