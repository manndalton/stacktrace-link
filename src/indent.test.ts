import { describe, it, expect } from 'vitest';
import { indentFrame, indentFrames, formatIndented, detectMaxDepth } from './indent';
import { StackFrame } from './parser';

function makeFrame(fn: string, file = '/app/src/foo.ts', line = 10, column = 5): StackFrame {
  return { functionName: fn, file, line, column };
}

describe('indentFrame', () => {
  it('indents at depth 0 with no leading spaces by default', () => {
    const f = makeFrame('main');
    expect(indentFrame(f, 0)).toBe('at main (/app/src/foo.ts:10:5)');
  });

  it('indents deeper frames', () => {
    const f = makeFrame('helper');
    const result = indentFrame(f, 2);
    expect(result.startsWith('    at helper')).toBe(true);
  });

  it('respects custom stepSize', () => {
    const f = makeFrame('fn');
    const result = indentFrame(f, 1, { stepSize: 4 });
    expect(result.startsWith('    at fn')).toBe(true);
  });

  it('clamps to maxDepth', () => {
    const f = makeFrame('fn');
    const r1 = indentFrame(f, 100, { maxDepth: 3, stepSize: 2 });
    const r2 = indentFrame(f, 3, { maxDepth: 3, stepSize: 2 });
    expect(r1).toBe(r2);
  });

  it('handles missing functionName', () => {
    const f: StackFrame = { file: '/a.ts', line: 1, column: 1 };
    expect(indentFrame(f, 0)).toContain('<anonymous>');
  });

  it('handles missing file', () => {
    const f: StackFrame = { functionName: 'x' };
    expect(indentFrame(f, 0)).toContain('<unknown>');
  });
});

describe('indentFrames', () => {
  it('returns one string per frame', () => {
    const frames = [makeFrame('a'), makeFrame('b'), makeFrame('c')];
    const result = indentFrames(frames);
    expect(result).toHaveLength(3);
    expect(result[1].startsWith('  at b')).toBe(true);
  });
});

describe('formatIndented', () => {
  it('joins lines with newline', () => {
    const frames = [makeFrame('a'), makeFrame('b')];
    const out = formatIndented(frames);
    expect(out.split('\n')).toHaveLength(2);
  });
});

describe('detectMaxDepth', () => {
  it('returns frames.length - 1', () => {
    expect(detectMaxDepth([makeFrame('a'), makeFrame('b'), makeFrame('c')])).toBe(2);
  });

  it('returns 0 for empty', () => {
    expect(detectMaxDepth([])).toBe(0);
  });
});
