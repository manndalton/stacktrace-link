import { wrapFilePath, wrapFrameLine, wrapFrames } from './wrap';
import type { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    functionName: 'myFunction',
    file: '/home/user/project/src/index.ts',
    line: 42,
    column: 7,
    ...overrides,
  };
}

describe('wrapFilePath', () => {
  it('returns single element when path fits', () => {
    const result = wrapFilePath('/short/path.ts', 80);
    expect(result).toEqual(['/short/path.ts']);
  });

  it('splits long path into multiple lines', () => {
    const longPath = '/very/long/directory/structure/that/exceeds/the/max/width/file.ts';
    const result = wrapFilePath(longPath, 30);
    expect(result.length).toBeGreaterThan(1);
    result.slice(0, -1).forEach(line => {
      expect(line.endsWith('/')).toBe(true);
    });
  });

  it('handles path shorter than maxWidth exactly', () => {
    const path = '/a/b/c.ts';
    const result = wrapFilePath(path, path.length);
    expect(result).toEqual([path]);
  });
});

describe('wrapFrameLine', () => {
  it('returns single line when frame fits within maxWidth', () => {
    const frame = makeFrame({ file: '/src/x.ts', line: 1, column: 1, functionName: 'fn' });
    const result = wrapFrameLine(frame, { maxWidth: 120 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^at fn/);
  });

  it('wraps long frame into two lines', () => {
    const frame = makeFrame({
      functionName: 'reallyLongFunctionNameThatWontFit',
      file: '/home/user/project/src/deeply/nested/module.ts',
      line: 100,
      column: 5,
    });
    const result = wrapFrameLine(frame, { maxWidth: 40 });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toMatch(/^at /);
  });

  it('uses anonymous when functionName is missing', () => {
    const frame = makeFrame({ functionName: undefined, file: '/a.ts', line: 1 });
    const result = wrapFrameLine(frame, { maxWidth: 120 });
    expect(result[0]).toContain('<anonymous>');
  });

  it('respects custom indent', () => {
    const frame = makeFrame({ functionName: 'f', file: '/a/b/c/d/e/f/g/h/i/j/k/l/m/n.ts', line: 9 });
    const result = wrapFrameLine(frame, { maxWidth: 30, indent: 8 });
    if (result.length > 1) {
      expect(result[1].startsWith('        ')).toBe(true);
    }
  });
});

describe('wrapFrames', () => {
  it('wraps multiple frames', () => {
    const frames = [
      makeFrame({ functionName: 'a', file: '/a.ts', line: 1 }),
      makeFrame({ functionName: 'b', file: '/b.ts', line: 2 }),
    ];
    const result = wrapFrames(frames, { maxWidth: 120 });
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array for empty input', () => {
    expect(wrapFrames([])).toEqual([]);
  });
});
