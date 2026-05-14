import { describe, it, expect } from 'vitest';
import {
  flattenFrames,
  isNativeFrame,
  flattenToStrings,
  countNativeFrames,
} from './flatten';
import { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    functionName: 'fn',
    file: '/app/src/index.ts',
    line: 1,
    column: 1,
    ...overrides,
  };
}

describe('isNativeFrame', () => {
  it('detects native frames', () => {
    expect(isNativeFrame(makeFrame({ file: 'native' }))).toBe(true);
    expect(isNativeFrame(makeFrame({ file: '<anonymous>' }))).toBe(true);
    expect(isNativeFrame(makeFrame({ file: 'node:fs' }))).toBe(true);
  });

  it('returns false for user frames', () => {
    expect(isNativeFrame(makeFrame({ file: '/app/src/index.ts' }))).toBe(false);
  });
});

describe('flattenFrames', () => {
  const frames = [
    makeFrame({ file: '/app/src/a.ts', line: 10 }),
    makeFrame({ file: 'native', line: 1 }),
    makeFrame({ file: '/app/src/b.ts', line: 20 }),
    makeFrame({ file: '/app/src/a.ts', line: 10 }),
  ];

  it('excludes native frames by default', () => {
    const result = flattenFrames(frames);
    expect(result.every((f) => !isNativeFrame(f))).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('includes native frames when option is set', () => {
    const result = flattenFrames(frames, { includeNative: true });
    expect(result).toHaveLength(4);
  });

  it('respects maxDepth', () => {
    const result = flattenFrames(frames, { maxDepth: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('/app/src/a.ts');
  });

  it('deduplicates frames when dedupe is true', () => {
    const result = flattenFrames(frames, { dedupe: true });
    expect(result).toHaveLength(2);
  });
});

describe('flattenToStrings', () => {
  it('formats frames as strings', () => {
    const frames = [makeFrame({ functionName: 'myFn', file: '/a.ts', line: 5, column: 3 })];
    expect(flattenToStrings(frames)).toEqual(['myFn (/a.ts:5:3)']);
  });

  it('omits function name when absent', () => {
    const frames = [makeFrame({ functionName: undefined, file: '/a.ts', line: 2, column: 1 })];
    expect(flattenToStrings(frames)).toEqual(['/a.ts:2:1']);
  });
});

describe('countNativeFrames', () => {
  it('counts native frames correctly', () => {
    const frames = [
      makeFrame({ file: '/app/src/a.ts' }),
      makeFrame({ file: 'native' }),
      makeFrame({ file: 'node:events' }),
    ];
    expect(countNativeFrames(frames)).toBe(2);
  });
});
