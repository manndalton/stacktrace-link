import { parseSortConfig, sortFrames, sortByMultiple } from './sorter';
import { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return { file: 'index.ts', line: 1, col: 1, fn: 'anonymous', index: 0, ...overrides };
}

describe('parseSortConfig', () => {
  it('parses field only, defaults to asc', () => {
    expect(parseSortConfig('file')).toEqual({ field: 'file', order: 'asc' });
  });

  it('parses field:order', () => {
    expect(parseSortConfig('line:desc')).toEqual({ field: 'line', order: 'desc' });
  });

  it('throws on invalid field', () => {
    expect(() => parseSortConfig('unknown')).toThrow('Invalid sort field');
  });

  it('defaults order to asc for unknown order value', () => {
    expect(parseSortConfig('file:sideways')).toEqual({ field: 'file', order: 'asc' });
  });
});

describe('sortFrames', () => {
  const frames = [
    makeFrame({ file: 'b.ts', line: 10, fn: 'beta', index: 1 }),
    makeFrame({ file: 'a.ts', line: 5, fn: 'alpha', index: 0 }),
    makeFrame({ file: 'c.ts', line: 1, fn: 'gamma', index: 2 }),
  ];

  it('sorts by file asc', () => {
    const result = sortFrames(frames, { field: 'file', order: 'asc' });
    expect(result.map(f => f.file)).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('sorts by line desc', () => {
    const result = sortFrames(frames, { field: 'line', order: 'desc' });
    expect(result.map(f => f.line)).toEqual([10, 5, 1]);
  });

  it('sorts by function asc', () => {
    const result = sortFrames(frames, { field: 'function', order: 'asc' });
    expect(result.map(f => f.fn)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('sorts by index asc', () => {
    const result = sortFrames(frames, { field: 'index', order: 'asc' });
    expect(result.map(f => f.index)).toEqual([0, 1, 2]);
  });

  it('does not mutate original array', () => {
    const original = [...frames];
    sortFrames(frames, { field: 'file', order: 'asc' });
    expect(frames).toEqual(original);
  });
});

describe('sortByMultiple', () => {
  it('returns frames unchanged when no configs given', () => {
    const frames = [makeFrame({ index: 2 }), makeFrame({ index: 0 })];
    expect(sortByMultiple(frames, [])).toEqual(frames);
  });

  it('applies multiple sort configs in order', () => {
    const frames = [
      makeFrame({ file: 'a.ts', line: 20, index: 0 }),
      makeFrame({ file: 'a.ts', line: 5, index: 1 }),
      makeFrame({ file: 'b.ts', line: 1, index: 2 }),
    ];
    const result = sortByMultiple(frames, [
      { field: 'file', order: 'asc' },
      { field: 'line', order: 'asc' },
    ]);
    expect(result.map(f => f.line)).toEqual([5, 20, 1]);
  });
});
