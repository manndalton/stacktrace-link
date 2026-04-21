import { pivotFrames, formatPivot, topPivotKey, PivotField } from './pivot';
import { StackFrame } from './parser';

function makeFrame(file: string, fn: string, line = 1): StackFrame {
  return { file, fn, line, col: 1, raw: '' };
}

const frames: StackFrame[] = [
  makeFrame('/app/src/foo.ts', 'foo', 10),
  makeFrame('/app/src/foo.ts', 'bar', 20),
  makeFrame('/app/src/baz.ts', 'baz', 5),
  makeFrame('/app/node_modules/express/index.js', 'handle', 42),
  makeFrame('/app/node_modules/express/router.js', 'dispatch', 7),
  makeFrame('/app/node_modules/lodash/lodash.js', 'map', 99),
];

describe('pivotFrames', () => {
  it('pivots by file', () => {
    const result = pivotFrames(frames, 'file');
    const keys = result.map(e => e.key);
    expect(keys).toContain('/app/src/foo.ts');
    const fooEntry = result.find(e => e.key === '/app/src/foo.ts')!;
    expect(fooEntry.count).toBe(2);
  });

  it('pivots by function', () => {
    const result = pivotFrames(frames, 'function');
    expect(result.every(e => e.count >= 1)).toBe(true);
    expect(result.find(e => e.key === 'foo')).toBeDefined();
  });

  it('pivots by package', () => {
    const result = pivotFrames(frames, 'package');
    const expressEntry = result.find(e => e.key === 'express')!;
    expect(expressEntry.count).toBe(2);
    const userEntry = result.find(e => e.key === '(user)')!;
    expect(userEntry.count).toBe(3);
  });

  it('sorts by count descending', () => {
    const result = pivotFrames(frames, 'package');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
    }
  });

  it('returns empty array for no frames', () => {
    expect(pivotFrames([], 'file')).toEqual([]);
  });
});

describe('formatPivot', () => {
  it('returns message for empty entries', () => {
    expect(formatPivot([], 'file')).toBe('No frames to pivot.');
  });

  it('includes field name in header', () => {
    const entries = pivotFrames(frames, 'package');
    const output = formatPivot(entries, 'package');
    expect(output).toContain('Pivot by package');
  });

  it('includes frame details', () => {
    const entries = pivotFrames(frames, 'file');
    const output = formatPivot(entries, 'file');
    expect(output).toContain('/app/src/foo.ts');
    expect(output).toContain('foo');
  });
});

describe('topPivotKey', () => {
  it('returns null for empty entries', () => {
    expect(topPivotKey([])).toBeNull();
  });

  it('returns the key with the highest count', () => {
    const entries = pivotFrames(frames, 'package');
    expect(topPivotKey(entries)).toBe('(user)');
  });
});
