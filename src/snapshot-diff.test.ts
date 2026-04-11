import { frameKey, diffSnapshots, formatDiff } from './snapshot-diff';

const makeFrame = (file: string, line: number, col = 1) => ({
  file,
  line,
  column: col,
  functionName: 'fn',
  raw: `at fn (${file}:${line}:${col})`,
});

describe('frameKey', () => {
  it('returns a unique key for a frame', () => {
    const frame = makeFrame('/app/src/index.ts', 10);
    expect(frameKey(frame)).toBe('/app/src/index.ts:10:1');
  });
});

describe('diffSnapshots', () => {
  it('identifies added frames', () => {
    const snap1 = { id: 'a', frames: [], createdAt: 0 } as any;
    const snap2 = { id: 'b', frames: [makeFrame('/app/new.ts', 5)], createdAt: 1 } as any;
    const diff = diffSnapshots(snap1, snap2);
    expect(diff.added).toHaveLength(1);
    expect(diff.removed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
  });

  it('identifies removed frames', () => {
    const snap1 = { id: 'a', frames: [makeFrame('/app/old.ts', 3)], createdAt: 0 } as any;
    const snap2 = { id: 'b', frames: [], createdAt: 1 } as any;
    const diff = diffSnapshots(snap1, snap2);
    expect(diff.removed).toHaveLength(1);
    expect(diff.added).toHaveLength(0);
  });

  it('identifies unchanged frames', () => {
    const frame = makeFrame('/app/same.ts', 7);
    const snap1 = { id: 'a', frames: [frame], createdAt: 0 } as any;
    const snap2 = { id: 'b', frames: [frame], createdAt: 1 } as any;
    const diff = diffSnapshots(snap1, snap2);
    expect(diff.unchanged).toHaveLength(1);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });
});

describe('formatDiff', () => {
  it('formats a diff with added and removed frames', () => {
    const diff = {
      added: [makeFrame('/app/new.ts', 1)],
      removed: [makeFrame('/app/old.ts', 2)],
      unchanged: [makeFrame('/app/same.ts', 3)],
    };
    const output = formatDiff(diff);
    expect(output).toContain('+ ');
    expect(output).toContain('- ');
    expect(output).toContain('/app/new.ts');
    expect(output).toContain('/app/old.ts');
  });

  it('returns a no-changes message when diff is empty', () => {
    const output = formatDiff({ added: [], removed: [], unchanged: [] });
    expect(output).toContain('No differences');
  });
});
