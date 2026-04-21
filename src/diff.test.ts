import { formatDiffResult, diffResultToJson } from './diff';
import { jest } from '@jest/globals';
import * as snapshot from './snapshot';
import * as parser from './parser';
import * as snapshotDiff from './snapshot-diff';

const fakeFrameA = { file: 'src/a.ts', line: 10, column: 5, fn: 'funcA', raw: 'at funcA (src/a.ts:10:5)' };
const fakeFrameB = { file: 'src/b.ts', line: 20, column: 1, fn: 'funcB', raw: 'at funcB (src/b.ts:20:1)' };

const fakeDiff = { added: [fakeFrameB], removed: [fakeFrameA], unchanged: [] };

const fakeResult = {
  idA: 'snap-aaa',
  idB: 'snap-bbb',
  diff: fakeDiff,
  formattedAt: '2024-01-01T00:00:00.000Z',
};

describe('formatDiffResult', () => {
  it('includes both snapshot ids in output', () => {
    const out = formatDiffResult(fakeResult);
    expect(out).toContain('snap-aaa');
    expect(out).toContain('snap-bbb');
  });

  it('includes the generated timestamp', () => {
    const out = formatDiffResult(fakeResult);
    expect(out).toContain('2024-01-01T00:00:00.000Z');
  });
});

describe('diffResultToJson', () => {
  it('returns valid JSON', () => {
    const out = diffResultToJson(fakeResult);
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it('includes idA and idB in JSON', () => {
    const parsed = JSON.parse(diffResultToJson(fakeResult));
    expect(parsed.idA).toBe('snap-aaa');
    expect(parsed.idB).toBe('snap-bbb');
  });

  it('includes added and removed arrays', () => {
    const parsed = JSON.parse(diffResultToJson(fakeResult));
    expect(Array.isArray(parsed.added)).toBe(true);
    expect(Array.isArray(parsed.removed)).toBe(true);
  });
});
