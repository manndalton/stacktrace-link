import { deduplicateFrames, findRecurringFrames, mergeDuplicateRuns, frameSignature } from './dedup';
import { StackFrame } from './parser';

function makeFrame(file: string, line: number, column = 1, fn = 'fn'): StackFrame {
  return { file, line, column, functionName: fn };
}

describe('frameSignature', () => {
  it('produces a unique string for a frame', () => {
    const f = makeFrame('/app/index.ts', 10, 5);
    expect(frameSignature(f)).toBe('/app/index.ts:10:5');
  });
});

describe('deduplicateFrames', () => {
  it('returns all frames when none are duplicated', () => {
    const frames = [makeFrame('/a.ts', 1), makeFrame('/b.ts', 2)];
    const result = deduplicateFrames(frames);
    expect(result.frames).toHaveLength(2);
    expect(result.duplicateCount).toBe(0);
  });

  it('removes duplicate frames and counts them', () => {
    const f = makeFrame('/a.ts', 1);
    const frames = [f, makeFrame('/b.ts', 2), { ...f }];
    const result = deduplicateFrames(frames);
    expect(result.frames).toHaveLength(2);
    expect(result.duplicateCount).toBe(1);
  });

  it('groups frames by signature', () => {
    const f = makeFrame('/a.ts', 1);
    const frames = [f, { ...f }, { ...f }];
    const result = deduplicateFrames(frames);
    const group = result.groups.get(frameSignature(f));
    expect(group).toHaveLength(3);
  });

  it('handles empty input', () => {
    const result = deduplicateFrames([]);
    expect(result.frames).toHaveLength(0);
    expect(result.duplicateCount).toBe(0);
  });
});

describe('findRecurringFrames', () => {
  it('returns frames appearing at least minCount times', () => {
    const a = makeFrame('/a.ts', 1);
    const b = makeFrame('/b.ts', 2);
    const frames = [a, { ...a }, { ...a }, b];
    const recurring = findRecurringFrames(frames, 2);
    expect(recurring).toHaveLength(1);
    expect(recurring[0].file).toBe('/a.ts');
  });

  it('returns empty when no frame meets threshold', () => {
    const frames = [makeFrame('/a.ts', 1), makeFrame('/b.ts', 2)];
    expect(findRecurringFrames(frames, 2)).toHaveLength(0);
  });
});

describe('mergeDuplicateRuns', () => {
  it('collapses consecutive identical frames', () => {
    const f = makeFrame('/a.ts', 1);
    const frames = [f, { ...f }, makeFrame('/b.ts', 2), { ...f }];
    const merged = mergeDuplicateRuns(frames);
    expect(merged).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(mergeDuplicateRuns([])).toHaveLength(0);
  });

  it('does not collapse non-consecutive duplicates', () => {
    const a = makeFrame('/a.ts', 1);
    const b = makeFrame('/b.ts', 2);
    const frames = [a, b, { ...a }];
    expect(mergeDuplicateRuns(frames)).toHaveLength(3);
  });
});
