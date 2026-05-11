import { sliceFrames, takeFirst, takeLast, parseSliceExpr } from './slice';
import { StackFrame } from './parser';

function makeFrame(file: string, line: number): StackFrame {
  return { file, line, column: 1, fn: 'fn', raw: '' };
}

const frames: StackFrame[] = [
  makeFrame('a.ts', 1),
  makeFrame('b.ts', 2),
  makeFrame('c.ts', 3),
  makeFrame('d.ts', 4),
  makeFrame('e.ts', 5),
];

describe('sliceFrames', () => {
  it('returns all frames with default options', () => {
    expect(sliceFrames(frames, {})).toEqual(frames);
  });

  it('slices by start and end', () => {
    const result = sliceFrames(frames, { start: 1, end: 3 });
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe('b.ts');
    expect(result[1].file).toBe('c.ts');
  });

  it('handles negative start', () => {
    const result = sliceFrames(frames, { start: -2 });
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe('d.ts');
  });

  it('handles negative end', () => {
    const result = sliceFrames(frames, { end: -1 });
    expect(result).toHaveLength(4);
    expect(result[3].file).toBe('d.ts');
  });

  it('limits by count from top', () => {
    const result = sliceFrames(frames, { count: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe('a.ts');
  });

  it('limits by count from bottom', () => {
    const result = sliceFrames(frames, { count: 2, fromBottom: true });
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe('d.ts');
  });

  it('returns empty array for empty input', () => {
    expect(sliceFrames([], { start: 0, end: 5 })).toEqual([]);
  });
});

describe('takeFirst', () => {
  it('takes first N frames', () => {
    expect(takeFirst(frames, 3)).toHaveLength(3);
    expect(takeFirst(frames, 3)[2].file).toBe('c.ts');
  });

  it('handles n=0', () => {
    expect(takeFirst(frames, 0)).toHaveLength(0);
  });
});

describe('takeLast', () => {
  it('takes last N frames', () => {
    const result = takeLast(frames, 2);
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe('d.ts');
  });
});

describe('parseSliceExpr', () => {
  it('parses "0:3"', () => {
    expect(parseSliceExpr('0:3')).toEqual({ start: 0, end: 3 });
  });

  it('parses ":3"', () => {
    expect(parseSliceExpr(':3')).toEqual({ start: undefined, end: 3 });
  });

  it('parses "2:"', () => {
    expect(parseSliceExpr('2:')).toEqual({ start: 2, end: undefined });
  });

  it('parses a bare number as end', () => {
    expect(parseSliceExpr('4')).toEqual({ start: 0, end: 4 });
  });

  it('parses a negative bare number as start', () => {
    expect(parseSliceExpr('-2')).toEqual({ start: -2 });
  });

  it('throws on invalid expression', () => {
    expect(() => parseSliceExpr('abc')).toThrow();
  });
});
