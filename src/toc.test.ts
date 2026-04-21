import { buildToc, formatToc, getTocEntry } from './toc';
import { StackFrame } from './parser';

function makeFrame(overrides: Partial<StackFrame> = {}): StackFrame {
  return {
    file: '/home/user/project/src/app.ts',
    line: 10,
    column: 5,
    fn: 'myFunction',
    ...overrides,
  };
}

describe('buildToc', () => {
  it('builds entries for each frame', () => {
    const frames = [makeFrame(), makeFrame({ fn: 'otherFn', line: 20 })];
    const toc = buildToc(frames);
    expect(toc.totalFrames).toBe(2);
    expect(toc.entries).toHaveLength(2);
    expect(toc.entries[0].index).toBe(0);
    expect(toc.entries[1].index).toBe(1);
  });

  it('marks node_modules frames as non-user', () => {
    const frames = [
      makeFrame({ file: '/home/user/project/src/app.ts' }),
      makeFrame({ file: '/home/user/project/node_modules/express/index.js' }),
    ];
    const toc = buildToc(frames);
    expect(toc.entries[0].isUserFrame).toBe(true);
    expect(toc.entries[1].isUserFrame).toBe(false);
    expect(toc.userFrameCount).toBe(1);
  });

  it('uses provided userFrameIndices set', () => {
    const frames = [makeFrame(), makeFrame(), makeFrame()];
    const toc = buildToc(frames, new Set([0, 2]));
    expect(toc.entries[0].isUserFrame).toBe(true);
    expect(toc.entries[1].isUserFrame).toBe(false);
    expect(toc.entries[2].isUserFrame).toBe(true);
    expect(toc.userFrameCount).toBe(2);
  });

  it('handles frames with missing fields', () => {
    const frames = [makeFrame({ file: undefined, line: undefined, fn: undefined })];
    const toc = buildToc(frames);
    expect(toc.entries[0].file).toBe('(unknown)');
    expect(toc.entries[0].fn).toBe('(anonymous)');
    expect(toc.entries[0].line).toBe(0);
  });
});

describe('formatToc', () => {
  it('renders a header and entries', () => {
    const frames = [makeFrame()];
    const toc = buildToc(frames);
    const output = formatToc(toc);
    expect(output).toContain('Table of Contents');
    expect(output).toContain('[0]');
    expect(output).toContain('myFunction');
  });

  it('filters to user frames when onlyUser is set', () => {
    const frames = [
      makeFrame({ fn: 'userFn' }),
      makeFrame({ file: '/node_modules/lib/index.js', fn: 'libFn' }),
    ];
    const toc = buildToc(frames);
    const output = formatToc(toc, { onlyUser: true });
    expect(output).toContain('userFn');
    expect(output).not.toContain('libFn');
  });

  it('respects maxEntries', () => {
    const frames = [makeFrame({ fn: 'a' }), makeFrame({ fn: 'b' }), makeFrame({ fn: 'c' })];
    const toc = buildToc(frames);
    const output = formatToc(toc, { maxEntries: 2 });
    expect(output).toContain('a');
    expect(output).toContain('b');
    expect(output).not.toContain('c');
  });

  it('returns fallback when no entries match', () => {
    const toc = buildToc([]);
    expect(formatToc(toc)).toBe('(no frames)');
  });
});

describe('getTocEntry', () => {
  it('returns the entry for a valid index', () => {
    const toc = buildToc([makeFrame({ fn: 'hello' })]);
    const entry = getTocEntry(toc, 0);
    expect(entry?.fn).toBe('hello');
  });

  it('returns undefined for an invalid index', () => {
    const toc = buildToc([makeFrame()]);
    expect(getTocEntry(toc, 99)).toBeUndefined();
  });
});
