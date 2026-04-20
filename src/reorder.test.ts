import { describe, it, expect } from 'vitest';
import {
  reverseFrames,
  outermostFirst,
  alphabeticalByFile,
  applyReorder,
  parseReorderStrategy,
} from './reorder';
import { StackFrame } from './parser';

function makeFrame(file: string, line: number): StackFrame {
  return { file, line, column: 1, fn: 'fn', raw: `at fn (${file}:${line}:1)` };
}

const frames: StackFrame[] = [
  makeFrame('/app/src/a.ts', 10),
  makeFrame('/app/src/b.ts', 5),
  makeFrame('/app/src/c.ts', 20),
];

describe('reverseFrames', () => {
  it('reverses the frame order', () => {
    const result = reverseFrames(frames);
    expect(result[0].file).toBe('/app/src/c.ts');
    expect(result[2].file).toBe('/app/src/a.ts');
  });

  it('does not mutate the original array', () => {
    reverseFrames(frames);
    expect(frames[0].file).toBe('/app/src/a.ts');
  });
});

describe('outermostFirst', () => {
  it('is equivalent to reverseFrames for standard stacks', () => {
    expect(outermostFirst(frames)).toEqual(reverseFrames(frames));
  });
});

describe('alphabeticalByFile', () => {
  it('sorts frames by file path then by line', () => {
    const mixed = [
      makeFrame('/app/src/c.ts', 1),
      makeFrame('/app/src/a.ts', 3),
      makeFrame('/app/src/a.ts', 1),
    ];
    const result = alphabeticalByFile(mixed);
    expect(result[0]).toEqual(makeFrame('/app/src/a.ts', 1));
    expect(result[1]).toEqual(makeFrame('/app/src/a.ts', 3));
    expect(result[2]).toEqual(makeFrame('/app/src/c.ts', 1));
  });
});

describe('applyReorder', () => {
  it('applies reverse strategy', () => {
    const result = applyReorder(frames, { strategy: 'reverse' });
    expect(result[0].file).toBe('/app/src/c.ts');
  });

  it('applies none strategy (identity)', () => {
    const result = applyReorder(frames, { strategy: 'none' });
    expect(result).toEqual(frames);
  });

  it('respects limit', () => {
    const result = applyReorder(frames, { strategy: 'none', limit: 2 });
    expect(result).toHaveLength(2);
  });

  it('applies alphabetical strategy', () => {
    const result = applyReorder(frames, { strategy: 'alphabetical' });
    expect(result[0].file).toBe('/app/src/a.ts');
  });
});

describe('parseReorderStrategy', () => {
  it('parses valid strategies', () => {
    expect(parseReorderStrategy('reverse')).toBe('reverse');
    expect(parseReorderStrategy('alphabetical')).toBe('alphabetical');
  });

  it('throws on unknown strategy', () => {
    expect(() => parseReorderStrategy('bogus')).toThrow('Unknown reorder strategy');
  });
});
