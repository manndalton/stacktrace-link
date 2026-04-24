import { filterByDepth, frameAtDepth, formatDepthLabel, getFrameDepth, stackDepth } from './depth';
import { StackFrame } from './parser';

function makeFrame(file: string, line: number): StackFrame {
  return { file, line, column: 1, fn: 'fn', raw: `at fn (${file}:${line}:1)` };
}

const frames: StackFrame[] = [
  makeFrame('/app/a.ts', 10),
  makeFrame('/app/b.ts', 20),
  makeFrame('/app/c.ts', 30),
  makeFrame('/app/d.ts', 40),
  makeFrame('/app/e.ts', 50),
];

describe('getFrameDepth', () => {
  it('returns index of frame', () => {
    expect(getFrameDepth(frames, frames[0])).toBe(0);
    expect(getFrameDepth(frames, frames[4])).toBe(4);
  });

  it('returns -1 for missing frame', () => {
    expect(getFrameDepth(frames, makeFrame('/other.ts', 1))).toBe(-1);
  });
});

describe('filterByDepth', () => {
  it('limits to maxDepth', () => {
    const result = filterByDepth(frames, { maxDepth: 2 });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(frames[0]);
  });

  it('applies minDepth', () => {
    const result = filterByDepth(frames, { minDepth: 2 });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(frames[2]);
  });

  it('applies both minDepth and maxDepth', () => {
    const result = filterByDepth(frames, { minDepth: 1, maxDepth: 3 });
    expect(result).toHaveLength(3);
  });

  it('counts from bottom when specified', () => {
    const result = filterByDepth(frames, { maxDepth: 1, countFrom: 'bottom' });
    expect(result).toHaveLength(2);
    expect(result[result.length - 1]).toBe(frames[4]);
  });
});

describe('stackDepth', () => {
  it('returns last index', () => {
    expect(stackDepth(frames)).toBe(4);
  });

  it('returns -1 for empty', () => {
    expect(stackDepth([])).toBe(-1);
  });
});

describe('frameAtDepth', () => {
  it('returns correct frame', () => {
    expect(frameAtDepth(frames, 2)).toBe(frames[2]);
  });

  it('returns undefined for out-of-range depth', () => {
    expect(frameAtDepth(frames, 99)).toBeUndefined();
  });
});

describe('formatDepthLabel', () => {
  it('formats label correctly', () => {
    expect(formatDepthLabel(2, 10)).toBe('[depth 2/10 (20%)]');
  });

  it('handles zero total', () => {
    expect(formatDepthLabel(0, 0)).toBe('[depth 0/0 (0%)]');
  });
});
